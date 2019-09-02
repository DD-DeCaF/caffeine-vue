<template>
  <v-autocomplete-extended
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
  ></v-autocomplete-extended>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { Observable, of, concat } from "rxjs";
import { map, filter, startWith, switchMap, share } from "rxjs/operators";
import * as settings from "@/utils/settings";
import { Reaction } from "@/store/modules/interactiveMap";

export interface MetaNetXReaction {
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
    formula: string;
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
    addReactionSearchResults: [] as MetaNetXReaction[],
    addReactionSearchQuery: null,
    requestErrorRule: error =>
      !error ||
      "Could not search MetaNetX for reactions, please check your internet connection."
  }),
  subscriptions(this) {
    const query$ = this.$watchAsObservable("addReactionSearchQuery").pipe(
      map(query => query.newValue as string),
      startWith(null),
      switchMap(query => {
        if (query === null || query.trim().length === 0) {
          return of({
            status: "responded" as "responded",
            results: [] as MetaNetXReaction[]
          });
        }

        return concat(
          of({
            status: "searching" as "searching",
            query: query
          }),
          axios
            .get<MetaNetXReaction[]>(
              `${settings.apis.metanetx}/reactions?query=${query}`
            )
            .then(
              response => ({
                status: "responded" as "responded",
                results: response.data
              }),
              error => ({
                status: "error" as "error",
                error: error
              })
            )
        );
      }),
      share()
    );

    return {
      addReactionSearchResults: query$.pipe(
        filter(r => r.status === "responded"),
        map(r => r.status === "responded" && r.results)
      ),
      requestError: query$.pipe(map(r => r.status === "error")),
      isLoadingAddReaction: query$.pipe(map(r => r.status === "searching"))
    };
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
            formula: fullMetabolite ? fullMetabolite.formula : "",
            // TODO: use m.compartment_id, mapped through selectedReaction.annotations
            compartment: "",
            stoichiometry: m.coefficient
          };
        })
      };

      this.$emit("change", {
        reaction: reaction,
        mnxReaction: selectedReaction
      });
    },
    dontFilterByDisplayedText() {
      return true;
    }
  }
});
</script>
