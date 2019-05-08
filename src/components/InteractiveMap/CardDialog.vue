<template>
  <v-dialog v-model="showDialog" width="1200">
    <template v-slot:activator="{ on }">
      <v-btn flat icon v-on="on">
        <v-icon color="white">edit</v-icon>
      </v-btn>
    </template>

    <v-card class="pa-2">
      <v-form>
        <v-container>
          <p class="headline">Modify simulation card</p>

          <v-layout wrap>
            <v-flex xs12 md3>
              <v-text-field
                label="Card name"
                v-model="card.name"
                required
              ></v-text-field>
            </v-flex>
            <v-flex xs12 md3>
              <v-select
                label="Organism"
                :items="organisms"
                v-model="card.organism"
                item-text="name"
                item-value="id"
                :hint="modificationsHint"
                persistent-hint
                return-object
                @change="onOrganismChange"
              ></v-select>
            </v-flex>
            <v-flex xs12 md3>
              <v-select
                label="Model"
                :items="modelsByOrganism"
                v-model="card.model"
                item-text="name"
                item-value="id"
                :hint="modificationsHint"
                persistent-hint
                return-object
              ></v-select>
            </v-flex>
            <v-flex xs12 md3>
              <v-select
                label="Method"
                :items="methods"
                v-model="card.method"
                item-text="name"
                item-value="id"
              ></v-select>
            </v-flex>
          </v-layout>

          <v-data-table
            hide-actions
            :headers="modificationsHeaders"
            :items="modifications"
            item-key="type + id"
          >
            <template v-slot:items="props">
              <!-- Added reaction -->
              <td v-if="props.item.type === 'added_reaction'">
                Added reaction
              </td>
              <td v-if="props.item.type === 'added_reaction'">
                <span v-if="props.item.name !== null">
                  {{ props.item.name }} ({{ props.item.id }})
                </span>
                <v-progress-circular
                  v-else
                  indeterminate
                  size="12"
                  :width="1"
                ></v-progress-circular>
              </td>
              <td v-if="props.item.type === 'added_reaction'">
                <span v-if="props.item.reactionString !== null">
                  {{ props.item.reactionString }}
                </span>
                <v-progress-circular
                  v-else
                  indeterminate
                  size="12"
                  :width="1"
                ></v-progress-circular>
              </td>

              <!-- Reaction knockout -->
              <td v-if="props.item.type === 'reaction_knockout'">
                Reaction knockout
              </td>
              <td v-if="props.item.type === 'reaction_knockout'">
                <span v-if="props.item.name !== null">
                  {{ props.item.name }} ({{ props.item.id }})
                </span>
                <v-progress-circular
                  v-else
                  indeterminate
                  size="12"
                  :width="1"
                ></v-progress-circular>
              </td>
              <td v-if="props.item.type === 'reaction_knockout'">
                <span
                  v-if="props.item.reactionString !== null"
                  v-html="props.item.reactionString"
                />
                <v-progress-circular
                  v-else
                  indeterminate
                  size="12"
                  :width="1"
                ></v-progress-circular>
              </td>

              <!-- Gene knockout -->
              <td v-if="props.item.type === 'gene_knockout'">
                Gene knockout
              </td>
              <td v-if="props.item.type === 'gene_knockout'">
                <span v-if="props.item.name !== null">
                  {{ props.item.name }} ({{ props.item.id }})
                </span>
                <v-progress-circular
                  v-else
                  indeterminate
                  size="12"
                  :width="1"
                ></v-progress-circular>
              </td>
              <td v-if="props.item.type === 'gene_knockout'">
                <span v-if="props.item.reactions !== null">
                  <p
                    class="mb-0"
                    v-for="reaction in props.item.reactions"
                    :key="reaction.id"
                  >
                    {{ reaction.name }} ({{ reaction.bigg_id }})
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
              <td v-if="props.item.type === 'edited_bounds'">
                Modified bounds
              </td>
              <td v-if="props.item.type === 'edited_bounds'">
                {{ props.item.name }} ({{ props.item.id }})
              </td>
              <td v-if="props.item.type === 'edited_bounds'">
                Bounds set from {{ props.item.lowerBound }} to
                {{ props.item.upperBound }}
              </td>

              <td>
                <v-btn flat icon @click="clearModification(props.item)">
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
                :loading="card.fullModel === null"
                v-model="card.objective.reaction"
                :item-text="reactionDisplay"
                item-value="id"
                hint="When left empty, the objective is growth."
                persistent-hint
                placeholder="Specify any reaction as objective..."
                prepend-icon="done"
                return-object
                clearable
              ></v-autocomplete>
            </v-flex>

            <v-flex shrink>
              <v-switch
                v-model="card.objective.maximize"
                color="primary"
                :label="card.objective.maximize ? 'Maximize' : 'Minimize'"
              ></v-switch>
            </v-flex>
          </v-layout>

          <v-autocomplete
            v-model="addReactionItem"
            :items="addReactionSearchResults"
            :loading="isLoadingAddReaction"
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

          <v-autocomplete
            v-model="knockoutReactionItem"
            :items="reactions"
            :loading="card.fullModel === null"
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
            :loading="card.fullModel === null"
            hide-no-data
            :item-text="reactionDisplay"
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
                  :loading="card.fullModel === null"
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
                  label="Number"
                  :rules="[editBoundsBoundRule]"
                ></v-text-field>
              </v-flex>
              <v-flex shrink mr-2>
                <v-text-field
                  v-model="editBoundsUpperBound"
                  type="number"
                  label="Number"
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
        </v-container>
      </v-form>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="simulate">Simulate</v-btn>
      </v-card-actions>
    </v-card>

    <v-snackbar color="error" v-model="biggRequestError" :timeout="6000">
      Could not search BiGG for reactions, please check your internet
      connection.
    </v-snackbar>
    <v-snackbar color="error" v-model="hasInvalidBoundsError" :timeout="6000">
      The lower bound cannot be larger than the upper bound.
    </v-snackbar>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import * as settings from "@/settings";
import * as bigg from "@/bigg";

export default Vue.extend({
  name: "CardDialog",
  data: () => ({
    showDialog: false,
    methods: [
      { id: "fba", name: "Flux Balance Analysis (FBA)" },
      { id: "pfba", name: "Parsimonious FBA" },
      { id: "fva", name: "Flux Variability Analysis (FVA)" },
      { id: "pfba-fva", name: "Parsimonious FVA" }
    ],
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
  props: ["card", "modifications"],
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
          this.addReactionSearchResults = response.data.results.map(
            reaction => ({
              id: reaction.bigg_id,
              name: reaction.name
            })
          );
        })
        .catch(error => {
          this.biggRequestError = true;
        })
        .then(() => {
          this.isLoadingAddReaction = false;
        });
    }
  },
  computed: {
    organisms() {
      return this.$store.state.organisms.organisms;
    },
    modelsByOrganism() {
      return this.$store.state.models.models.filter(model => {
        return model.organism_id === this.card.organism.id;
      });
    },
    modificationsHint() {
      if (this.modifications.length > 0) {
        return `Changing this will reset ${
          this.modifications.length
        } modifications`;
      } else {
        return null;
      }
    },
    reactions() {
      if (this.card.fullModel === null) {
        return [];
      }
      return this.card.fullModel.model_serialized.reactions;
    },
    genes() {
      if (this.card.fullModel === null) {
        return [];
      }
      return this.card.fullModel.model_serialized.genes;
    }
  },
  methods: {
    onOrganismChange() {
      // When selected organism is updated, update the selected model
      // correspondingly.
      // TODO: Choose a default preferred model.
      this.card.model = null;
    },
    simulate() {
      this.showDialog = false;
      this.$emit("simulate-card");
    },
    reactionDisplay(reaction) {
      return `${reaction.name} (${reaction.id})`;
    },
    geneDisplay(gene) {
      return `${gene.name} (${gene.id})`;
    },
    addReaction(addedReaction) {
      // Add the reaction only if it's not already added.
      if (!this.card.reactionAdditions.some(r => r.id === addedReaction.id)) {
        this.card.reactionAdditions.push(addedReaction);
      }
      this.addReactionSearchQuery = null;
      this.$nextTick(() => {
        this.addReactionItem = null;
      });
    },
    knockoutReaction() {
      const reaction = bigg.lookupReaction(this.knockoutReactionItem.id);
      // Add the reaction only if it's not already added.
      if (!this.card.reactionKnockouts.some(r => r.id === reaction.id)) {
        this.card.reactionKnockouts.push(reaction);
      }
      this.$nextTick(() => {
        this.knockoutReactionItem = null;
      });
    },
    knockoutGene() {
      const gene = bigg.lookupGene(
        this.card.fullModel.model_serialized.id,
        this.knockoutGeneItem.id
      );
      // Add the gene only if it's not already added.
      if (!this.card.geneKnockouts.some(g => g.id === gene.id)) {
        this.card.geneKnockouts.push(gene);
      }
      this.$nextTick(() => {
        this.knockoutGeneItem = null;
      });
    },
    editBounds() {
      const lowerBound = parseInt(this.editBoundsLowerBound);
      const upperBound = parseInt(this.editBoundsUpperBound);

      if (lowerBound > upperBound) {
        this.hasInvalidBoundsError = true;
        return;
      }

      const existingModification = this.card.editedBounds.find(bounds => {
        return bounds.id === this.editBoundsReaction.id;
      });
      if (existingModification !== undefined) {
        // Update the existing modification
        existingModification.lowerBound = lowerBound;
        existingModification.upperBound = upperBound;
      } else {
        const reaction = bigg.lookupReaction(this.editBoundsReaction.id);
        reaction.lowerBound = lowerBound;
        reaction.upperBound = upperBound;
        this.card.editedBounds.push(reaction);
      }
      this.$refs.editBoundsForm.reset();
    },
    clearModification(modification) {
      if (modification.type === "added_reaction") {
        const index = this.card.reactionAdditions.findIndex(
          reaction => reaction.id === modification.id
        );
        this.card.reactionAdditions.splice(index, 1);
      } else if (modification.type === "reaction_knockout") {
        const index = this.card.reactionKnockouts.indexOf(modification.id);
        this.card.reactionKnockouts.splice(index, 1);
      } else if (modification.type === "gene_knockout") {
        const index = this.card.geneKnockouts.indexOf(modification.id);
        this.card.geneKnockouts.splice(index, 1);
      } else if (modification.type === "edited_bounds") {
        const index = this.card.editedBounds.findIndex(
          bounds => bounds.reactionId === modification.id
        );
        this.card.editedBounds.splice(index, 1);
      }
    }
  }
});
</script>
