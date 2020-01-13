<template>
  <v-tooltip bottom :disabled="!protein">
    <template v-slot:activator="{ on }">
      <v-text-field
        v-model="searchQuery"
        :placeholder="passedProtein ? passedProtein._pastedText : ''"
        :loading="isLoading"
        :hint="hint()"
        persistent-hint
        :rules="[requestErrorRule(requestError), ...(rules || [])]"
        clearable
        @paste="$emit('paste', $event)"
        @click:clear="$emit('clear')"
        v-on="on"
      ></v-text-field>
    </template>
    <span v-if="protein">
      <em>Identifier: </em>{{ protein.identifier }}<br />
      <em>Name: </em>{{ protein.name }}<br />
      <em>Full name: </em>{{ protein.fullName }}<br />
      <em>Gene: </em>{{ protein.gene }}<br />
    </span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { debounce } from "lodash";
import { tsvParse } from "d3-dsv";

export default Vue.extend({
  name: "UniprotInput",
  props: {
    rules: [Array, Object],
    passedProtein: Object
  },
  data: () => ({
    debouncedQuery: null,
    searchQuery: "",
    isLoading: false,
    requestError: false,
    requestErrorRule: error =>
      !error ||
      "Could not query UniProtKB. Their service or your internet connection might be down.",
    protein: null
  }),
  computed: {},
  watch: {
    searchQuery() {
      if (
        this.passedProtein &&
        this.searchQuery === this.passedProtein.uniprotId
      ) {
        return;
      }
      this.triggerQuery();
    },
    passedProtein: {
      immediate: true,
      handler() {
        if (this.passedProtein) {
          // To display pasted uniprot id, we need to assign it to searchQuery
          this.searchQuery = this.passedProtein.uniprotId;
          this.protein = this.passedProtein;
        }
      }
    }
  },
  created() {
    this.debouncedQuery = debounce(this.query, 500);
  },
  methods: {
    hint() {
      if (this.protein) {
        return `<a href="https://www.uniprot.org/uniprot/${this.protein.identifier}" target="_blank">${this.protein.identifier}</a> (${this.protein.fullName})`;
      } else {
        return `Enter any valid <a href="https://www.uniprot.org/uniprot/" target="_blank">UniProtKB identifier</a>.`;
      }
    },
    triggerQuery() {
      // Reset state
      this.protein = null;
      this.requestError = false;
      this.$emit("change", this.protein);
      // For empty query; no need to make request
      if (!this.searchQuery) {
        return;
      }
      // Pretend we already started searching, even though it's debounced
      this.isLoading = true;
      // Note: Didn't yet implement cancelling stale requests here. Should
      // rarely results in wrong response order though, because of the 500ms
      // debounce.
      // Note 2: Needs to happen during next tick, since `created` lifecycle
      // event hasn't occurred when this watcher triggers immediately.
      this.$nextTick(() => {
        this.debouncedQuery(this.searchQuery);
      });
    },
    query(uniprotId: string) {
      axios
        .get(`https://www.uniprot.org/uniprot/`, {
          params: {
            query: uniprotId,
            format: "tab",
            columns:
              "id,protein_names,entry_name,genes(PREFERRED),genes(ALTERNATIVE),genes(OLN),genes(ORF)"
          }
        })
        .then(response => {
          // The API query appears to match loosely on free text and yields
          // multiple results. We care about exact identifier matches, so try to
          // find one among the results.
          const parsedResponse = tsvParse(response.data).find(
            item => item["Entry"] === uniprotId
          );
          if (!parsedResponse) {
            // Not found. No need to do any explicit error handling, since
            // `this.protein` is already null and will not pass validation.
            return;
          }
          // The protein name field includes both recommended name, and
          // alternative names in parentheses. Use only the recommended name.
          let proteinName = parsedResponse["Protein names"] || "Unknown";
          const index = proteinName.indexOf("(");
          if (index !== -1) {
            proteinName = proteinName.substring(0, index).trim();
          }
          this.protein = {
            identifier: parsedResponse["Entry"] || "Unknown",
            name: parsedResponse["Entry name"] || "Unknown",
            fullName: proteinName,
            gene: {
              primary: parsedResponse["Gene names  (primary )"]
                ? parsedResponse["Gene names  (primary )"].split(" ")
                : [],
              synonym: parsedResponse["Gene names  (synonym )"]
                ? parsedResponse["Gene names  (synonym )"].split(" ")
                : [],
              orderedLocus: parsedResponse["Gene names  (ordered locus )"]
                ? parsedResponse["Gene names  (ordered locus )"].split(" ")
                : [],
              orf: parsedResponse["Gene names  (ORF )"]
                ? parsedResponse["Gene names  (ORF )"].split(" ")
                : []
            },
            uniprotId: uniprotId
          };
          this.$emit("change", this.protein);
        })
        .catch(error => {
          this.requestError = true;
        })
        .then(() => {
          this.isLoading = false;
        });
    }
  }
});
</script>
