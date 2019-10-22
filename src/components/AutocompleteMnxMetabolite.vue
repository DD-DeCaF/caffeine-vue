<template>
  <v-autocomplete-extended
    v-bind="$attrs"
    v-model="selectedItem"
    :items="searchResults"
    :filter="dontFilterByDisplayedText"
    :loading="isLoading"
    :search-input.sync="searchQuery"
    :placeholder="forceSearchQuery"
    hide-no-data
    hide-selected
    item-text="displayValue"
    item-value="mnx_id"
    return-object
    :rules="[...(rules || []), requestErrorRule(requestError)]"
    @change="onChange"
    @focus="loadForcedSearchQuery"
    @paste="$emit('paste', $event)"
    ref="metaboliteAutocomplete"
  >
    <template v-slot:item="{ item: metabolite }">
      <v-list-tile-content>
        <v-list-tile-title v-text="metabolite.displayValue"></v-list-tile-title>
        <v-list-tile-sub-title v-if="metabolite.modelNames.size">
          <span
            v-for="(modelName, index) of metabolite.modelNames"
            :key="modelName + index"
            >{{ modelName }}&nbsp;&nbsp;</span
          ></v-list-tile-sub-title
        >
      </v-list-tile-content>
    </template>
  </v-autocomplete-extended>
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
  modelNames?: Set<string>;
  displayValue?: string;
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
    forceSearchQuery: String,
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
    searchQuery: {
      handler(newValue, oldValue) {
        // Catch cases when vuetify internally sets the search query to null
        // to prevent sending extra requests to the metanetx service
        if (newValue === null) {
          this.searchQuery = oldValue;
        }
        this.debouncedQuery();
      }
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
      // Trigger focus event when pasting data to autoselect metabolite with
      // the exact match (without focus vuetify internally clears the search
      // query when items are an empty array)
      // Skip if search results exist (in which case pasted data didn't
      // match result from metanetx service) to avoid infinite requests
      if (this.forceSearchQuery && !this.searchResults.length) {
        // Using vuetify internals: focus, isFocused
        this.$refs.metaboliteAutocomplete.focus();
      }
      this.searchResults = [];
      if (this.searchQuery === null || this.searchQuery.trim().length === 0) {
        return;
      }
      if (
        this.selectedItem &&
        this.searchQuery === this.selectedItem.displayValue
      ) {
        // In order to keep selected metabolite displayed after clicking
        // outside of the v-autocomplete, this metabolite should be
        // listed in the items prop
        this.searchResults = [this.selectedItem];
        return;
      }

      this.isLoading = true;
      this.requestError = false;
      // Create a unique reference for this search, to be compared when results return.
      // If `activeSearchID` has changed by the time the results are ready, then a new
      // request has been triggered, so the results for this search are irrelevant and
      // will be ignored. This ensures that we don't overwrite the search results with
      // results from a stale request.
      const searchId = uuidv4();
      this.activeSearchID = searchId;
      axios
        .get(`${settings.apis.metanetx}/metabolites?query=${this.searchQuery}`)
        .then(response => {
          if (searchId !== this.activeSearchID) {
            return;
          }
          // Prioritize metabolites that exist in the passed models
          const searchResultsInTheModel = [] as MetaNetXMetabolite[];
          const searchResultsNotInTheModel = [] as MetaNetXMetabolite[];
          response.data.forEach((metabolite: MetaNetXMetabolite) => {
            const deprecatedIds = metabolite.annotation["deprecated"] || [];
            const metaboliteIdsMap = {
              ...metabolite.annotation,
              "metanetx.chemical": [metabolite.mnx_id, ...deprecatedIds]
            };
            delete metaboliteIdsMap["deprecated"];
            let isMetaboliteFound = false;
            metabolite.modelNames = new Set([]);
            for (const model in this.metabolitesInModelsMap) {
              const [modelId, modelName] = JSON.parse(model);
              for (const namespace in metaboliteIdsMap) {
                metaboliteIdsMap[namespace].forEach(metaboliteId => {
                  if (this.metabolitesInModelsMap[model].has(metaboliteId)) {
                    isMetaboliteFound = true;
                    metabolite.modelNames!.add(modelName);
                    metabolite.foundId = metaboliteId;
                    metabolite.namespace = namespace;
                  }
                });
              }
            }
            metabolite.displayValue = this.metaboliteDisplay(metabolite);
            if (isMetaboliteFound) {
              searchResultsInTheModel.push(metabolite);
            } else {
              metabolite.namespace = "metanetx.chemical";
              searchResultsNotInTheModel.push(metabolite);
            }
          });
          if (this.modelIds && this.modelIds.length) {
            this.searchResults.push({ header: "Found in the models" });
          }
          this.searchResults.push(...searchResultsInTheModel);
          if (this.modelIds && this.modelIds.length) {
            this.searchResults.push(
              { divider: true },
              { header: "Other compounds" }
            );
          }
          this.searchResults.push(...searchResultsNotInTheModel);
          // If pasted metabolite has the exact match with the first result
          // from metanetx service, it should be autoselected
          if (this.searchQuery === this.forceSearchQuery) {
            const exactMatch = [
              searchResultsInTheModel[0],
              searchResultsNotInTheModel[0]
            ].find(searchResult => {
              if (!searchResult) {
                return false;
              }
              const metaboliteIds = flatten(
                Object.values(searchResult.annotation)
              );
              const exactValues = new Set(metaboliteIds);
              exactValues.add(searchResult.mnx_id);
              exactValues.add(searchResult.name);

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
        });
    }, 500);
  },
  methods: {
    metaboliteDisplay(metabolite: MetaNetXMetabolite): string {
      const { name, mnx_id, formula } = metabolite;
      return `${name || "N/A"} (${mnx_id}) – ${formula}`;
    },
    onChange(selectedMetabolite: MetaNetXMetabolite): void {
      if (this.clearOnChange) {
        this.searchQuery = null;
        this.$nextTick(() => {
          this.selectedItem = null;
        });
      }
      const metabolite = {
        id: selectedMetabolite.foundId || selectedMetabolite.mnx_id,
        name: selectedMetabolite.name,
        formula: selectedMetabolite.formula,
        namespace: selectedMetabolite.namespace
      };
      this.$emit("change", metabolite);
    },
    dontFilterByDisplayedText(): boolean {
      return true;
    },
    loadForcedSearchQuery(): void {
      if (!this.forceSearchQuery) {
        return;
      }
      this.searchQuery = this.forceSearchQuery;
    }
  }
});
</script>
