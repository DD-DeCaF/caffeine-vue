<template>
  <div class="escher-container fill-height">
    <v-container
      fluid
      fill-height
      class="overlay"
      v-if="initializingEscher !== null || isLoadingMap"
    >
      <v-layout align-center justify-center>
        <v-progress-circular
          indeterminate
          size="40"
          :width="2"
          class="mr-2"
          color="white"
        ></v-progress-circular>
        <p class="display-1 white--text mb-0">
          <span v-if="initializingEscher !== null">Initializing Escher...</span>
          <span v-else-if="isLoadingMap">Loading map...</span>
        </p>
      </v-layout>
    </v-container>
    <div ref="escher" class="fill-height"></div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
/// <reference path="@/types/escher.d.ts" />
import * as escher from "@dd-decaf/escher";

export default Vue.extend({
  name: "Escher",
  props: ["mapData", "card"],
  data: () => ({
    escherBuilder: null,
    initializingEscher: null,
    isLoadingMap: false
  }),
  watch: {
    mapData(value) {
      const loadMap = () => {
        this.isLoadingMap = true;
        // Delay the actual loading of the map to give Vue time to update the
        // interface (after setting isLoadingMap to true). Otherwise, Escher
        // would freeze execution until it's complete and the user would never
        // actually see the loading message.
        setTimeout(() => {
          this.escherBuilder.load_map(value);
          this.isLoadingMap = false;
        }, 10);
      };

      // Wait for escher to initialize before loading the map.
      if (this.initializingEscher !== null) {
        this.initializingEscher.then(loadMap);
      } else {
        loadMap();
      }
    },
    // TODO: Watch added reactions
    // TODO: Watch highlight reactions (for data-driven simulations)
    "card.reactionKnockouts"(reactionKnockouts) {
      // TODO: Bug: Knockout X does not disappear when undoing knockout
      this.escherBuilder.set_knockout_reactions(reactionKnockouts);
      this.escherBuilder._update_data(true, true);
    },
    "card.geneKnockouts"(geneKnockouts) {
      // TODO: Bug: Knockout X does not disappear when undoing knockout
      this.escherBuilder.set_knockout_genes(geneKnockouts);
      this.escherBuilder._update_data(true, true);
    },
    "card.fluxes"(fluxes) {
      // Update the flux distribution
      if (fluxes === null) {
        this.escherBuilder.set_reaction_data(null);
      } else {
        if (this.card.method === "fba" || this.card.method == "pfba") {
          const fluxesFiltered = this.fluxFilter(fluxes);
          this.escherBuilder.set_reaction_data(fluxesFiltered);
          // Set FVA data with the current fluxes. This resets opacity in case a
          // previous FVA simulation has been set on the map.
          // TODO: We should improve the escher API here.
          this.escherBuilder.set_reaction_fva_data(fluxes);
        } else if (
          this.card.method === "fva" ||
          this.card.method == "pfba-fva"
        ) {
          // Render a flux distribution using the average values from the FVA
          // data.
          const fluxesAverage = {};
          Object.keys(fluxes).map(reaction => {
            const rxn = fluxes[reaction];
            const average = (rxn.upper_bound + rxn.lower_bound) / 2;
            fluxesAverage[reaction] = average;
          });
          const fluxesFiltered = this.fluxFilter(fluxesAverage);
          this.escherBuilder.set_reaction_data(fluxesFiltered);
          // Set the FVA data for transparency visualization.
          this.escherBuilder.set_reaction_fva_data(fluxes);
        }
      }
      this.escherBuilder._update_data(true, true);
    }
  },
  methods: {
    fluxFilter(fluxes) {
      // Exclude fluxes with very low non-zero values, in order to not shift
      // the escher color scale.
      const fluxesFiltered = {};
      Object.keys(fluxes).forEach(rxn => {
        if (Math.abs(fluxes[rxn]) > 1e-7) {
          fluxesFiltered[rxn] = fluxes[rxn];
        }
      });
      return fluxesFiltered;
    },
    getReactionState(id: string, type: string) {
      let existsInModel;
      // Note: Escher never seems to actually set type to "gene".
      if (type === "gene") {
        // TODO: Check model genes
        existsInModel = true;
      } else {
        // TODO: Check model reactions
        existsInModel = true;
      }

      return {
        includedInModel: existsInModel,
        knockout: this.card.reactionKnockouts.includes(id),
        knockoutGenes: this.card.geneKnockouts.includes(id),
        objective: this.card.objective,
        bounds: {
          // TODO: Check model
          lowerbound: -1,
          upperbound: -1
        }
      };
    },
    knockoutReaction(reactionId: string) {
      if (this.card.reactionKnockouts.includes(reactionId)) {
        // This reaction is already knocked out; undo it
        const index = this.card.reactionKnockouts.indexOf(reactionId);
        this.card.reactionKnockouts.splice(index, 1);
      } else {
        this.card.reactionKnockouts.push(reactionId);
      }
      this.$emit("simulate-card", this.card);
    },
    knockoutGene(geneId: string) {
      if (this.card.geneKnockouts.includes(geneId)) {
        // This gene is already knocked out; undo it
        const index = this.card.geneKnockouts.indexOf(geneId);
        this.card.geneKnockouts.splice(index, 1);
      } else {
        this.card.geneKnockouts.push(geneId);
      }
      this.$emit("simulate-card", this.card);
    },
    setObjective(reactionId: string) {
      if (this.card.objective.reactionId === reactionId) {
        // This is already the objective; undo it and reset to growth
        this.card.objective.reactionId = null;
        this.card.objective.direction = "max";
      } else {
        this.card.objective.reactionId = reactionId;
      }
      this.$emit("simulate-card", this.card);
    },
    setObjectiveDirection(reactionId: string) {
      if (this.card.objective.direction === "max") {
        this.card.objective.direction = "min";
      } else {
        this.card.objective.direction = "max";
      }
      this.$emit("simulate-card", this.card);
    },
    editBounds(reactionId: string, lower: string, upper: string) {
      // TODO
    },
    resetBounds(reactionId: string) {
      // TODO
    }
  },
  mounted() {
    this.initializingEscher = new Promise((resolve, reject) => {
      this.escherBuilder = escher.Builder(null, null, null, this.$refs.escher, {
        menu: "zoom",
        scroll_behavior: "zoom",
        fill_screen: false,
        ignore_bootstrap: true,
        never_ask_before_quit: true,
        reaction_styles: ["color", "size", "text", "abs"],
        identifiers_on_map: "bigg_id",
        hide_all_labels: false,
        hide_secondary_metabolites: false,
        highlight_missing: true,
        reaction_scale: [
          { type: "min", color: "#A841D0", size: 20 },
          { type: "Q1", color: "#868BB2", size: 20 },
          { type: "Q3", color: "#6DBFB0", size: 20 },
          { type: "max", color: "#54B151", size: 20 }
        ],
        reaction_no_data_color: "#CBCBCB",
        reaction_no_data_size: 10,
        tooltip: "custom",
        enable_editing: false,
        enable_fva_opacity: true,
        show_gene_reaction_rules: true,
        zoom_extent_canvas: true,
        first_load_callback: () => {
          resolve();
          this.initializingEscher = null;
          this.$emit("escher-loaded");
        },
        reaction_state: this.getReactionState,
        tooltip_callbacks: {
          knockout: this.knockoutReaction,
          knockoutGenes: this.knockoutGene,
          setAsObjective: this.setObjective,
          objectiveDirection: this.setObjectiveDirection,
          changeBounds: this.editBounds,
          resetBounds: this.resetBounds
        }
      });
    });
  }
});
</script>

<style>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.15);
}
</style>
