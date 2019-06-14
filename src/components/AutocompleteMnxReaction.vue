<template>
  <v-autocomplete
    v-bind="$attrs"
    v-model="addReactionItem"
    :items="addReactionSearchResults"
    :filter="dontFilterByDisplayedText"
    :loading="isLoadingAddReaction"
    :search-input.sync="addReactionSearchQuery"
    hide-no-data
    :item-text="reactionDisplay"
    item-value="reaction.mnx_id"
    return-object
    :rules="[...(rules || []), requestErrorRule(requestError)]"
    @change="onChange"
  ></v-autocomplete>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import * as settings from "@/utils/settings";
import { Reaction } from "@/store/modules/interactiveMap";

interface MetaNetXReaction {
  compartments: {
    annotation: Annotation;
    mnx_id: string;
    name: string;
    xref: string;
  }[];
  metabolites: {
    annotation: Annotation;
    name: string;
    mnx_id: string;
  }[];
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
}

interface Annotation {
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
  name: "AutocompleteMnxReaction",
  inheritAttrs: false,
  props: ["rules"],
  data: () => ({
    addReactionItem: null,
    addReactionSearchResults: [],
    isLoadingAddReaction: false,
    addReactionSearchQuery: null,
    requestError: false,
    requestErrorRule: error =>
      !error ||
      "Could not search MetaNetX for reactions, please check your internet connection."
  }),
  watch: {
    addReactionSearchQuery(query: string): void {
      this.addReactionSearchResults = [];
      if (query === null || query.trim().length === 0) {
        return;
      }

      this.isLoadingAddReaction = true;
      this.requestError = false;
      axios
        .get(`${settings.apis.metanetx}/reactions?query=${query}`)
        .then(response => {
          this.addReactionSearchResults = response.data;
        })
        .catch(error => {
          this.requestError = true;
        })
        .then(() => {
          this.isLoadingAddReaction = false;
        });
    }
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
    onChange(selectedReaction: MetaNetXReaction): void {
      this.addReactionSearchQuery = null;
      this.$nextTick(() => {
        this.addReactionItem = null;
      });

      const reaction: Reaction = {
        id: selectedReaction.reaction.mnx_id,
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
            // TODO: use m.compartment_id, mapped through selectedReaction.annotations
            compartment: "",
            stoichiometry: m.coefficient
          };
        })
      };
      this.$emit("change", reaction);
    },
    dontFilterByDisplayedText() {
      return true;
    }
  }
});
</script>
