<template>
  <div class="fill-height">
    <div class="escher-container fill-height" @click="$emit('click')">
      <v-container
        fluid
        fill-height
        class="overlay"
        v-if="initializingEscher || isLoadingMap"
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
            <span v-if="initializingEscher">Initializing Escher...</span>
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
    <Legend :card="card" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
/// <reference path="@/types/escher.d.ts" />
import * as escher from "@dd-decaf/escher";
import Legend from "@/views/InteractiveMap/Legend.vue";

export default Vue.extend({
  name: "Escher",
  components: {
    Legend
  },
  props: ["mapData", "card", "isLoadingMap"],
  data: () => ({
    escherBuilder: null,
    initializingEscher: false,
    hasBoundsError: false,
    defaultReactionStyles: ["color", "size", "text", "abs"],
    defaultColorScheme: [
      { type: "min", color: "#A841D0", size: 20 },
      { type: "Q1", color: "#868BB2", size: 20 },
      { type: "Q3", color: "#6DBFB0", size: 20 },
      { type: "max", color: "#54B151", size: 20 }
    ]
  }),
  computed: {
    model() {
      // Returns the modified model (original model + added reactions) for the
      // currently selected card.
      // TODO: This is duplicated logic, a very similar computed property exists
      // in the Card component.
      if (!this.card) {
        return null;
      }

      const selectedModel = this.$store.getters["models/getModelById"](
        this.card.modelId
      );

      if (!selectedModel || !selectedModel.model_serialized) {
        return selectedModel;
      }

      // Create a copy of the model object to avoid references to the object in
      // the store.
      const model = {
        ...selectedModel,
        model_serialized: {
          ...selectedModel.model_serialized
        }
      };
      this.card.reactionAdditions.forEach(reaction => {
        // Add the reaction to the model. (Take care to replace, not modify, the
        // original array.)
        model.model_serialized.reactions = [
          ...model.model_serialized.reactions,
          {
            id: reaction.id,
            name: reaction.name,
            lower_bound: reaction.lowerBound,
            upper_bound: reaction.upperBound,
            gene_reaction_rule: "",
            metabolites: Object.assign(
              {},
              ...reaction.metabolites.map(m => ({
                [`${m.id}_${m.compartment}`]: m.stoichiometry
              }))
            )
          }
        ];

        // Add any new metabolites from the reaction. (Take care to replace, not
        // modify, the original array.)
        const metabolites = reaction.metabolites
          // Add the compartment postfix to the metabolite id
          .map(metabolite => ({
            ...metabolite,
            id: `${metabolite.id}_${metabolite.compartment}`,
            // Mark metabolite to force Escher to make it primary
            is_heterologous: true
          }))
          // Exclude metabolites that already exist in the model
          .filter(metabolite => {
            return !model.model_serialized.metabolites.some(
              m => m.id === metabolite.id
            );
          });
        model.model_serialized.metabolites = [
          ...model.model_serialized.metabolites,
          ...metabolites
        ];
      });
      return model;
    },
    diffFVAScores() {
      if (this.card.type === "DiffFVA") {
        let scores = {};
        this.card.manipulations.forEach(manipulation => {
          scores[manipulation.id] = manipulation.score;
        });
        return scores;
      } else {
        return null;
      }
    },
    showDiffFVAScore() {
      return this.card ? this.card.showDiffFVAScore : false;
    }
  },
  watch: {
    mapData(mapData) {
      // When the map is changed, recreate the Escher builder instead of simply
      // calling `load_map`. We're doing this to work around a number of bugs
      // where state in Escher is not properly retained after changing maps.
      // See discussion in: https://github.com/DD-DeCaF/caffeine-vue/pull/118
      this.initializingEscher = true;
      // Recreating the Escher builder over an existing one doesn't work, so destroy
      // it by simply clearing the DOM element.
      this.$refs.escher.innerHTML = "";
      this.escherBuilder = escher.Builder(
        mapData,
        null,
        null,
        this.$refs.escher,
        {
          menu: "all",
          scroll_behavior: "zoom",
          fill_screen: false,
          ignore_bootstrap: true,
          never_ask_before_quit: true,
          reaction_styles: this.defaultReactionStyles,
          identifiers_on_map: "bigg_id",
          hide_all_labels: false,
          hide_secondary_metabolites: false,
          highlight_missing: true,
          reaction_scale: this.defaultColorScheme,
          reaction_no_data_color: "#CBCBCB",
          reaction_no_data_size: 10,
          tooltip: "custom",
          enable_editing: true,
          enable_fva_opacity: true,
          show_gene_reaction_rules: true,
          zoom_extent_canvas: true,
          first_load_callback: () => {
            this.initializingEscher = false;

            // Update the current map state.
            // Important: Any new logic to set map state that is added below, needs to
            // be called here as well, otherwise it will be undone when changing the
            // map.
            if (this.model && this.model.model_serialized) {
              this.setModel();
              this.setReactionAdditions();
            }
            this.setReactionKnockouts();
            this.setGeneKnockouts();
            this.setConditionData();
            this.setFluxes();
            this.setColorScheme();
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
        }
      );
    },
    model: {
      deep: true,
      handler() {
        // Whenever the model (with local modifications) changes, update it in
        // Escher. Note: The model must be loaded before drawing the reactions
        // on the map.
        if (!this.escherBuilder) {
          // Escher builder is not available if map data hasn't arrived yet. Ignore the
          // watcher; the state will be set explicitly when map data arrives.
          return;
        }
        this.setModel();

        // To make sure that added reactions are added correctly to the map, use
        // this watcher (instead of watching `card.reactionAdditions`
        // separately). This ensures that the full model is available, and since
        // the property recomputes when either model or added reactions change,
        // it will also handle the case of reactions being added first, then the
        // model arrives later, then draw the added reactions
        if (this.model && this.model.model_serialized) {
          this.setReactionAdditions();
        }
      }
    },
    // Add separate watchers for the different properties on the card, instead
    // of a single deep watcher on the card, to be able to only update the
    // relevant portions of the map.
    "card.reactionKnockouts"() {
      if (!this.escherBuilder) {
        // Escher builder is not available if map data hasn't arrived yet. Ignore the
        // watcher; the state will be set explicitly when map data arrives.
        return;
      }
      this.setReactionKnockouts();
    },
    "card.geneKnockouts"() {
      if (!this.escherBuilder) {
        // Escher builder is not available if map data hasn't arrived yet. Ignore the
        // watcher; the state will be set explicitly when map data arrives.
        return;
      }
      this.setGeneKnockouts();
    },
    "card.conditionData"() {
      if (!this.escherBuilder) {
        // Escher builder is not available if map data hasn't arrived yet. Ignore the
        // watcher; the state will be set explicitly when map data arrives.
        return;
      }
      this.setConditionData();
    },
    "card.fluxes"() {
      if (!this.escherBuilder) {
        // Escher builder is not available if map data hasn't arrived yet. Ignore the
        // watcher; the state will be set explicitly when map data arrives.
        return;
      }
      this.setFluxes();
    },
    showDiffFVAScore() {
      if (!this.escherBuilder) {
        // Escher builder is not available if map data hasn't arrived yet. Ignore the
        // watcher; the state will be set explicitly when map data arrives.
        return;
      }
      this.setColorScheme();
      this.setFluxes();
    }
  },
  methods: {
    setModel() {
      if (!this.card || !this.model || !this.model.model_serialized) {
        this.escherBuilder.load_model(null);
      } else {
        this.escherBuilder.load_model(this.model.model_serialized);
      }
    },
    setReactionAdditions() {
      if (!this.card) {
        this.escherBuilder.set_added_reactions([]);
      } else if (!this.model || !this.model.model_serialized) {
        throw new Error("Cannot draw reactions when the model is not loaded.");
      } else {
        this.escherBuilder.set_added_reactions(
          this.card.reactionAdditions
            .filter(r => !r.id.startsWith("DM_"))
            .map(r => r.id)
        );
      }
      this.escherBuilder._updateData(true, true);
    },
    setReactionKnockouts() {
      if (this.card === null) {
        this.escherBuilder.set_knockout_reactions([]);
      } else {
        this.escherBuilder.set_knockout_reactions(
          this.card.reactionKnockouts.map(r => r.id)
        );
      }
      this.escherBuilder._updateData(true, true);
    },
    setGeneKnockouts() {
      if (this.card === null) {
        this.escherBuilder.set_knockout_genes([]);
      } else {
        this.escherBuilder.set_knockout_genes(
          this.card.geneKnockouts.map(g => g.id)
        );
      }
      this.escherBuilder._updateData(true, true);
    },
    setConditionData() {
      if (!this.card || !this.card.conditionData) {
        this.escherBuilder.set_highlight_reactions([]);
        return;
      }
      this.escherBuilder.set_highlight_reactions(
        this.card.conditionData.measurements.map(m => m.id)
      );
    },
    setFluxes() {
      // Update the flux distribution
      if (this.card === null || this.card.fluxes === null) {
        this.escherBuilder.set_reaction_data(null);
      } else {
        if (
          (this.card.method === "fba" || this.card.method == "pfba") &&
          !this.showDiffFVAScore
        ) {
          const fluxesFiltered = this.fluxFilter(this.card.fluxes);
          this.escherBuilder.set_reaction_data(fluxesFiltered);
          // Set FVA data with the current fluxes. This resets opacity in case a
          // previous FVA simulation has been set on the map.
          // TODO: We should improve the escher API here.
          this.escherBuilder.set_reaction_fva_data(this.card.fluxes);
        } else if (
          (this.card.method === "fva" || this.card.method == "pfba-fva") &&
          !this.showDiffFVAScore
        ) {
          // Render a flux distribution using the average values from the FVA
          // data.
          const fluxesAverage = {};
          Object.keys(this.card.fluxes).map(reaction => {
            const rxn = this.card.fluxes[reaction];
            const average = (rxn.upper_bound + rxn.lower_bound) / 2;
            fluxesAverage[reaction] = average;
          });
          const fluxesFiltered = this.fluxFilter(fluxesAverage);
          this.escherBuilder.set_reaction_data(fluxesFiltered);
          // Set the FVA data for transparency visualization.
          this.escherBuilder.set_reaction_fva_data(this.card.fluxes);
        } else if (this.showDiffFVAScore) {
          // Set the scores instead of the cards fluxes.
          // (calculated from a diffFVA card's manipulations)
          this.escherBuilder.set_reaction_data(this.diffFVAScores);
          // Set the FVA data for transparency visualization as above.
          this.escherBuilder.set_reaction_fva_data(this.diffFVAScores);
        }
      }
      this.escherBuilder._updateData(true, true);
    },
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
        !this.card ||
        !this.model ||
        !this.model.model_serialized ||
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
      const modelReaction = this.model.model_serialized.reactions.find(
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
        includedInModel: this.model.model_serialized.genes.some(
          g => g.id === id
        ),
        knockout: false,
        knockoutGenes: this.card.geneKnockouts.some(g => g.id === id),
        objective: null,
        bounds: null
      };
    },
    setObjective(reactionId: string) {
      if (
        this.card.objective.reaction !== null &&
        this.card.objective.reaction.id === reactionId
      ) {
        // This is already the objective; undo it and reset to growth
        this.$store.commit("interactiveMap/setObjectiveReaction", {
          uuid: this.card.uuid,
          reaction: null
        });
        this.$store.commit("interactiveMap/setObjectiveDirection", {
          uuid: this.card.uuid,
          maximize: true
        });
      } else {
        this.$store.dispatch("interactiveMap/setObjective", {
          uuid: this.card.uuid,
          reactionId: reactionId
        });
      }
      this.$emit("simulate-card", this.card, this.model);
    },
    setObjectiveDirection(reactionId: string) {
      this.$store.commit("interactiveMap/setObjectiveDirection", {
        uuid: this.card.uuid,
        maximize: !this.card.objective.maximize
      });
      this.$emit("simulate-card", this.card, this.model);
    },
    knockoutReaction(reactionId: string) {
      // Both knockout and undo knockout will call this, so depend the behaviour
      // on whether the reaction is already knocked out.
      if (this.card.reactionKnockouts.find(r => r.id === reactionId)) {
        this.$store.commit("interactiveMap/undoKnockoutReaction", {
          uuid: this.card.uuid,
          reactionId: reactionId
        });
      } else {
        this.$store.dispatch("interactiveMap/knockoutReaction", {
          uuid: this.card.uuid,
          reactionId: reactionId
        });
      }
      this.$emit("simulate-card", this.card, this.model);
    },
    knockoutGene(geneId: string) {
      // Both knockout and undo knockout will call this, so depend the behaviour
      // on whether the gene is already knocked out.
      if (this.card.geneKnockouts.find(g => g.id === geneId)) {
        this.$store.commit("interactiveMap/undoKnockoutGene", {
          uuid: this.card.uuid,
          geneId: geneId
        });
      } else {
        this.$store.dispatch("interactiveMap/knockoutGene", {
          uuid: this.card.uuid,
          geneId: geneId
        });
      }
      this.$emit("simulate-card", this.card, this.model);
    },
    editBounds(reactionId: string, lower: string, upper: string) {
      const lowerBound = parseFloat(lower);
      const upperBound = parseFloat(upper);

      if (lowerBound > upperBound) {
        this.hasBoundsError = true;
        return;
      }

      const payload = {
        uuid: this.card.uuid,
        reactionId: reactionId,
        lowerBound: lowerBound,
        upperBound: upperBound
      };
      if (!this.card.editedBounds.find(r => r.id === reactionId)) {
        // Add new modification
        this.$store.dispatch("interactiveMap/editBounds", payload);
      } else {
        // Update existing modification
        this.$store.commit("interactiveMap/updateEditedBounds", payload);
      }

      this.$emit("simulate-card", this.card, this.model);
    },
    resetBounds(reactionId: string) {
      this.$store.commit("interactiveMap/undoEditBounds", {
        uuid: this.card.uuid,
        reactionId: reactionId
      });
      this.$emit("simulate-card", this.card, this.model);
    },
    setColorScheme() {
      if (this.card.showDiffFVAScore) {
        this.escherBuilder.settings.set("reaction_scale", [
          { type: "min", color: "#a841d0", size: 20 },
          { type: "value", color: "#f7f7f7", size: 5, value: 0 },
          { type: "max", color: "#54b151", size: 20 }
        ]);
        this.escherBuilder.settings.set("reaction_styles", [
          "color",
          "size",
          "text"
        ]);
      } else {
        this.escherBuilder.settings.set(
          "reaction_scale",
          this.defaultColorScheme
        );
        this.escherBuilder.settings.set(
          "reaction_styles",
          this.defaultReactionStyles
        );
      }
    }
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

.menu-bar {
  visibility: hidden;
}
</style>
