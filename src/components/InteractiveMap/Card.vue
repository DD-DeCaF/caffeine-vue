<template>
  <v-card class="mb-2">
    <v-toolbar
      dense
      :color="titleColor"
      class="white--text"
      :class="{ clickable: !isSelected }"
      @click="selectCard"
    >
      <v-toolbar-title class="body-2">{{ card.name }}</v-toolbar-title>
      <v-spacer></v-spacer>

      <CardDialog
        :card="card"
        :modifications="modifications"
        @simulate-card="simulateCard"
      />

      <v-btn flat icon v-if="!isOnlyCard" @click="removeCard">
        <v-icon color="white">close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-card-title primary-title class="py-2" v-if="isSelected">
      <v-container fluid class="pa-0">
        <v-layout>
          <v-flex>Organism:</v-flex>
          <v-flex class="text-xs-right">
            <span v-if="card.organism">{{ card.organism.name }}</span>
            <span v-else>
              <em>Unknown</em>
            </span>
          </v-flex>
        </v-layout>
      </v-container>
      <v-container fluid class="pa-0">
        <v-layout>
          <v-flex>Model:</v-flex>
          <v-flex class="text-xs-right">
            <span v-if="card.model">{{ card.model.name }}</span>
            <span v-else>
              <em>Not selected</em>
            </span>
          </v-flex>
        </v-layout>
      </v-container>
      <v-container fluid class="pa-0">
        <v-layout>
          <v-flex>Method:</v-flex>
          <v-flex class="text-xs-right">{{ card.method }}</v-flex>
        </v-layout>
      </v-container>
      <v-container fluid class="pa-0">
        <v-layout>
          <v-flex>Objective:</v-flex>
          <v-flex class="text-xs-right">
            <span v-if="card.objective.reaction === null">Growth</span>
            <span v-else>{{ card.objective.reaction.id }}</span>
            <v-icon v-if="card.objective.maximize" size="16"
              >arrow_upward</v-icon
            >
            <v-icon v-else size="16">arrow_downward</v-icon>
          </v-flex>
        </v-layout>
      </v-container>
      <v-container fluid class="pa-0">
        <v-layout wrap>
          <v-flex>Modifications:</v-flex>
          <v-flex class="text-xs-right">{{ modifications.length }}</v-flex>
        </v-layout>
      </v-container>
      <v-container fluid class="pa-0">
        <v-layout wrap>
          <v-flex>Growth rate:</v-flex>
          <v-flex class="text-xs-right">
            <div v-if="!card.isSimulating">
              <span
                v-if="card.growthRate !== null"
                :class="{ dead: card.growthRate === 0 }"
              >
                {{ card.growthRate | round }}
                <em>
                  h
                  <sup>-1</sup>
                </em>
              </span>
              <span v-else>N/A</span>
            </div>
            <div v-else>
              <v-progress-circular
                indeterminate
                size="12"
                :width="1"
              ></v-progress-circular>
            </div>
          </v-flex>
        </v-layout>
      </v-container>
      <v-container fluid class="pa-0">
        <v-layout wrap>
          <v-flex v-if="card.objective.reaction"
            >{{ card.objective.reaction.id }} flux:</v-flex
          >
          <v-flex class="text-xs-right" v-if="card.objective.reaction">
            <div v-if="!card.isSimulating">
              <span
                v-if="production != null"
                :class="{ dead: production === 0 }"
              >
                {{ production | round }}
                <em>
                  mmol/gDW/h
                  <sup>-1</sup>
                </em>
              </span>
              <span v-else>N/A</span>
            </div>
            <div v-else>
              <v-progress-circular
                indeterminate
                size="12"
                :width="1"
              ></v-progress-circular>
            </div>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card-title>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import * as settings from "@/settings";
import CardDialog from "@/components/InteractiveMap/CardDialog.vue";

export default Vue.extend({
  name: "Card",
  components: {
    CardDialog
  },
  props: ["card", "isOnlyCard", "isSelected"],
  filters: {
    round(value) {
      return value.toFixed(3);
    }
  },
  watch: {
    "card.model": {
      immediate: true,
      handler() {
        // Reset all modifications when the selected model changes.
        this.card.reactionAdditions = [];
        this.card.reactionKnockouts = [];
        this.card.geneKnockouts = [];
        this.card.editedBounds = [];

        // Fetch and set the full model
        this.card.fullModel = null;
        this.card.hasLoadModelError = false;
        if (this.card.model !== null) {
          axios
            .get(`${settings.apis.modelStorage}/models/${this.card.model.id}`)
            .then(response => {
              this.card.fullModel = response.data;
            })
            .catch(error => {
              this.card.hasLoadModelError = true;
              this.$emit("load-model-error");
            });
        }
      }
    }
  },
  computed: {
    titleColor() {
      if (this.card.hasSimulationError || this.card.hasLoadModelError) {
        return "error";
      } else if (this.isSelected) {
        return "primary";
      } else {
        return "grey";
      }
    },
    production() {
      // If the objective is growth, ignore production.
      if (this.card.objective.reaction.id === null) {
        return null;
      }
      if (this.card.method === "fba" || this.card.method == "pfba") {
        return this.card.fluxes[this.card.objective.reaction.id];
      } else if (this.card.method === "fva" || this.card.method == "pfba-fva") {
        // For FVA fluxes, calculate the average
        const rxn = this.card.fluxes[this.card.objective.reaction.id];
        return (rxn.upper_bound + rxn.lower_bound) / 2;
      }
    },
    modifications() {
      // Concatenate all modifications for a single table display, and add a
      // `type` key to distinguish the different modifications.
      const reactionAdditions = this.card.reactionAdditions.map(reaction => ({
        type: "added_reaction",
        ...reaction
      }));
      const reactionKnockouts = this.card.reactionKnockouts.map(reaction => ({
        type: "reaction_knockout",
        ...reaction
      }));
      const geneKnockouts = this.card.geneKnockouts.map(gene => ({
        type: "gene_knockout",
        ...gene
      }));
      const editedBounds = this.card.editedBounds.map(reaction => ({
        type: "edited_bounds",
        ...reaction
      }));
      return [
        ...reactionAdditions,
        ...reactionKnockouts,
        ...geneKnockouts,
        ...editedBounds
      ];
    }
  },
  methods: {
    selectCard() {
      this.$emit("select-card", this.card);
    },
    removeCard() {
      this.$emit("remove-card", this.card);
    },
    simulateCard() {
      this.$emit("simulate-card", this.card);
    }
  }
});
</script>

<style scoped>
.clickable {
  cursor: pointer;
}

.dead {
  color: red;
}
</style>
