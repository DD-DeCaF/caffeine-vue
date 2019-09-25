<template>
  <v-autocomplete-extended
    v-bind="$attrs"
    v-model="addItem"
    :items="searchResults"
    :filter="dontFilterByDisplayedText"
    :loading="isLoading"
    :search-input.sync="searchQuery"
    hide-no-data
    item-text="displayValue"
    item-value="mnx_id"
    return-object
    :rules="[...(rules || []), requestErrorRule(requestError)]"
    @change="onChange"
    @focus="loadForcedSearchQuery"
    @paste="$emit('paste', $event)"
  >
    <template v-slot:item="{ item: metabolite }">
      <v-list-tile-content>
        <v-list-tile-title v-text="metabolite.displayValue"></v-list-tile-title>
        <v-list-tile-sub-title v-if="metabolite.modelNames.length">
          <span
            v-for="(modelName, index) in metabolite.modelNames"
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
import { debounce } from "lodash";
import uuidv4 from "uuid/v4";
import { Prop } from "vue/types/options";
import * as settings from "@/utils/settings";
import { getMetaboliteId } from "@/utils/metabolite";

export interface MetaNetXMetabolite {
  annotation: Annotation;
  name: string;
  mnx_id: string;
  formula: string;
  modelNames?: Array<string>;
  displayValue?: string;
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
    addItem: null,
    searchResults: [] as MetaNetXMetabolite[],
    isLoading: false,
    searchQuery: null,
    activeSearchID: null,
    requestError: false,
    selectedValue: null,
    metabolitesInModelsMap: {},
    requestErrorRule: error =>
      !error ||
      "Could not search MetaNetX for compounds, please check your internet connection."
  }),
  watch: {
    searchQuery: debounce(function() {
      this.searchResults = [];
      if (this.searchQuery === null || this.searchQuery.trim().length === 0) {
        return;
      }
      if (
        this.selectedValue &&
        this.searchQuery === this.selectedValue.displayValue
      ) {
        // In order to keep selected metabolite displayed after clicking
        // outside of the v-autocomplete, this metabolite should be
        // listed in the items prop
        this.searchResults = [this.selectedValue];
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
            const annotation = metabolite.annotation;
            const metaboliteIds = [metabolite.mnx_id];
            for (const namespace in annotation) {
              annotation[namespace].forEach(metaboliteId =>
                metaboliteIds.push(metaboliteId)
              );
            }
            let isMetaboliteFound = false;
            metabolite.modelNames = [];
            for (const modelName in this.metabolitesInModelsMap) {
              if (
                metaboliteIds.some(metaboliteId =>
                  this.metabolitesInModelsMap[modelName].has(metaboliteId)
                )
              ) {
                isMetaboliteFound = true;
                metabolite.modelNames.push(modelName);
              }
            }
            metabolite.displayValue = this.metaboliteDisplay(metabolite);
            if (isMetaboliteFound) {
              searchResultsInTheModel.push(metabolite);
            } else {
              searchResultsNotInTheModel.push(metabolite);
            }
          });
          if (this.modelIds && this.modelIds.length) {
            this.searchResults.push({ header: "Found in the models" });
          }
          this.searchResults.push(...searchResultsInTheModel);
          if (this.modelIds && this.modelIds.length) {
            this.searchResults.push({ divider: true }, { header: "MetaNetX" });
          }
          this.searchResults.push(...searchResultsNotInTheModel);
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
    }, 500),
    forceSearchQuery(): void {
      this.loadForcedSearchQuery();
    },
    modelIds: {
      immediate: true,
      handler() {
        this.metabolitesInModelsMap = {};
        if (this.modelIds) {
          axios
            .all(
              this.modelIds.map(modelId =>
                axios.get(`${settings.apis.modelStorage}/models/${modelId}`)
              )
            )
            .then((response: any) => {
              response.forEach(responseItem => {
                this.metabolitesInModelsMap[responseItem.data.name] = new Set(
                  []
                );
                responseItem.data.model_serialized.metabolites.forEach(
                  metabolite =>
                    this.metabolitesInModelsMap[responseItem.data.name].add(
                      getMetaboliteId(metabolite.id, metabolite.compartment)
                    )
                );
              });
            })
            .catch(error => {
              this.$store.commit("setFetchError", error);
            });
        }
      }
    }
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
          this.addItem = null;
        });
      }
      this.selectedValue = selectedMetabolite;
      this.$emit("change", selectedMetabolite);
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
