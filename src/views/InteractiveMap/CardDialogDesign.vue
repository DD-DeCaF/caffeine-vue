<template>
  <div>
    <ModificationsTable
      :modifications="modifications"
      @clear-modification="clearModification"
    />

    <v-layout wrap>
      <v-flex grow>
        <v-autocomplete-extended
          label="Objective"
          :items="reactions"
          :loading="model && !model.model_serialized"
          :disabled="!model"
          v-model="objectiveReaction"
          :item-text="reactionDisplay"
          item-value="id"
          :hint="objectiveHint"
          persistent-hint
          placeholder="Specify any reaction as objective..."
          prepend-icon="done"
          return-object
          clearable
          @change="$emit('simulate-card')"
          @click:clear="$nextTick(() => (objectiveReaction = null))"
        ></v-autocomplete-extended>
      </v-flex>

      <v-flex shrink>
        <v-switch
          v-model="objectiveDirection"
          color="primary"
          :label="card.objective.maximize ? 'Maximize' : 'Minimize'"
          @change="$emit('simulate-card')"
        ></v-switch>
      </v-flex>
    </v-layout>

    <AutocompleteMnxReaction
      :disabled="!model"
      label="Add a reaction..."
      hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known reactions. Search by MNX ID, EC number or the reaction name."
      prepend-icon="add"
      @change="addReaction"
    ></AutocompleteMnxReaction>
    <ReactionDialog
      v-if="model"
      v-model="mnxReaction.isReactionDialogVisible"
      :input-reaction="mnxReaction.reactionToOpen"
      :model="model"
      :card="card"
      @simulate-card="$emit('simulate-card')"
    />

    <v-icon :disabled="!model">add</v-icon>
    <v-btn @click.stop="isReactionDialogVisible = true" :disabled="!model"
      >Define your own reaction
      <ReactionDialog
        v-if="model"
        v-model="isReactionDialogVisible"
        :model="model"
        :card="card"
        @simulate-card="$emit('simulate-card')"
    /></v-btn>

    <v-autocomplete-extended
      v-model="knockoutReactionItem"
      :items="reactions"
      :loading="model && !model.model_serialized"
      :disabled="!model"
      hide-no-data
      :item-text="reactionDisplay"
      item-value="id"
      label="Knock out a reaction from the model..."
      prepend-icon="remove"
      clearable
      return-object
      @change="knockoutReaction"
    ></v-autocomplete-extended>

    <v-autocomplete-extended
      v-model="knockoutGeneItem"
      :items="genes"
      :loading="model && !model.model_serialized"
      :disabled="!model"
      hide-no-data
      :item-text="geneDisplay"
      item-value="id"
      label="Knock out a gene from the model..."
      prepend-icon="remove"
      return-object
      @change="knockoutGene"
    ></v-autocomplete-extended>

    <v-form ref="editBoundsForm" v-model="editBoundsValid">
      <v-layout wrap>
        <v-flex grow mr-2>
          <v-autocomplete-extended
            v-model="editBoundsReaction"
            :items="reactions"
            :loading="model && !model.model_serialized"
            :disabled="!model"
            :rules="[editBoundsReactionRule]"
            hide-no-data
            :item-text="reactionDisplay"
            item-value="id"
            label="Edit the bounds of a reaction..."
            prepend-icon="vertical_align_center"
            return-object
          ></v-autocomplete-extended>
        </v-flex>
        <v-flex shrink mr-2>
          <v-text-field
            v-model.number="editBoundsLowerBound"
            type="number"
            label="Lower bound"
            :rules="[editBoundsBoundRule]"
          ></v-text-field>
        </v-flex>
        <v-flex shrink mr-2>
          <v-text-field
            v-model.number="editBoundsUpperBound"
            type="number"
            label="Upper bound"
            :rules="[editBoundsBoundRule]"
          ></v-text-field>
        </v-flex>
        <v-flex shrink>
          <v-btn
            color="primary"
            @click="editBounds"
            :disabled="!editBoundsValid"
            >Update</v-btn
          >
        </v-flex>
      </v-layout>
    </v-form>

    <v-snackbar color="error" v-model="hasInvalidBoundsError" :timeout="6000">
      The lower bound cannot be larger than the upper bound.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import * as settings from "@/utils/settings";
import ReactionDialog from "@/views/InteractiveMap/ReactionDialog.vue";
import ModificationsTable from "@/components/ModificationsTable.vue";
import { MetaNetXReaction } from "@/components/AutocompleteMnxReaction.vue";
import { Reaction, Metabolite } from "@/store/modules/interactiveMap";

export default Vue.extend({
  name: "CardDialogDesign",
  components: {
    ReactionDialog,
    ModificationsTable
  },
  props: ["card", "model", "modifications"],
  data: () => ({
    // Knockout reaction
    knockoutReactionItem: null,
    // Knockout gene
    knockoutGeneItem: null,
    // Edit bounds
    editBoundsReaction: null,
    editBoundsValid: false,
    isReactionDialogVisible: false,
    mnxReaction: {
      isReactionDialogVisible: false,
      reactionToOpen: null
    },
    editBoundsReactionRule: value =>
      (value && value.id && value.id.length > 0) ||
      "Please specify the reaction",
    editBoundsBoundRule: value => {
      if (isNaN(parseFloat(value))) {
        return "Bounds must be a number.";
      }
      return true;
    },
    hasInvalidBoundsError: false,
    editBoundsLowerBound: null,
    editBoundsUpperBound: null
  }),
  computed: {
    objectiveHint() {
      let objective = "growth";
      if (this.model) {
        objective = this.model.default_biomass_reaction;
      }
      return `When left empty, the objective is ${objective}.`;
    },
    reactions() {
      if (!this.model || !this.model.model_serialized) {
        return [];
      }
      return this.model.model_serialized.reactions;
    },
    genes() {
      if (!this.model || !this.model.model_serialized) {
        return [];
      }
      return this.model.model_serialized.genes;
    },
    objectiveReaction: {
      get() {
        return this.card.objective.reaction;
      },
      set(reaction) {
        this.$store.commit("interactiveMap/setObjectiveReaction", {
          uuid: this.card.uuid,
          reaction: reaction
        });
      }
    },
    objectiveDirection: {
      get() {
        return this.card.objective.maximize;
      },
      set(maximize) {
        this.$store.commit("interactiveMap/setObjectiveDirection", {
          uuid: this.card.uuid,
          maximize: maximize
        });
      }
    }
  },
  watch: {
    editBoundsReaction(reaction) {
      if (reaction === undefined) {
        return;
      }
      const modifiedReaction = this.card.editedBounds.find(
        modification => modification.id == reaction.id
      );
      if (modifiedReaction) {
        this.editBoundsLowerBound = modifiedReaction.lowerBound;
        this.editBoundsUpperBound = modifiedReaction.upperBound;
      } else {
        // Fill the default bounds from the reaction in the model for convenience
        this.editBoundsLowerBound = reaction.lower_bound;
        this.editBoundsUpperBound = reaction.upper_bound;
      }
    }
  },
  methods: {
    reactionDisplay(reaction) {
      return `${reaction.name} (${reaction.id})`;
    },
    geneDisplay(gene) {
      return `${gene.name} (${gene.id})`;
    },
    addReaction(addReaction: {
      reaction: Reaction;
      mnxReaction: MetaNetXReaction;
    }) {
      // Try to use metabolites from model.
      const reactionWithModelMetabolites = {
        ...addReaction.reaction,
        metabolites: addReaction.reaction.metabolites.map(m => {
          const fullMetabolite = addReaction.mnxReaction.metabolites.find(
            ({ mnx_id }) => mnx_id === m.id
          );
          if (!fullMetabolite) {
            return m;
          }
          if (!fullMetabolite.annotation) {
            return m;
          }
          if (!fullMetabolite.annotation.bigg) {
            return m;
          }

          // TODO: optimize for performance
          let matchingMetaboliteInModel = null as Metabolite | null | undefined;
          fullMetabolite.annotation.bigg.find(biggId => {
            matchingMetaboliteInModel = this.model.model_serialized.metabolites.find(
              m => m.id === biggId + "_" + m.compartment
            );
            return !!matchingMetaboliteInModel;
          });
          if (!matchingMetaboliteInModel) {
            return m;
          }

          // TODO: instead of removing the compartment here and adding it later,
          // we should just pass the metabolite identifiers as they are.
          const idWithoutCompartment = matchingMetaboliteInModel.id.substring(
            0,
            matchingMetaboliteInModel.id.length -
              (matchingMetaboliteInModel.compartment.length + 1)
          );
          return {
            ...m,
            id: idWithoutCompartment,
            name: matchingMetaboliteInModel.name,
            compartment: matchingMetaboliteInModel.compartment
          };
        })
      };

      this.mnxReaction.isReactionDialogVisible = true;
      this.mnxReaction.reactionToOpen = reactionWithModelMetabolites;
    },
    knockoutReaction() {
      // Add the reaction only if it's not already added.
      if (
        !this.card.reactionKnockouts.some(
          r => r.id === this.knockoutReactionItem.id
        )
      ) {
        this.$store.dispatch("interactiveMap/knockoutReaction", {
          uuid: this.card.uuid,
          reactionId: this.knockoutReactionItem.id
        });
      }
      this.$nextTick(() => {
        this.knockoutReactionItem = null;
      });
      this.$emit("simulate-card");
    },
    knockoutGene() {
      // Add the gene only if it's not already added.
      if (
        !this.card.geneKnockouts.some(g => g.id === this.knockoutGeneItem.id)
      ) {
        this.$store.dispatch("interactiveMap/knockoutGene", {
          uuid: this.card.uuid,
          geneId: this.knockoutGeneItem.id
        });
      }
      this.$nextTick(() => {
        this.knockoutGeneItem = null;
      });
      this.$emit("simulate-card");
    },
    editBounds() {
      const lowerBound = this.editBoundsLowerBound;
      const upperBound = this.editBoundsUpperBound;

      if (lowerBound > upperBound) {
        this.hasInvalidBoundsError = true;
        return;
      }

      const payload = {
        uuid: this.card.uuid,
        reactionId: this.editBoundsReaction.id,
        lowerBound: lowerBound,
        upperBound: upperBound
      };
      if (
        !this.card.editedBounds.find(r => r.id === this.editBoundsReaction.id)
      ) {
        // Add new modification
        this.$store.dispatch("interactiveMap/editBounds", payload);
      } else {
        // Update existing modification
        this.$store.commit("interactiveMap/updateEditedBounds", payload);
      }

      this.$refs.editBoundsForm.reset();
      this.$emit("simulate-card");
    },
    clearModification(modification) {
      if (modification.type === "added_reaction") {
        this.$store.commit("interactiveMap/undoAddReaction", {
          uuid: this.card.uuid,
          reactionId: modification.id
        });
        // If the bounds were edited on the added reaction, remove those too.
        this.$store.commit("interactiveMap/undoEditBounds", {
          uuid: this.card.uuid,
          reactionId: modification.id
        });
        // If the objective was set to the added reaction, clear it.
        if (
          this.card.objective.reaction &&
          this.card.objective.reaction.id === modification.id
        ) {
          this.$store.commit("interactiveMap/setObjectiveReaction", {
            uuid: this.card.uuid,
            reaction: null
          });
        }
        // Adding and then knocking out the same reaction makes little sense,
        // but is technically possible, so remove the knockouts too if that's
        // the case.
        this.$store.commit("interactiveMap/undoKnockoutReaction", {
          uuid: this.card.uuid,
          reactionId: modification.id
        });
      } else if (modification.type === "reaction_knockout") {
        this.$store.commit("interactiveMap/undoKnockoutReaction", {
          uuid: this.card.uuid,
          reactionId: modification.id
        });
      } else if (modification.type === "gene_knockout") {
        this.$store.commit("interactiveMap/undoKnockoutGene", {
          uuid: this.card.uuid,
          geneId: modification.id
        });
      } else if (modification.type === "edited_bounds") {
        this.$store.commit("interactiveMap/undoEditBounds", {
          uuid: this.card.uuid,
          reactionId: modification.id
        });
      }
      this.$emit("simulate-card");
    }
  }
});
</script>
