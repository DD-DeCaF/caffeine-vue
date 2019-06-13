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
    reactionDisplay(reaction): string {
      const { name, mnx_id, ec } = reaction.reaction;
      return `${name || "N/A"} (${mnx_id}) ${ec ? `EC:${ec}` : ""}`;
    },
    onChange(selectedReaction): void {
      this.addReactionSearchQuery = null;
      this.$nextTick(() => {
        this.addReactionItem = null;
      });
      this.$emit("change", selectedReaction);
    },
    dontFilterByDisplayedText() {
      return true;
    }
  }
});
</script>
