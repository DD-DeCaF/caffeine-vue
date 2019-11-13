<template>
  <v-tooltip bottom :disabled="!selectedItem">
    <template v-slot:activator="{ on }">
      <v-autocomplete-extended
        v-bind="$attrs"
        v-model="selectedItem"
        :items="searchResults"
        :filter="dontFilterByDisplayedText"
        :loading="isLoading"
        :search-input.sync="searchQuery"
        :placeholder="passedReaction ? passedReaction._pastedText : ''"
        hide-no-data
        hide-selected
        :item-text="reactionDisplay"
        item-value="mnxId"
        return-object
        :rules="[requestErrorRule(requestError), ...(rules || [])]"
        clearable
        @change="onChange"
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
                  v-text="reactionDisplay(reaction)"
                ></v-list-tile-title>
                <v-list-tile-sub-title
                  v-if="reactionModelNamesMap[reaction.mnxId].size"
                >
                  <span
                    v-for="(modelName, index) of reactionModelNamesMap[
                      reaction.mnxId
                    ]"
                    :key="modelName + index"
                    >{{ modelName }}&nbsp;&nbsp;</span
                  ></v-list-tile-sub-title
                >
              </v-list-tile-content>
            </template>
            <span>
              <em>Name: </em>{{ reaction.name }}<br />
              <em>ID: </em>{{ reaction.id }}<br />
              <em>Reaction string: </em>{{ reaction.reactionString }}<br />
              <em>MetaNetX ID: </em>{{ reaction.mnxId }}<br />
              <em>Annotation:</em><br />
              <span
                v-for="(ids, namespace) in reaction.annotation"
                :key="namespace"
              >
                &nbsp;&nbsp;{{ namespace }}: {{ ids.join(" ") }}<br />
              </span>
            </span>
          </v-tooltip>
        </template>
      </v-autocomplete-extended>
    </template>
    <span v-if="selectedItem">
      <em>Name: </em>{{ selectedItem.name }}<br />
      <em>ID: </em>{{ selectedItem.id }}<br />
      <em>Reaction string: </em>{{ selectedItem.reactionString }}<br />
      <em>MetaNetX ID: </em>{{ selectedItem.mnxId }}<br />
      <em>Annotation:</em><br />
      <span
        v-for="(ids, namespace) in selectedItem.annotation"
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
import { mapMnxReactionToReaction } from "@/utils/reaction";
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
  foundId?: string; // exists if was found in the passed models
  namespace?: string;
}

export default Vue.extend({
  name: "AutocompleteMnxReaction",
  inheritAttrs: false,
  props: {
    rules: [Array, Object],
    clearOnChange: Boolean,
    passedReaction: Object as Prop<Reaction>,
    modelIds: Array as Prop<Array<string>>
  },
  data: () => ({
    selectedItem: null,
    searchResults: [] as MetaNetXReaction[],
    isLoading: false,
    searchQuery: null,
    activeSearchID: null,
    requestError: false,
    debouncedQuery: null,
    reactionsInModelsMap: {},
    reactionModelNamesMap: {},
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
    passedReaction: {
      immediate: true,
      handler() {
        if (
          this.passedReaction &&
          !this.passedReaction.hasOwnProperty("_pastedText")
        ) {
          this.selectedItem = this.passedReaction;
          this.searchResults = [this.selectedItem];
        }
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
            this.searchQuery === this.reactionDisplay(this.selectedItem)
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
              const searchResultsInTheModel = [] as Reaction[];
              const searchResultsNotInTheModel = [] as Reaction[];
              response.data.forEach((mnxReaction: MetaNetXReaction) => {
                let isReactionFound = false;
                this.reactionModelNamesMap[
                  mnxReaction.reaction.mnx_id
                ] = new Set([]);
                for (const model in this.reactionsInModelsMap) {
                  const [modelId, modelName] = JSON.parse(model);
                  for (const namespace in mnxReaction.reaction.annotation) {
                    mnxReaction.reaction.annotation[namespace].forEach(
                      reactionId => {
                        if (this.reactionsInModelsMap[model].has(reactionId)) {
                          isReactionFound = true;
                          this.reactionModelNamesMap[
                            mnxReaction.reaction.mnx_id
                          ].add(modelName);
                          mnxReaction.foundId = reactionId;
                          mnxReaction.namespace = namespace;
                        }
                      }
                    );
                  }
                }
                const reaction: Reaction = mapMnxReactionToReaction(
                  mnxReaction
                );
                if (isReactionFound) {
                  searchResultsInTheModel.push(reaction);
                } else {
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
        });
    }, 500);
  },
  methods: {
    reactionDisplay(reaction: Reaction): string {
      return `${reaction.name || "N/A"} (${reaction.id}) ${
        reaction.ec ? `EC:${reaction.ec}` : ""
      } – ${reaction.reactionString}`;
    },
    onChange(selectedReaction: Reaction): void {
      if (!selectedReaction) {
        return;
      }
      if (this.clearOnChange) {
        this.searchQuery = null;
        this.$nextTick(() => {
          this.selectedItem = null;
        });
      }
      this.$emit("change", selectedReaction);
    },
    dontFilterByDisplayedText(): boolean {
      return true;
    }
  }
});
</script>
