<template>
  <span>
    <a v-if="link" :href="link" target="_blank">{{ identifier }}</a>
    <span v-else>{{ identifier }} ({{ namespace }})</span>
  </span>
</template>

<script lang="ts">
/**
 * For a given compound identifier + namespace, link to the relevant database if the
 * namespace is recognized. Otherwise, simply print the identifier and namespace.
 */

import Vue from "vue";

export default Vue.extend({
  name: "CompoundLink",
  props: ["identifier", "namespace"],
  computed: {
    link() {
      if (this.namespace === "bigg.metabolite") {
        return `http://bigg.ucsd.edu/universal/metabolites/${this.identifier}`;
      } else if (this.namespace === "chebi") {
        return `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${this.identifier}`;
      } else {
        return null;
      }
    }
  }
});
</script>
