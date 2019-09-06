<template>
  <v-autocomplete-extended
    v-bind="$attrs"
    v-model="addItem"
    :items="searchResults"
    :filter="dontFilterByDisplayedText"
    :loading="isLoading"
    :search-input.sync="searchQuery"
    hide-no-data
    :item-text="metaboliteDisplay"
    item-value="mnx_id"
    return-object
    :rules="[...(rules || []), requestErrorRule(requestError)]"
    @change="onChange"
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
    clearOnChange: Boolean
  },
  data: () => ({
    addItem: null,
    searchResults: [] as MetaNetXMetabolite[],
    searchQuery: null,
    requestErrorRule: error =>
      !error ||
      "Could not search MetaNetX for compounds, please check your internet connection."
  }),
  watch: {
    searchQuery(query: string): void {
      this.searchResults = [];
      if (query === null || query.trim().length === 0) {
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
        .then(() => {
          this.isLoading = false;
        });
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

      this.$emit("change", selectedMetabolite);
    },
    dontFilterByDisplayedText() {
      return true;
    }
  }
});
</script>
