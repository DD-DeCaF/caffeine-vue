<template>
  <v-autocomplete-extended
    v-bind="$attrs"
    v-model="addItem"
    :items="searchResults"
    cache-items
    :filter="dontFilterByDisplayedText"
    :loading="isLoading"
    :search-input.sync="searchQuery"
    hide-no-data
    :item-text="metaboliteDisplay"
    item-value="mnx_id"
    return-object
    :rules="[...(rules || []), requestErrorRule(requestError)]"
    @change="onChange"
    @focus="loadForcedSearchQuery"
  ></v-autocomplete-extended>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import * as settings from "@/utils/settings";

export interface MetaNetXMetabolite {
  annotation: Annotation;
  name: string;
  mnx_id: string;
  formula: string;
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
    forceSearchQuery: String
  },
  data: () => ({
    addItem: null,
    searchResults: [] as MetaNetXMetabolite[],
    isLoading: false,
    searchQuery: null,
    requestError: false,
    selectedValue: null,
    requestErrorRule: error =>
      !error ||
      "Could not search MetaNetX for compounds, please check your internet connection."
  }),
  watch: {
    searchQuery(query: string): void {
      this.searchResults = [];
      if (
        query === null ||
        query.trim().length === 0 ||
        (this.selectedValue &&
          query === this.metaboliteDisplay(this.selectedValue))
      ) {
        return;
      }

      this.isLoading = true;
      this.requestError = false;
      axios
        .get(`${settings.apis.metanetx}/metabolites?query=${query}`)
        .then(response => {
          this.searchResults = response.data;
        })
        .catch(error => {
          this.requestError = true;
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    forceSearchQuery(): void {
      this.loadForcedSearchQuery();
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
