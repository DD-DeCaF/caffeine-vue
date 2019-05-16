<template>
  <div class="escher-container fill-height" @click="$emit('click')">
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
    <v-snackbar color="error" v-model="hasBoundsError" :timeout="6000">
      Invalid bounds. Please make sure that the upper bound is larger than or
      equal to the lower bound.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
/// <reference path="@/types/escher.d.ts" />
import * as escher from "@dd-decaf/escher";
import * as bigg from "@/utils/bigg";

export default Vue.extend({
  name: "Escher",
  props: ["mapData", "card"],
  data: () => ({
    escherBuilder: null,
    initializingEscher: null,
    isLoadingMap: false,
    hasBoundsError: false
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
    "card.fullModel": {
      // Important note: This watcher *must* run before the
      // `card.reactionAdditions` watcher below, because reactions added to the
      // model must be available to Escher. Therefore, this watcher must be
      // ordered first here.
      deep: true,
      handler(fullModel) {
        if (this.card === null || fullModel === null) {
          this.escherBuilder.load_model(null);
        } else {
          this.escherBuilder.load_model(fullModel.model_serialized);
        }
      }
    },
    "card.reactionAdditions"(reactionAdditions) {
      if (this.card === null) {
        this.escherBuilder.set_added_reactions([]);
      } else {
        this.escherBuilder.set_added_reactions(
          reactionAdditions.filter(r => !r.id.startsWith("DM_")).map(r => r.id)
        );
      }
      this.escherBuilder._update_data(true, true);
    },
    "card.reactionKnockouts"(reactionKnockouts) {
      if (this.card === null) {
        this.escherBuilder.set_knockout_reactions([]);
      } else {
        this.escherBuilder.set_knockout_reactions(
          reactionKnockouts.map(r => r.id)
        );
      }
      this.escherBuilder._update_data(true, true);
    },
    "card.geneKnockouts"(geneKnockouts) {
      if (this.card === null) {
        this.escherBuilder.set_knockout_genes([]);
      } else {
        this.escherBuilder.set_knockout_genes(geneKnockouts.map(g => g.id));
      }
      this.escherBuilder._update_data(true, true);
    },
    "card.conditionData"() {
      if (!this.card || !this.card.conditionData) {
        this.escherBuilder.set_highlight_reactions([]);
        return;
      }
      this.escherBuilder.set_highlight_reactions(
        this.card.conditionData.measurements.map(m => m.id)
      );
    },
    "card.fluxes"(fluxes) {
      // Update the flux distribution
      if (this.card === null || fluxes === null) {
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
      // Note that this is a method, not a computed property from the card
      // fluxes, because the fluxes data structure will vary depending on the
      // simulation method.
      const fluxesFiltered = {};
      Object.keys(fluxes).forEach(rxn => {
        if (Math.abs(fluxes[rxn]) > 1e-7) {
          fluxesFiltered[rxn] = fluxes[rxn];
        }
      });
      return fluxesFiltered;
    },
    getObjectState(id: string, type: string) {
      if (
        this.card === null ||
        this.card.fullModel === null ||
        this.card.dataDriven
      ) {
        return {
          includedInModel: false,
          bounds: {}
        };
      }
      if (type === "gene") {
        return this.getGeneState(id);
      } else {
        return this.getReactionState(id);
      }
    },
    getReactionState(id: string) {
      const modelReaction = this.card.fullModel.model_serialized.reactions.find(
        r => r.id === id
      );
      const editedBounds = this.card.editedBounds.find(r => r.id === id);
      // Resolve the current reaction bounds
      let bounds;
      if (editedBounds !== undefined) {
        // The reaction bounds are modified locally, so show those values.
        bounds = {
          lowerbound: editedBounds.lowerBound,
          upperbound: editedBounds.upperBound
        };
      } else if (modelReaction !== undefined) {
        // Show the bounds that are set as default in model.
        bounds = {
          lowerbound: modelReaction.lower_bound,
          upperbound: modelReaction.upper_bound
        };
      } else {
        // The reaction is not in the model, so bounds are unknown
        bounds = {
          lowerbound: null,
          upperbound: null
        };
      }
      return {
        includedInModel: modelReaction !== undefined,
        knockout: this.card.reactionKnockouts.some(r => r.id === id),
        knockoutGenes: false,
        objective: {
          reactionId: this.card.objective.reaction
            ? this.card.objective.reaction.id
            : null,
          direction: this.card.objective.maximize ? "max" : "min"
        },
        bounds: bounds
      };
    },
    getGeneState(id: string, type: string) {
      return {
        includedInModel: this.card.fullModel.model_serialized.genes.some(
          g => g.id === id
        ),
        knockout: false,
        knockoutGenes: this.card.geneKnockouts.some(g => g.id === id),
        objective: null,
        bounds: null
      };
    },
    knockoutReaction(reactionId: string) {
      const reaction = bigg.lookupReaction(reactionId);

      // Check if the reaction is already knocked out.
      const index = this.card.reactionKnockouts.findIndex(
        reaction => reaction.id === reactionId
      );
      if (index !== -1) {
        // This reaction is already knocked out; undo the knockout.
        this.card.reactionKnockouts.splice(index, 1);
      } else {
        this.card.reactionKnockouts.push(reaction);
      }
      this.$emit("simulate-card", this.card);
    },
    knockoutGene(geneId: string) {
      const gene = bigg.lookupGene(
        this.card.fullModel.model_serialized.id,
        geneId
      );

      const index = this.card.geneKnockouts.findIndex(
        gene => gene.id === geneId
      );
      if (index !== -1) {
        // This gene is already knocked out; undo it
        this.card.geneKnockouts.splice(index, 1);
      } else {
        this.card.geneKnockouts.push(gene);
      }
      this.$emit("simulate-card", this.card);
    },
    setObjective(reactionId: string) {
      const reaction = bigg.lookupReaction(reactionId);

      if (
        this.card.objective.reaction !== null &&
        this.card.objective.reaction.id === reaction.id
      ) {
        // This is already the objective; undo it and reset to growth
        this.card.objective.reaction = null;
        this.card.objective.maximize = true;
      } else {
        this.card.objective.reaction = reaction;
      }
      this.$emit("simulate-card", this.card);
    },
    setObjectiveDirection(reactionId: string) {
      this.card.objective.maximize = !this.card.objective.maximize;
      this.$emit("simulate-card", this.card);
    },
    editBounds(reactionId: string, lower: string, upper: string) {
      const lowerBound = parseFloat(lower);
      const upperBound = parseFloat(upper);

      if (lowerBound > upperBound) {
        this.hasBoundsError = true;
        return;
      }

      const existingReaction = this.card.editedBounds.find(
        r => r.id === reactionId
      );
      if (existingReaction === undefined) {
        // Add new modification
        const reaction = bigg.lookupReaction(reactionId);
        reaction.lowerBound = lowerBound;
        reaction.upperBound = upperBound;
        this.card.editedBounds.push(reaction);
      } else {
        // Update existing modification
        existingReaction.lowerBound = lowerBound;
        existingReaction.upperBound = upperBound;
      }

      this.$emit("simulate-card", this.card);
    },
    resetBounds(reactionId: string) {
      const index = this.card.editedBounds.findIndex(
        b => b.reactionId === reactionId
      );
      if (index === -1) {
        return;
      }
      this.card.editedBounds.splice(index, 1);
      this.$emit("simulate-card", this.card);
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
        reaction_state: this.getObjectState,
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
