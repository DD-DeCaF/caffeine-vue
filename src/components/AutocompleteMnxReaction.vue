<template>
  <v-tooltip bottom :disabled="!selectedItem">
    <template v-slot:activator="{ on }">
      <v-autocomplete-extended
        v-bind="$attrs"
        v-model="selectedItem"
        :items="searchResults"
        :filter="dontFilterByDisplayedText"
        :loading="isLoading"
        :search-input="searchQuery"
        @update:searchInput="onSearchQueryChange"
        :placeholder="forceSearchQuery"
        hide-no-data
        hide-selected
        item-text="displayValue"
        item-value="reaction.mnx_id"
        return-object
        :rules="[requestErrorRule(requestError), ...(rules || [])]"
        clearable
        @change="onChange"
        @focus="loadForcedSearchQuery"
        @paste="$emit('paste', $event)"
        @click:clear="$emit('clear')"
        ref="reactionAutocomplete"
        v-on="on"
      >
        <template v-slot:item="{ item: reaction }">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-list-tile-content v-on="on">
                <v-list-tile-title
                  v-text="reaction.displayValue"
                ></v-list-tile-title>
                <v-list-tile-sub-title v-if="reaction.modelNames.size">
                  <span
                    v-for="(modelName, index) of reaction.modelNames"
                    :key="modelName + index"
                    >{{ modelName }}&nbsp;&nbsp;</span
                  ></v-list-tile-sub-title
                >
              </v-list-tile-content>
            </template>
            <span>
              <em>Name: </em>{{ reaction.reaction.name }}<br />
              <em>ID found in the model: </em
              >{{ reaction.foundId ? reaction.foundId : "-" }}<br />
              <em>Reaction string: </em>{{ equationDisplay(reaction) }}<br />
              <em>MetaNetX ID: </em>{{ reaction.reaction.mnx_id }}<br />
              <em>Annotation:</em><br />
              <span
                v-for="(ids, namespace) in reaction.reaction.annotation"
                :key="namespace"
              >
                &nbsp;&nbsp;{{ namespace }}:
                <span v-for="(id, index) of ids" :key="index"
                  >{{ id }}&nbsp;&nbsp;</span
                ><br />
              </span>
            </span>
          </v-tooltip>
        </template>
      </v-autocomplete-extended>
    </template>
    <span v-if="selectedItem">
      <em>Name: </em>{{ selectedItem.reaction.name }}<br />
      <em>ID found in the model: </em
      >{{ selectedItem.foundId ? selectedItem.foundId : "-" }}<br />
      <em>Reaction string: </em>{{ equationDisplay(selectedItem) }}<br />
      <em>MetaNetX ID: </em>{{ selectedItem.reaction.mnx_id }}<br />
      <em>Annotation:</em><br />
      <span
        v-for="(ids, namespace) in selectedItem.reaction.annotation"
        :key="namespace"
      >
        &nbsp;&nbsp;{{ namespace }}: {{ ids.join(" ") }} <br />
      </span>
    </span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { debounce, flatten } from "lodash";
import uuidv4 from "uuid/v4";
import { Prop } from "vue/types/options";
import * as settings from "@/utils/settings";
import { Reaction } from "@/store/modules/interactiveMap";
import {
  MetaNetXMetabolite,
  Annotation
} from "./AutocompleteMnxMetabolite.vue";
import { mapGetters } from "vuex";

export interface MetaNetXReaction {
  compartments: {
    annotation: Annotation;
    mnx_id: string;
    name: string;
    xref: string;
  }[];
  metabolites: MetaNetXMetabolite[];
  reaction: {
    mnx_id: string;
    name: string | undefined;
    ec: string;
    equation_string: string;
    equation_parsed: {
      coefficient: number;
      compartment_id: string;
      metabolite_id: string;
    }[];
    annotation: Annotation;
  };
  modelNames?: Set<string>;
  displayValue?: string;
  foundId?: string; // exists if was found in the passed models
  namespace?: string;
}

export default Vue.extend({
  name: "AutocompleteMnxReaction",
  inheritAttrs: false,
  props: {
    rules: [Array, Object],
    clearOnChange: Boolean,
    forceSearchQuery: String,
    modelIds: Array as Prop<Array<string>>
  },
  data: () => ({
    selectedItem: null,
    searchResults: [] as MetaNetXReaction[],
    isLoading: false,
    searchQuery: null,
    skipVuetifyClearSearch: false,
    activeSearchID: null,
    requestError: false,
    debouncedQuery: null,
    reactionsInModelsMap: {},
    requestErrorRule: error =>
      !error ||
      "Could not search MetaNetX for reactions, please check your internet connection."
  }),
  computed: {
    ...mapGetters({
      getModelById: "models/getModelById"
    })
  },
  watch: {
    searchQuery() {
      this.debouncedQuery();
    },
    forceSearchQuery: {
      // Watcher needs to be immediate to trigger when copy-paste creates
      // new rows with forceSearchQuery already set
      immediate: true,
      handler() {
        this.loadForcedSearchQuery();
      }
    },
    modelIds: {
      immediate: true,
      handler() {
        if (this.modelIds) {
          Promise.all(
            this.modelIds.map(modelId =>
              this.$store.dispatch("models/withFullModel", modelId)
            )
          ).then(() => {
            this.reactionsInModelsMap = {};
            this.modelIds.forEach(modelId => {
              const model = this.getModelById(modelId);
              const key = JSON.stringify([model.id, model.name]);
              this.reactionsInModelsMap[key] = new Set([]);
              model.model_serialized.reactions.forEach(reaction =>
                this.reactionsInModelsMap[key].add(reaction.id)
              );
            });
          });
        }
      }
    }
  },
  created() {
    this.debouncedQuery = debounce(() => {
      // Create a unique reference for this search, to be compared when results return.
      // If `activeSearchID` has changed by the time the results are ready, then a new
      // request has been triggered, so the results for this search are irrelevant and
      // will be ignored. This ensures that we don't overwrite the search results with
      // results from a stale request.
      const searchId = uuidv4();
      this.activeSearchID = searchId;

      this.isLoading = true;
      this.requestError = false;
      this.skipVuetifyClearSearch = !!this.forceSearchQuery;

      Promise.resolve()
        // Fetch search results
        .then(() => {
          if (
            this.searchQuery === null ||
            this.searchQuery.trim().length === 0
          ) {
            return {
              searchResultsInTheModel: [],
              searchResultsNotInTheModel: []
            };
          }

          if (
            this.selectedItem &&
            this.searchQuery === this.selectedItem.displayValue
          ) {
            // In order to keep selected reaction displayed after clicking
            // outside of the v-autocomplete, this reaction should be
            // listed in the items prop
            return {
              searchResultsInTheModel: [],
              searchResultsNotInTheModel: [this.selectedItem]
            };
          }

          return axios
            .get(
              `${settings.apis.metanetx}/reactions?query=${this.searchQuery}`
            )
            .then(response => {
              if (searchId !== this.activeSearchID) {
                throw "stale response";
              }
              // Prioritize reactions that exist in the passed models
              const searchResultsInTheModel = [] as MetaNetXReaction[];
              const searchResultsNotInTheModel = [] as MetaNetXReaction[];
              response.data.forEach((reaction: MetaNetXReaction) => {
                const deprecatedIds =
                  reaction.reaction.annotation["deprecated"] || [];
                const reactionIdsMap = {
                  ...reaction.reaction.annotation,
                  "metanetx.reaction": [
                    reaction.reaction.mnx_id,
                    ...deprecatedIds
                  ]
                };
                delete reactionIdsMap["deprecated"];
                let isReactionFound = false;
                reaction.modelNames = new Set([]);
                for (const model in this.reactionsInModelsMap) {
                  const [modelId, modelName] = JSON.parse(model);
                  for (const namespace in reactionIdsMap) {
                    reactionIdsMap[namespace].forEach(reactionId => {
                      if (this.reactionsInModelsMap[model].has(reactionId)) {
                        isReactionFound = true;
                        reaction.modelNames!.add(modelName);
                        reaction.foundId = reactionId;
                        reaction.namespace = namespace;
                      }
                    });
                  }
                }
                reaction.displayValue = this.reactionDisplay(reaction);
                if (isReactionFound) {
                  searchResultsInTheModel.push(reaction);
                } else {
                  reaction.namespace = "metanetx.reaction";
                  searchResultsNotInTheModel.push(reaction);
                }
              });

              return {
                searchResultsInTheModel: searchResultsInTheModel,
                searchResultsNotInTheModel: searchResultsNotInTheModel
              };
            });
        })
        // Use results
        .then(({ searchResultsInTheModel, searchResultsNotInTheModel }) => {
          if (searchId !== this.activeSearchID) {
            return;
          }

          this.searchResults =
            searchResultsInTheModel.length > 0
              ? [
                  { header: "Found in the models" },
                  ...searchResultsInTheModel,
                  { divider: true },
                  { header: "Other reactions" },
                  ...searchResultsNotInTheModel
                ]
              : searchResultsNotInTheModel;

          // If pasted reaction has the exact match with the first result
          // from metanetx service, it should be autoselected
          if (this.searchQuery === this.forceSearchQuery) {
            const exactMatch = [
              searchResultsInTheModel[0],
              searchResultsNotInTheModel[0]
            ].find(searchResult => {
              if (!searchResult) {
                return false;
              }
              const reactionIds = flatten(
                Object.values(searchResult.reaction.annotation)
              );
              const exactValues = new Set(reactionIds);
              exactValues.add(searchResult.reaction.mnx_id);
              exactValues.add(searchResult.reaction.name);
              exactValues.add(searchResult.reaction.ec);

              return exactValues.has(this.searchQuery);
            });

            if (exactMatch) {
              this.selectedItem = exactMatch;
              this.onChange(this.selectedItem);
            }
          }
        })
        .catch(error => {
          if (searchId !== this.activeSearchID) {
            return;
          }
          this.requestError = true;
        })
        .then(() => {
          if (searchId !== this.activeSearchID) {
            return;
          }
          this.isLoading = false;
          this.skipVuetifyClearSearch = false;
        });
    }, 500);
  },
  methods: {
    reactionDisplay(reaction: MetaNetXReaction): string {
      const { name, mnx_id, ec, equation_parsed } = reaction.reaction;
      return `${name || "N/A"} (${mnx_id}) ${
        ec ? `EC:${ec}` : ""
      } – ${this.equationDisplay(reaction)}`;
    },
    equationDisplay(reaction: MetaNetXReaction): string {
      const { equation_parsed } = reaction.reaction;

      const substrates = equation_parsed
        .filter(e => e.coefficient < 0)
        .map(e => ({ ...e, coefficient: -e.coefficient }));
      const products = equation_parsed.filter(e => e.coefficient > 0);

      const substratesSerialized = substrates
        .map(({ coefficient, metabolite_id }) => {
          const fullMetabolite = reaction.metabolites.find(
            ({ mnx_id }) => mnx_id === metabolite_id
          );
          // TODO: print compartment_id, mapped through annotations
          return `${coefficient} \`${fullMetabolite!.name}\``;
        })
        .join(" + ");
      const productsSerialized = products
        .map(({ coefficient, metabolite_id }) => {
          const fullMetabolite = reaction.metabolites.find(
            ({ mnx_id }) => mnx_id === metabolite_id
          );
          // TODO: print compartment_id, mapped through annotations
          return `${coefficient} \`${fullMetabolite!.name}\``;
        })
        .join(" + ");

      return (
        (substratesSerialized || "Ø") + " ⇌ " + (productsSerialized || "Ø")
      );
    },
    onSearchQueryChange(value: string | null): void {
      // Catch cases when vuetify internally sets the search query to null
      // to prevent sending extra requests to the metanetx service
      if (value === null && this.skipVuetifyClearSearch) {
        return;
      }
      this.searchQuery = value;
    },
    onChange(selectedReaction: MetaNetXReaction): void {
      if (!selectedReaction) {
        return;
      }
      if (this.clearOnChange) {
        this.searchQuery = null;
        this.$nextTick(() => {
          this.selectedItem = null;
        });
      }
      const reaction: Reaction = {
        id: selectedReaction.foundId || selectedReaction.reaction.mnx_id,
        name: selectedReaction.reaction.name || "",
        // TODO: rebuild reaction string more consistently, from equation_parsed
        reactionString: this.equationDisplay(selectedReaction),
        // Note: Assuming all reactions in the universal model are
        // reversible, but this might not be the case. Could potentially use
        // the reaction string to check reversibility.
        lowerBound: -1000,
        upperBound: 1000,
        metabolites: selectedReaction.reaction.equation_parsed.map(m => {
          const fullMetabolite = selectedReaction.metabolites.find(
            ({ mnx_id }) => mnx_id === m.metabolite_id
          );
          return {
            id: m.metabolite_id,
            name: fullMetabolite ? fullMetabolite.name : "",
            formula: fullMetabolite ? fullMetabolite.formula : "",
            // TODO: use m.compartment_id, mapped through selectedReaction.annotations
            compartment: "",
            stoichiometry: m.coefficient
          };
        }),
        namespace: selectedReaction.namespace
      };

      this.$emit("change", {
        reaction: reaction,
        mnxReaction: selectedReaction
      });
    },
    dontFilterByDisplayedText(): boolean {
      return true;
    },
    loadForcedSearchQuery(): void {
      if (!this.forceSearchQuery) {
        return;
      }
      // Assign early, before debounced query because species selection dialog
      // takes away focus and vuetify tries to clear search.
      this.skipVuetifyClearSearch = true;
      this.searchQuery = this.forceSearchQuery;
    }
  }
});
</script>
