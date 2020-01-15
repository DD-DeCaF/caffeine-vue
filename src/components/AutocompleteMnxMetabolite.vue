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
        :placeholder="passedMetabolite ? passedMetabolite._pastedText : ''"
        hide-no-data
        hide-selected
        :item-text="metaboliteDisplay"
        item-value="mnxId"
        return-object
        :rules="[requestErrorRule(requestError), ...(rules || [])]"
        clearable
        @change="onChange"
        @paste="$emit('paste', $event)"
        @click:clear="$emit('clear')"
        ref="metaboliteAutocomplete"
        v-on="on"
      >
        <template v-slot:item="{ item: metabolite }">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-list-tile-content v-on="on">
                <v-list-tile-title
                  v-text="metaboliteDisplay(metabolite)"
                ></v-list-tile-title>
                <v-list-tile-sub-title
                  v-if="metaboliteModelNamesMap[metabolite.mnxId].size"
                >
                  <span
                    v-for="(modelName, index) of metaboliteModelNamesMap[
                      metabolite.mnxId
                    ]"
                    :key="modelName + index"
                    >{{ modelName }}&nbsp;&nbsp;</span
                  ></v-list-tile-sub-title
                >
              </v-list-tile-content>
            </template>
            <span>
              <em>Name: </em>{{ metabolite.name }}<br />
              <em>ID: </em>{{ metabolite.id }}<br />
              <em>Formula: </em>{{ metabolite.formula }}<br />
              <em>MetaNetX ID: </em>{{ metabolite.mnxId }}<br />
              <em>Annotation:</em><br />
              <span
                v-for="(ids, namespace) in metabolite.annotation"
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
      <em>Formula: </em>{{ selectedItem.formula }}<br />
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
import { getMetaboliteId } from "@/utils/metabolite";
import { mapGetters } from "vuex";

export interface MetaNetXMetabolite {
  annotation: Annotation;
  name: string;
  mnx_id: string;
  formula: string;
  foundId?: string; // exists if was found in the passed models
  namespace?: string;
}

export interface Annotation {
  bigg: string[];
  chebi: string[];
  deprecated: string[];
  hmdb: string[];
  kegg: string[];
  metacyc: string[];
  seed: string[];
  reactome: string[];
  sabiork: string[];
  envipath: string[];
  lipidmaps: string[];
  slm: string[];
}

export default Vue.extend({
  name: "AutocompleteMnxMetabolite",
  inheritAttrs: false,
  props: {
    rules: [Array, Object],
    clearOnChange: Boolean,
    passedMetabolite: Object as Prop<Object>,
    modelIds: Array as Prop<Array<string>>
  },
  data: () => ({
    selectedItem: null,
    searchResults: [] as MetaNetXMetabolite[],
    isLoading: false,
    searchQuery: null,
    activeSearchID: null,
    requestError: false,
    debouncedQuery: null,
    metabolitesInModelsMap: {},
    metaboliteModelNamesMap: {},
    requestErrorRule: error =>
      !error ||
      "Could not search MetaNetX for compounds, please check your internet connection."
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
    passedMetabolite: {
      immediate: true,
      handler() {
        if (
          this.passedMetabolite &&
          !this.passedMetabolite.hasOwnProperty("_pastedText")
        ) {
          this.selectedItem = this.passedMetabolite;
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
            this.metabolitesInModelsMap = {};
            this.modelIds.forEach(modelId => {
              const model = this.getModelById(modelId);
              const key = JSON.stringify([model.id, model.name]);
              this.metabolitesInModelsMap[key] = new Set([]);
              model.model_serialized.metabolites.forEach(metabolite =>
                this.metabolitesInModelsMap[key].add(
                  getMetaboliteId(metabolite.id, metabolite.compartment)
                )
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
            this.searchQuery === this.metaboliteDisplay(this.selectedItem)
          ) {
            // In order to keep selected metabolite displayed after clicking
            // outside of the v-autocomplete, this metabolite should be
            // listed in the items prop
            return {
              searchResultsInTheModel: [],
              searchResultsNotInTheModel: [this.selectedItem]
            };
          }

          return axios
            .get(
              `${settings.apis.metanetx}/metabolites?query=${this.searchQuery}`
            )
            .then(response => {
              if (searchId !== this.activeSearchID) {
                throw "stale response";
              }
              // Prioritize metabolites that exist in the passed models
              const searchResultsInTheModel = [] as Object[];
              const searchResultsNotInTheModel = [] as Object[];
              response.data.forEach((mnxMetabolite: MetaNetXMetabolite) => {
                let isMetaboliteFound = false;
                this.metaboliteModelNamesMap[mnxMetabolite.mnx_id] = new Set(
                  []
                );
                for (const model in this.metabolitesInModelsMap) {
                  const [modelId, modelName] = JSON.parse(model);
                  for (const namespace in mnxMetabolite.annotation) {
                    mnxMetabolite.annotation[namespace].forEach(
                      metaboliteId => {
                        if (
                          this.metabolitesInModelsMap[model].has(metaboliteId)
                        ) {
                          isMetaboliteFound = true;
                          this.metaboliteModelNamesMap[
                            mnxMetabolite.mnx_id
                          ].add(modelName);
                          mnxMetabolite.foundId = metaboliteId;
                          mnxMetabolite.namespace = namespace;
                        }
                      }
                    );
                  }
                }
                const metabolite = {
                  id: mnxMetabolite.foundId || mnxMetabolite.mnx_id,
                  name: mnxMetabolite.name,
                  formula: mnxMetabolite.formula,
                  namespace: mnxMetabolite.namespace || "metanetx.chemical",
                  mnxId: mnxMetabolite.mnx_id,
                  annotation: mnxMetabolite.annotation
                };
                if (isMetaboliteFound) {
                  searchResultsInTheModel.push(metabolite);
                } else {
                  searchResultsNotInTheModel.push(metabolite);
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
                  { header: "Other compounds" },
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
    metaboliteDisplay(metabolite): string {
      const { name, id, formula } = metabolite;
      return `${name || "N/A"} (${id}) – ${formula}`;
    },
    onChange(selectedMetabolite): void {
      if (!selectedMetabolite) {
        return;
      }
      if (this.clearOnChange) {
        this.searchQuery = null;
        this.$nextTick(() => {
          this.selectedItem = null;
        });
      }
      this.$emit("change", selectedMetabolite);
    },
    dontFilterByDisplayedText(): boolean {
      return true;
    }
  }
});
</script>
