<template>
  <v-tooltip bottom :disabled="!protein">
    <template v-slot:activator="{ on }">
      <v-text-field
        label="Protein"
        v-model="searchQuery"
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
      <em>Name: </em>{{ protein.name }}<br />
      <em>Identifier: </em>{{ protein.identifier }}<br />
      <em>Gene: </em>{{ protein.gene }}<br />
    </span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { debounce } from "lodash";

export default Vue.extend({
  name: "UniprotInput",
  props: {
    rules: [Array, Object],
    forceSearchQuery: String
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
    forceSearchQuery: {
      // Watcher needs to be immediate to trigger when copy-paste creates
      // new rows with forceSearchQuery already set
      immediate: true,
      handler() {
        if (!this.forceSearchQuery) {
          return;
        }
        if (this.forceSearchQuery === this.searchQuery) {
          // User re-pasted the same query string. Trigger a search directly,
          // because the `searchQuery` watcher won't trigger when it hasn't
          // changed.
          this.triggerQuery();
        } else {
          this.searchQuery = this.forceSearchQuery;
        }
      }
    },
    searchQuery: {
      // Watcher needs to be immediate to trigger when copy-paste creates
      // new rows with forceSearchQuery already set
      immediate: true,
      handler() {
        this.triggerQuery();
      }
    }
  },
  created() {
    this.debouncedQuery = debounce(this.query, 500);
  },
  methods: {
    hint() {
      if (this.protein) {
        return `<a href="https://www.uniprot.org/uniprot/${
          this.protein.identifier
        }" target="_blank">${this.protein.identifier}</a> (${
          this.protein.name
        })`;
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
    query(identifier: string) {
      axios
        .get(`https://www.uniprot.org/uniprot/${identifier}.xml`)
        .then(response => {
          // Parse the XML response, looking for name, identifier and gene.
          const doc = new DOMParser().parseFromString(
            response.data,
            "text/xml"
          );
          const name = doc.querySelector(
            "entry > protein > recommendedName > fullName"
          );
          const identifier = doc.querySelector("entry > name");
          const gene = doc.querySelector("entry > gene > name[type='primary']");
          this.protein = {
            name: name ? name.innerHTML : "Unknown",
            identifier: identifier ? identifier.innerHTML : "Unknown",
            gene: gene ? gene.innerHTML : "Unknown"
          };
          this.$emit("change", this.protein);
        })
        .catch(error => {
          if (error.response && error.response.status === 404) {
            // Not found - no need to take action; since `this.protein` is
            // already null and will not pass validation.
          } else {
            this.requestError = true;
          }
        })
        .then(() => {
          this.isLoading = false;
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.protein-table {
  width: 100%;

  th {
    text-align: left;
  }
}
</style>
