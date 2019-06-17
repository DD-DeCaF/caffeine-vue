<template>
  <div>
    <v-data-table
      hide-actions
      :headers="modificationsHeaders"
      :items="modifications"
      item-key="type + id"
    >
      <template v-slot:items="{ item: modification }">
        <!-- Added reaction -->
        <td v-if="modification.type === 'added_reaction'">
          Added reaction
        </td>
        <td v-if="modification.type === 'added_reaction'">
          <span v-if="modification.name">
            {{ modification.name }} ({{ modification.id }})
          </span>
          <v-progress-circular
            v-else
            indeterminate
            size="12"
            :width="1"
          ></v-progress-circular>
        </td>
        <td v-if="modification.type === 'added_reaction'">
          <span
            v-if="modification.reactionString"
            v-html="modification.reactionString"
          />
          <v-progress-circular
            v-else
            indeterminate
            size="12"
            :width="1"
          ></v-progress-circular>
        </td>

        <!-- Reaction knockout -->
        <td v-if="modification.type === 'reaction_knockout'">
          Reaction knockout
        </td>
        <td v-if="modification.type === 'reaction_knockout'">
          <span v-if="modification.name">
            {{ modification.name }} ({{ modification.id }})
          </span>
          <v-progress-circular
            v-else
            indeterminate
            size="12"
            :width="1"
          ></v-progress-circular>
        </td>
        <td v-if="modification.type === 'reaction_knockout'">
          <span
            v-if="modification.reactionString"
            v-html="modification.reactionString"
          />
          <v-progress-circular
            v-else
            indeterminate
            size="12"
            :width="1"
          ></v-progress-circular>
        </td>

        <!-- Gene knockout -->
        <td v-if="modification.type === 'gene_knockout'">
          Gene knockout
        </td>
        <td v-if="modification.type === 'gene_knockout'">
          <span v-if="modification.name">
            {{ modification.name }} ({{ modification.id }})
          </span>
          <v-progress-circular
            v-else
            indeterminate
            size="12"
            :width="1"
          ></v-progress-circular>
        </td>
        <td v-if="modification.type === 'gene_knockout'">
          <span v-if="modification.reactions">
            <p
              class="mb-0"
              v-for="reaction in modification.reactions"
              :key="reaction.id"
            >
              {{ reaction.name }} ({{ reaction.id }})
            </p>
          </span>
          <v-progress-circular
            v-else
            indeterminate
            size="12"
            :width="1"
          ></v-progress-circular>
        </td>

        <!-- Edited bounds -->
        <td v-if="modification.type === 'edited_bounds'">
          Modified bounds
        </td>
        <td v-if="modification.type === 'edited_bounds'">
          {{ modification.name }} ({{ modification.id }})
        </td>
        <td v-if="modification.type === 'edited_bounds'">
          Bounds set from {{ modification.lowerBound }} to
          {{ modification.upperBound }}
        </td>

        <td>
          <v-btn flat icon @click="clearModification(modification)">
            <v-icon>delete</v-icon>
          </v-btn>
        </td>
      </template>
    </v-data-table>

    <v-layout wrap>
      <v-flex grow>
        <v-autocomplete
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
        ></v-autocomplete>
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

    <v-autocomplete
      v-model="addReactionItem"
      :items="addReactionSearchResults"
      :filter="dontFilterByDisplayedText"
      :loading="isLoadingAddReaction"
      :disabled="!model"
      :search-input.sync="addReactionSearchQuery"
      hide-no-data
      :item-text="reactionDisplay"
      item-value="id"
      label="Add a reaction from BiGG..."
      hint="Searches the entire <a href='http://bigg.ucsd.edu/'>BiGG</a> database for known reactions. Search by name or BiGG ID."
      prepend-icon="add"
      return-object
      @change="addReaction"
    ></v-autocomplete>

    <AutocompleteMnxReaction
      :disabled="!model"
      label="Add a reaction from MetaNetX..."
      hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known reactions. Search by MNX ID, EC number or the reaction name."
      prepend-icon="add"
      @change="addMnxReaction"
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

    <v-autocomplete
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
    ></v-autocomplete>

    <v-autocomplete
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
    ></v-autocomplete>

    <v-form ref="editBoundsForm" v-model="editBoundsValid">
      <v-layout wrap>
        <v-flex grow mr-2>
          <v-autocomplete
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
          ></v-autocomplete>
        </v-flex>
        <v-flex shrink mr-2>
          <v-text-field
            v-model="editBoundsLowerBound"
            type="number"
            label="Lower bound"
            :rules="[editBoundsBoundRule]"
          ></v-text-field>
        </v-flex>
        <v-flex shrink mr-2>
          <v-text-field
            v-model="editBoundsUpperBound"
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

    <v-snackbar color="error" v-model="biggRequestError" :timeout="6000">
      Could not search BiGG for reactions, please check your internet
      connection.
    </v-snackbar>
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
import { MetaNetXReaction } from "@/components/AutocompleteMnxReaction.vue";
import { Reaction, Metabolite } from "@/store/modules/interactiveMap";

export default Vue.extend({
  name: "CardDialogDesign",
  components: {
    ReactionDialog
  },
  props: ["card", "model", "modifications"],
  data: () => ({
    modificationsHeaders: [
      { text: "Type", value: "type", sortable: false },
      { text: "Identification", value: "id", sortable: false },
      { text: "Details", value: "details", sortable: false },
      { text: "Remove", value: "remove", sortable: false }
    ],
    // Add reaction
    addReactionItem: null,
    addReactionSearchQuery: null,
    addReactionSearchResults: [],
    isLoadingAddReaction: false,
    biggRequestError: false,
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
      if (value < -1000 || value > 1000) {
        return "Bounds must be in the range of -1000 to 1000.";
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
    addReactionSearchQuery(query) {
      this.addReactionSearchResults = [];
      if (query === null || query.trim().length === 0) {
        return;
      }

      this.isLoadingAddReaction = true;
      axios
        .get(
          `${settings.apis.bigg}/search?query=${query}&search_type=reactions`
        )
        .then(response => {
          // Wait for the full model to be able to filter out results that
          // already exist in the model.
          this.$store
            .dispatch("models/withFullModel", this.model.id)
            .then(model => {
              this.addReactionSearchResults = response.data.results
                .map(reaction => ({
                  id: reaction.bigg_id,
                  name: reaction.name
                }))
                // Exclude results that already exist in the current model
                .filter(reaction =>
                  model.model_serialized.reactions.every(
                    r => r.id !== reaction.id
                  )
                );
            });
        })
        .catch(error => {
          this.biggRequestError = true;
        })
        .then(() => {
          this.isLoadingAddReaction = false;
        });
    },
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
    dontFilterByDisplayedText() {
      return true;
    },
    addReaction(addedReaction) {
      // Skip if the reaction is already added.
      if (this.card.reactionAdditions.some(r => r.id === addedReaction.id)) {
        return;
      }

      // Reset the autocomplete form to signal that the reaction will be added.
      this.addReactionSearchQuery = null;
      this.$nextTick(() => {
        this.addReactionItem = null;
      });

      // Request full reaction information from BiGG. Only on success will the
      // reaction actually be added.
      axios
        .get(
          `${settings.apis.bigg}/models/universal/reactions/${addedReaction.id}`
        )
        .then(response => {
          const reaction = {
            id: response.data.bigg_id,
            name: response.data.name,
            reactionString: response.data.reaction_string,
            // Note: Assuming all reactions in the universal model are
            // reversible, but this might not be the case. Could potentially use
            // the reaction string to check reversibility.
            lowerBound: -1000,
            upperBound: 1000,
            metabolites: response.data.metabolites.map(m => ({
              id: m.bigg_id,
              name: m.name,
              compartment: m.compartment_bigg_id,
              stoichiometry: m.stoichiometry
              // formula: null,
              // annotation: null
            }))
          };

          // Add the reaction to the card.
          this.$store.commit("interactiveMap/addReaction", {
            uuid: this.card.uuid,
            reaction: reaction
          });

          this.$emit("simulate-card");
        })
        .catch(error => {
          this.biggRequestError = true;
        });
    },
    addMnxReaction(addReaction: {
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
          if (!fullMetabolite) return m;
          if (!fullMetabolite.annotation) return m;
          if (!fullMetabolite.annotation.bigg) return m;

          // TODO: optimize for performance
          let matchingMetaboliteInModel = null as Metabolite | null | undefined;
          fullMetabolite.annotation.bigg.find(biggId => {
            matchingMetaboliteInModel = this.model.model_serialized.metabolites.find(
              m => m.id === biggId + "_" + m.compartment
            );
            return !!matchingMetaboliteInModel;
          });
          if (!matchingMetaboliteInModel) return m;

          return {
            ...m,
            id: matchingMetaboliteInModel.id,
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
      const lowerBound = parseFloat(this.editBoundsLowerBound);
      const upperBound = parseFloat(this.editBoundsUpperBound);

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
        this.$store.commit("interactiveMap/setObjectiveReaction", {
          uuid: this.card.uuid,
          reaction: null
        });
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
