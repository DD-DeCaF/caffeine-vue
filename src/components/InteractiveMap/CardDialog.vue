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
          >
            <template v-slot:items="props">
              <td>{{ props.item.type }}</td>
              <td>{{ props.item.name }}</td>
              <td>{{ props.item.details }}</td>
            </template>
          </v-data-table>

          <v-autocomplete
            v-model="addReactionItem"
            :items="addReactionSearchResults"
            :loading="isLoadingAddReaction"
            :search-input.sync="addReactionSearchQuery"
            hide-no-data
            :item-text="reactionDisplay"
            item-value="id"
            label="Add a reaction from BiGG..."
            prepend-icon="get_app"
            return-object
            @change="addReaction"
          ></v-autocomplete>
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

    <v-snackbar color="error" v-model="addedReactionExists" :timeout="6000">
      This reaction is already added.
    </v-snackbar>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import * as settings from "@/settings";

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
      { text: "Modifications", value: "type", sortable: false },
      { text: "Name or ID", value: "id", sortable: false },
      { text: "Details", value: "details", sortable: false }
    ],
    addReactionItem: null,
    addReactionSearchQuery: null,
    addReactionSearchResults: [],
    isLoadingAddReaction: false,
    biggRequestError: false,
    addedReactionExists: false
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
    reactionDisplay(item) {
      return `${item.name} (${item.id})`;
    },
    addReaction(addedReaction) {
      this.addReactionItem = null;
      this.addReactionSearchQuery = null;
      const existingReaction = this.card.reactionAdditions.find(
        reaction => addedReaction.id === reaction.id
      );
      if (existingReaction !== undefined) {
        this.addedReactionExists = true;
      } else {
        this.card.reactionAdditions.push(addedReaction);
      }
    }
  }
});
</script>
