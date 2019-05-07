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
      <v-layout wrap>
        <v-flex class="xs6">Organism:</v-flex>
        <v-flex class="xs6 text-xs-right">
          <span v-if="card.organism">{{ card.organism.name }}</span>
          <span v-else>
            <em>Unknown</em>
          </span>
        </v-flex>
        <v-flex class="xs6">Model:</v-flex>
        <v-flex class="xs6 text-xs-right">
          <span v-if="card.model">{{ card.model.name }}</span>
          <span v-else>
            <em>Not selected</em>
          </span>
        </v-flex>
        <v-flex class="xs6">Method:</v-flex>
        <v-flex class="xs6 text-xs-right">{{ card.method }}</v-flex>
        <v-flex class="xs6">Objective:</v-flex>
        <v-flex class="xs6 text-xs-right">
          <span v-if="card.objective.reactionId === null">Growth</span>
          <span v-else>{{ card.objective.reactionId }}</span>
          <v-icon v-if="card.objective.direction === 'max'" size="16"
            >arrow_upward</v-icon
          >
          <v-icon v-else size="16">arrow_downward</v-icon>
        </v-flex>
        <v-flex class="xs6">Modifications:</v-flex>
        <v-flex class="xs6 text-xs-right">{{ modifications.length }}</v-flex>
        <v-flex class="xs6">Growth rate:</v-flex>
        <v-flex class="xs6 text-xs-right">
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
        <v-flex class="xs6" v-if="card.objective.reactionId !== null"
          >{{ card.objective.reactionId }} flux:</v-flex
        >
        <v-flex
          class="xs6 text-xs-right"
          v-if="card.objective.reactionId !== null"
        >
          <div v-if="!card.isSimulating">
            <span
              v-if="card.growthRate !== null"
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
    </v-card-title>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import CardDialog from "@/components/InteractiveMap/CardDialog.vue";

export default Vue.extend({
  name: "Card",
  components: {
    CardDialog
  },
  data: () => ({
    methods: [
      { id: "fba", name: "Flux Balance Analysis (FBA)" },
      { id: "pfba", name: "Parsimonious FBA" },
      { id: "fva", name: "Flux Variability Analysis (FVA)" },
      { id: "pfba-fva", name: "Parsimonious FVA" }
    ],
    modificationsHeaders: [
      { text: "Modifications", value: "type", sortable: false },
      { text: "Name or ID", value: "id", sortable: false },
      { text: "Details", value: "details", sortable: false }
    ]
  }),
  props: ["card", "isOnlyCard", "isSelected"],
  filters: {
    round(value) {
      return value.toFixed(3);
    }
  },
  watch: {
    "card.model"() {
      // Reset all modifications when the selected model changes.
      this.card.reactionAdditions = [];
      this.card.reactionKnockouts = [];
      this.card.geneKnockouts = [];
      this.card.editedBounds = [];
    }
  },
  computed: {
    titleColor() {
      if (this.card.hasSimulationError) {
        return "error";
      } else if (this.isSelected) {
        return "primary";
      } else {
        return "grey";
      }
    },
    production() {
      // If the objective is growth, ignore production.
      if (this.card.objective.reactionId === null) {
        return null;
      }
      return this.card.fluxes[this.card.objective.reactionId];
    },
    modifications() {
      // Concatenate all modifications for a single table display.
      // TODO: Added reactions
      const addedReactions = [];
      const reactionKnockouts = this.card.reactionKnockouts.map(reactionId => ({
        type: "Reaction knockout",
        name: `Name TBD (${reactionId})`, // TODO: Reaction name
        details: ""
      }));
      const geneKnockouts = this.card.geneKnockouts.map(geneId => ({
        type: "Gene knockout",
        name: geneId,
        details: "" // Would be nice to show related reactions here.
      }));
      const editedBounds = this.card.editedBounds.map(bounds => ({
        type: "Modified bounds",
        name: `Name TBD (${bounds.reactionId})`, // TODO: Reaction name
        details: `Bounds set from ${bounds.lowerBound} to ${bounds.upperBound}`
      }));
      return [
        ...addedReactions,
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
