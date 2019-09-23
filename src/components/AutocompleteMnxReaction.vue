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
    item-value="reaction.mnx_id"
    return-object
    :rules="[...(rules || []), requestErrorRule(requestError)]"
    @change="onChange"
    @focus="loadForcedSearchQuery"
  >
    <template v-slot:item="{ item: reaction }">
      <v-list-tile-content>
        <v-list-tile-title v-text="reaction.displayValue"></v-list-tile-title>
        <v-list-tile-sub-title v-if="reaction.modelNames.length">
          <span
            v-for="(modelName, index) in reaction.modelNames"
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
import * as settings from "@/utils/settings";
import { Reaction } from "@/store/modules/interactiveMap";
import {
  MetaNetXMetabolite,
  Annotation
} from "./AutocompleteMnxMetabolite.vue";

export interface MetaNetXReaction {
  compartments: {
    annotation: Annotation;
    mnx_id: string;
    name: string;
    xref: string;
  }[];
  metabolites: MetaNetXMetabolite[];
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
  modelNames?: Array<string>;
  displayValue?: string;
}

export default Vue.extend({
  name: "AutocompleteMnxReaction",
  inheritAttrs: false,
  props: {
    rules: [Array, Object],
    clearOnChange: Boolean,
    forceSearchQuery: String,
    modelIds: Array
  },
  data: () => ({
    addItem: null,
    searchResults: [] as MetaNetXReaction[],
    isLoading: false,
    searchQuery: null,
    activeSearchID: null,
    requestError: false,
    selectedValue: null,
    reactionsInModelsMap: {},
    requestErrorRule: error =>
      !error ||
      "Could not search MetaNetX for reactions, please check your internet connection."
  }),
  watch: {
    searchQuery: debounce(function() {
      this.searchResults = [];
      if (this.searchQuery === null || this.searchQuery.trim().length === 0) {
        return;
      }
      if (
        this.selectedValue && this.searchQuery === this.selectedValue.displayValue
      ) {
        // In order to keep selected reaction displayed after clicking
        // outside of the v-autocomplete, this reaction should be
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
        .get(`${settings.apis.metanetx}/reactions?query=${this.searchQuery}`)
        .then(response => {
          if (searchId !== this.activeSearchID) {
            return;
          }
          // Prioritize reactions that exist in the passed models
          const searchResultsInTheModel = [] as MetaNetXReaction[];
          const searchResultsNotInTheModel = [] as MetaNetXReaction[];
          response.data.forEach((reaction: MetaNetXReaction) => {
            const annotation = reaction.reaction.annotation;
            const reactionIds = [reaction.reaction.mnx_id];
            for (const namespace in annotation) {
              annotation[namespace].forEach(reactionId =>
                reactionIds.push(reactionId)
              );
            }
            let isReactionFound = false;
            reaction.modelNames = [];
            for (const modelName in this.reactionsInModelsMap) {
              if (
                reactionIds.some(reactionId =>
                  this.reactionsInModelsMap[modelName].has(reactionId)
                )
              ) {
                isReactionFound = true;
                reaction.modelNames.push(modelName);
              }
            }
            reaction.displayValue = this.reactionDisplay(reaction);
            if (isReactionFound) {
              searchResultsInTheModel.push(reaction);
            } else {
              searchResultsNotInTheModel.push(reaction);
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
        this.reactionsInModelsMap = {};
        if (this.modelIds) {
          axios
            .all(
              this.modelIds.map(modelId =>
                axios.get(`${settings.apis.modelStorage}/models/${modelId}`)
              )
            )
            .then(response => {
              response.forEach(responseItem => {
                this.reactionsInModelsMap[responseItem.data.name] = new Set([]);
                responseItem.data.model_serialized.reactions.forEach(reaction =>
                  this.reactionsInModelsMap[responseItem.data.name].add(
                    reaction.id
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
      if (this.clearOnChange) {
        this.searchQuery = null;
        this.$nextTick(() => {
          this.addItem = null;
        });
      }
      this.selectedValue = selectedReaction;
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
