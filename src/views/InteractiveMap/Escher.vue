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
    <Legend :card="card" :ecModel="model && model.ec_model" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
/// <reference path="@/types/escher.d.ts" />
import * as escher from "@dd-decaf/escher";
import { keyBy, mapKeys, pickBy, flatten } from "lodash";
import Legend from "@/views/InteractiveMap/Legend.vue";

export default Vue.extend({
  name: "Escher",
  components: {
    Legend
  },
  props: ["mapData", "card"],
  data: () => ({
    escherBuilder: null,
    initializingEscher: true,
    onEscherReady: null,
    isLoadingMap: false,
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
      // in the Card component. Note however that this property also adjusts
      // bounds; the Card component property does not.
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

      // Add all added reactions to the model.
      this.card.reactionAdditions.forEach(reaction => {
        // Take care to replace, not modify, the original array.
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

      // Update any bounds that were modified.
      const boundedReactions = keyBy(this.card.editedBounds, rxn => rxn.id);
      // Take care to replace, not modify, the original array.
      const reactions = model.model_serialized.reactions.map(reaction => {
        if (reaction.id in boundedReactions) {
          return {
            ...reaction,
            lower_bound: boundedReactions[reaction.id].lowerBound,
            upper_bound: boundedReactions[reaction.id].upperBound
          };
        } else {
          return reaction;
        }
      });
      model.model_serialized.reactions = reactions;

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
    },
    showProteomicsData() {
      return this.card ? this.card.showProteomicsData : false;
    },
    highlightMissing() {
      // We cannot highlight missing reactions for ecModels, since most of the
      // identifiers on the map would not match those in the model.
      return !(this.showProteomicsData || (this.model && this.model.ec_model));
    },
    enzymeUsagePerGene() {
      // If this is an enzyme-constrained model, calculate the enzyme usage for
      // each pseudo-reaction.
      if (
        !this.card ||
        !this.card.fluxes ||
        !this.model ||
        !this.model.model_serialized ||
        !this.model.ec_model
      ) {
        return null;
      }

      // Each pseudoreaction always has a single gene, so store the enzyme usage
      // value per gene.
      const enzymeUsagePerGene = {};
      // If the upper bound is smaller than this value, we can assume it was
      // constrained by real-world observations. Anything larger is ignored,
      // mostly to save computational cycles below.
      const highestConceivableEnzymeUsage = 4;
      this.model.model_serialized.reactions
        .filter(
          rxn => rxn.id.startsWith("prot_") && rxn.id.endsWith("_exchange")
        )
        .filter(rxn => rxn.upper_bound < highestConceivableEnzymeUsage)
        // Ignore reactions with no positive flux - they would cause division by
        // zero.
        .filter(rxn => rxn.upper_bound !== 0)
        .forEach(pseudoReaction => {
          enzymeUsagePerGene[pseudoReaction.gene_reaction_rule] =
            this.card.fluxes[pseudoReaction.id] / pseudoReaction.upper_bound;
        });

      return enzymeUsagePerGene;
    },
    enzymeUsage() {
      const enzymeUsagePerGene = this.enzymeUsagePerGene;
      if (!enzymeUsagePerGene) {
        return null;
      }
      // Map the enzyme usages on to all reactions that are catalyzed by any of
      // the genes.
      const enzymeUsages = {};
      this.model.model_serialized.reactions
        .filter(
          rxn => !(rxn.id.startsWith("prot_") && rxn.id.endsWith("_exchange"))
        )
        .forEach(rxn => {
          rxn.gene_reaction_rule.split(/\W+/).forEach(gene => {
            if (gene in enzymeUsagePerGene) {
              // It's a match! Set the enzyme usage.
              if (rxn.id in enzymeUsages) {
                // Another gene is already recorded for this reaction; use the
                // highest value.
                enzymeUsages[rxn.id] = Math.max(
                  enzymeUsages[rxn.id],
                  enzymeUsagePerGene[gene]
                );
              } else {
                enzymeUsages[rxn.id] = enzymeUsagePerGene[gene];
              }
            }
          });
        });

      return enzymeUsages;
    },
    enzymeUsageMapped() {
      // Map the ecModel-specific reaction identifiers back to the original
      // identifiers, so that they are correctly recognized in the Escher map.

      // Disregard the reversible reactions ("XXX_REV"), as those will just
      // contain redundant information in terms of enzyme usage (the GPR rule of
      // the backward and forward reaction are equivalent).
      const enzymeUsage = pickBy(
        this.enzymeUsage,
        (usage, id) => !(id.endsWith("_REV") || id.includes("_REVNo"))
      );

      const reactionIds = Object.keys(enzymeUsage);
      // Make a copy of the original IDs, as we need to compare the unmodified
      // identifiers during iteration.
      const originalReactionIds = reactionIds.slice();
      return mapKeys(enzymeUsage, (usage, id) => {
        if (id.startsWith("arm_")) {
          // For isozymes, use the value in the reaction "arm_XXX".
          return id.slice(4);
        } else if (
          id.endsWith("No1") &&
          !(`arm_${id.slice(0, -3)}` in originalReactionIds)
        ) {
          // For single enzymes, use the value in the reaction "XXXNo1" (for
          // this, check first that no arm reaction is already present).
          return id.slice(0, -3);
        }
        return id;
      });
    }
  },
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
          // Update the map state, since it will be reset whenever the map is
          // changed. Note that we don't need to update the model.
          if (this.model && this.model.model_serialized) {
            this.setReactionAdditions();
          }
          this.setReactionKnockouts();
          this.setGeneKnockouts();
          this.setDataSample();
          this.setEnzymeUsage();
          this.setFluxes();
        }, 10);
      };

      // Wait for escher to initialize before loading the map.
      this.onEscherReady.then(loadMap);

      this.$store.dispatch("analytics/visualize", {
        card: this.card,
        model: this.model,
        map: this.$store.state.maps.maps.find(
          map => map.id === this.$store.state.interactiveMap.currentMapId
        ),
        project: this.$store.state.projects.activeProject,
        source: "map_change"
      });
    },
    model: {
      deep: true,
      handler() {
        // Whenever the model (with local modifications) changes, update it in
        // Escher. Note: The model must be loaded before drawing the reactions
        // on the map.
        this.onEscherReady.then(this.setModel);
        // To make sure that added reactions are added correctly to the map, use
        // this watcher (instead of watching `card.reactionAdditions`
        // separately). This ensures that the full model is available, and since
        // the property recomputes when either model or added reactions change,
        // it will also handle the case of reactions being added first, then the
        // model arrives later, then draw the added reactions
        if (this.model && this.model.model_serialized) {
          this.onEscherReady.then(this.setReactionAdditions);
        }
      }
    },
    card(card) {
      this.$store.dispatch("analytics/visualize", {
        card: this.card,
        model: this.model,
        map: this.$store.state.maps.maps.find(
          map => map.id === this.$store.state.interactiveMap.currentMapId
        ),
        project: this.$store.state.projects.activeProject,
        source: "card_change"
      });
    },
    // Add separate watchers for the different properties on the card, instead
    // of a single deep watcher on the card, to be able to only update the
    // relevant portions of the map.
    "card.reactionKnockouts"() {
      this.onEscherReady.then(this.setReactionKnockouts);
    },
    "card.geneKnockouts"() {
      this.onEscherReady.then(this.setGeneKnockouts);
    },
    "card.sample"() {
      this.onEscherReady.then(this.setDataSample);
    },
    "card.fluxes"() {
      this.onEscherReady.then(this.setFluxes);
    },
    showDiffFVAScore() {
      this.onEscherReady.then(this.toggleColorScheme);
      this.onEscherReady.then(this.setFluxes);
    },
    showProteomicsData() {
      this.onEscherReady.then(this.setFluxes);
    },
    highlightMissing() {
      this.escherBuilder.settings.set(
        "highlight_missing",
        this.highlightMissing
      );
    },
    enzymeUsage() {
      this.onEscherReady.then(this.setEnzymeUsage);
    },
    "card.enzymeUsageThreshold"() {
      this.onEscherReady.then(this.setEnzymeUsage);
    }
  },
  mounted() {
    this.onEscherReady = new Promise((resolve, reject) => {
      this.escherBuilder = escher.Builder(null, null, null, this.$refs.escher, {
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
        use_3d_transform: true,
        first_load_callback: () => {
          resolve();
          this.initializingEscher = false;
        },
        reaction_state: this.getObjectState,
        tooltip_callbacks: {
          knockout: this.knockoutReaction,
          knockoutGenes: this.knockoutGene,
          setAsObjective: this.setObjective,
          objectiveDirection: this.setObjectiveDirection,
          changeBounds: this.editBounds,
          resetBounds: this.resetBounds
        },
        search_callbacks: {
          search: search => {
            this.$store.dispatch("analytics/searchEscher", search);
          }
        }
      });
    });
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
    setDataSample() {
      if (!this.card || !this.card.sample) {
        this.escherBuilder.set_highlight_reactions([]);
        return;
      }
      this.escherBuilder.set_highlight_reactions(
        this.card.sample.fluxomics.map(m => m.reaction_identifier)
      );
    },
    setEnzymeUsage() {
      // Based on proteomics and simulated fluxes, visualizes enzyme usage by
      // highlighting reactions with enzyme usage greater than or equal to the
      // given threshold.
      // NOTE: This currently intereferes with fluxomics since we use
      // highlighted reactions for both use cases, so currently the assumption
      // is that users won't upload both fluxomics and proteomics in the same
      // experiment.
      if (!this.enzymeUsage) {
        this.escherBuilder.set_highlight_reactions([]);
        this.escherBuilder.set_highlight_genes([]);
        return;
      }

      // Only highlight reactions with enzyme usage greater than or equal to the
      // given threshold.
      const genes = Object.keys(this.enzymeUsagePerGene).filter(
        id =>
          this.enzymeUsagePerGene[id] >= this.card.enzymeUsageThreshold / 100
      );
      this.escherBuilder.set_highlight_genes(genes);

      // Only highlight reactions with enzyme usage above the given threshold.
      const reactions = Object.keys(this.enzymeUsageMapped).filter(
        id => this.enzymeUsageMapped[id] >= this.card.enzymeUsageThreshold / 100
      );
      this.escherBuilder.set_highlight_reactions(reactions);
    },
    setFluxes() {
      // Update the flux distribution
      if (this.card === null || this.card.fluxes === null) {
        this.escherBuilder.set_gene_data(null);
        this.escherBuilder.set_reaction_data(null);
      } else {
        if (this.showDiffFVAScore) {
          // Set the DiffFVA scores instead of the cards fluxes.
          // (calculated from a diffFVA card's manipulations)
          this.escherBuilder.set_reaction_data(this.diffFVAScores);
          // Set the FVA data for transparency visualization as above.
          this.escherBuilder.set_reaction_fva_data(this.diffFVAScores);
        } else if (this.showProteomicsData) {
          // Set gene data instead of the card fluxes
          const modelGeneIdsWithNames = keyBy(
            this.model.model_serialized.genes,
            gene => gene.id
          );
          const geneData = {};
          this.card.conditionData.samples.forEach(sample => {
            sample.proteomics.forEach(proteomicsItem => {
              const proteomicsGeneIds: string[] = flatten(
                Object.values(proteomicsItem.gene)
              );
              proteomicsGeneIds.forEach(proteomicsGeneId => {
                if (proteomicsGeneId in modelGeneIdsWithNames) {
                  geneData[proteomicsGeneId] = proteomicsItem.measurement;
                }
              });
            });
          });
          this.escherBuilder.set_gene_data(geneData);
        } else {
          // For ecModels, map the simulated flux distribution back to the
          // original reaction identifiers for the non-ec model, so that they
          // match with the escher maps.
          let fluxes = this.card.fluxes;
          if (this.model.ec_model) {
            fluxes = this.ecModelFluxes(fluxes);
          }

          if (this.card.method === "fba" || this.card.method == "pfba") {
            const fluxesFiltered = this.fluxFilter(fluxes);
            this.escherBuilder.set_reaction_data(fluxesFiltered);
            // Set FVA data with the current fluxes. This resets opacity in case
            // a previous FVA simulation has been set on the map.
            // TODO: We should improve the escher API here.
            this.escherBuilder.set_reaction_fva_data(fluxes);
          } else if (["fva", "pfba-fva"].includes(this.card.method)) {
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
    ecModelFluxes(fluxes) {
      // Map fluxes from an enzyme-constrained model to the corresponding
      // escher map, as reaction ids from ecModels have additional prefixes
      // and/or suffixes.
      const fluxesMapped = {};
      Object.keys(fluxes).forEach(rxn => {
        let newRxn = rxn;
        if (rxn.startsWith("arm_")) {
          // For isozymes, use the flux in the reaction "arm_XXX".
          newRxn = rxn.slice(4);
        } else if (rxn.endsWith("No1")) {
          // For single enzymes, use the flux in the reaction "XXXNo1" (for
          // this, check first that no arm reaction is already present).
          const rootRxn = rxn.slice(0, -3);
          if (!("arm_" + rootRxn in fluxes)) {
            newRxn = rootRxn;
          }
        }
        fluxesMapped[newRxn] = fluxes[rxn];
      });
      Object.keys(fluxesMapped).forEach(rxn => {
        if (rxn.endsWith("_REV") && fluxesMapped[rxn] > 0) {
          // For reversible enzymes ("XXX_REV") that are active in the backwards
          // direction, replace the existing flux in the forward reaction by the
          // negative value.
          const forwardRxn = rxn.slice(0, -4);
          fluxesMapped[forwardRxn] = -fluxesMapped[rxn];
        }
      });
      return fluxesMapped;
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
      this.simulateCard({
        analytics: {
          sourceType: "reaction_setObjective",
          sourceId: reactionId
        }
      });
    },
    setObjectiveDirection(reactionId: string) {
      this.$store.commit("interactiveMap/setObjectiveDirection", {
        uuid: this.card.uuid,
        maximize: !this.card.objective.maximize
      });
      this.simulateCard({
        analytics: {
          sourceType: "reaction_setObjectiveDirection",
          sourceId: reactionId
        }
      });
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
      this.simulateCard({
        analytics: {
          sourceType: "reaction_knockoutReaction",
          sourceId: reactionId
        }
      });
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
      this.simulateCard({
        analytics: {
          sourceType: "gene_knockoutGene",
          sourceId: geneId
        }
      });
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
      this.simulateCard({
        analytics: {
          sourceType: "reaction_editBounds",
          sourceId: reactionId
        }
      });
    },
    resetBounds(reactionId: string) {
      this.$store.commit("interactiveMap/undoEditBounds", {
        uuid: this.card.uuid,
        reactionId: reactionId
      });
      this.simulateCard({
        analytics: {
          sourceType: "reaction_resetBounds",
          sourceId: reactionId
        }
      });
    },
    toggleColorScheme() {
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
    },
    simulateCard(options) {
      this.$emit("simulate-card", this.card, this.model, {
        ...(options || {}),
        analytics: {
          source: "escher",
          ...((options || {}).analytics || {})
        }
      });
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
