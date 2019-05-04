<template>
  <v-card class="mb-2">
    <v-toolbar
      dense
      :color="color"
      class="white--text"
      :class="{ clickable: !isSelected }"
      @click="selectCard"
    >
      <v-toolbar-title class="body-2">{{ card.name }}</v-toolbar-title>
      <v-spacer></v-spacer>

      <v-dialog v-model="dialog" width="1200">
        <template v-slot:activator="{ on }">
          <v-btn flat icon v-on="on">
            <v-icon color="white">edit</v-icon>
          </v-btn>
        </template>

        <v-card class="pa-2">
          <v-form>
            <v-container>
              <p class="headline">
                Modify simulation card
              </p>

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
            </v-container>
          </v-form>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="simulateCard">
              Simulate
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-btn flat icon v-if="!isOnlyCard" @click="removeCard">
        <v-icon color="white">close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-progress-linear
      :indeterminate="true"
      v-if="card.isSimulating"
      class="my-0"
      height="3"
    ></v-progress-linear>
    <v-card-title primary-title class="py-2" v-if="isSelected">
      <v-layout wrap>
        <v-flex class="xs6">
          Organism:
        </v-flex>
        <v-flex class="xs6 text-xs-right">
          <span v-if="card.organism">{{ card.organism.name }}</span>
          <span v-else><em>Unknown</em></span>
        </v-flex>
        <v-flex class="xs6">
          Model:
        </v-flex>
        <v-flex class="xs6 text-xs-right">
          <span v-if="card.model">{{ card.model.name }}</span>
          <span v-else><em>Not selected</em></span>
        </v-flex>
        <v-flex class="xs6">
          Method:
        </v-flex>
        <v-flex class="xs6 text-xs-right">
          {{ card.method }}
        </v-flex>
        <v-flex class="xs6">
          Growth rate:
        </v-flex>
        <v-flex class="xs6 text-xs-right">
          <div v-if="!card.isSimulating">
            <span
              v-if="card.growthRate !== null"
              :class="{ dead: card.growthRate === 0 }"
            >
              {{ card.growthRate | round }} <em>h<sup>-1</sup></em>
            </span>
            <span v-else>
              N/A
            </span>
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

export default Vue.extend({
  name: "Card",
  data: () => ({
    dialog: false,
    methods: [
      { id: "fba", name: "Flux Balance Analysis (FBA)" },
      { id: "pfba", name: "Parsimonious FBA" },
      { id: "fva", name: "Flux Variability Analysis (FVA)" },
      { id: "pfba-fva", name: "Parsimonious FVA" }
    ]
  }),
  props: ["card", "isOnlyCard", "isSelected"],
  filters: {
    round(value) {
      return value.toFixed(3);
    }
  },
  computed: {
    color() {
      if (this.isSelected) {
        return "primary";
      } else {
        return "grey";
      }
    },
    organisms() {
      return this.$store.state.organisms.organisms;
    },
    modelsByOrganism() {
      return this.$store.state.models.models.filter(model => {
        return model.organism_id === this.card.organism.id;
      });
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
      this.dialog = false;
    },
    onOrganismChange() {
      // When selected organism is updated, update the selected model
      // correspondingly.
      // TODO: Choose a default preferred model.
      this.card.model = null;
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
