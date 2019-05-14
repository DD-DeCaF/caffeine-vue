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
                :rules="[v => !!v || 'Please choose the metabolic model.']"
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
                prepend-icon="help"
                @click:prepend="$emit('open-method-help-dialog')"
                @change="$emit('simulate-card')"
              ></v-select>
            </v-flex>
          </v-layout>

          <CardDialogDesign
            v-if="!card.dataDriven"
            :card="card"
            :modifications="modifications"
            @simulate-card="$emit('simulate-card')"
          />
          <CardDialogDataDriven
            v-else
            :card="card"
            :modifications="modifications"
            @simulate-card="$emit('simulate-card')"
            @load-data-error="$emit('load-data-error')"
          />
        </v-container>
      </v-form>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-progress-circular
          v-if="card.isSimulating"
          indeterminate
          size="12"
          :width="1"
        ></v-progress-circular>
        <span v-if="card.isSimulating" class="mx-2">
          <em>Simulating...</em>
        </span>
        <v-btn color="primary" @click="showDialog = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import * as settings from "@/utils/settings";
import * as bigg from "@/utils/bigg";
import CardDialogDesign from "@/views/InteractiveMap/CardDialogDesign.vue";
import CardDialogDataDriven from "@/views/InteractiveMap/CardDialogDataDriven.vue";

export default Vue.extend({
  name: "CardDialog",
  components: {
    CardDialogDesign,
    CardDialogDataDriven
  },
  data: () => ({
    showDialog: false,
    methods: [
      { id: "fba", name: "Flux Balance Analysis (FBA)" },
      { id: "pfba", name: "Parsimonious FBA" },
      { id: "fva", name: "Flux Variability Analysis (FVA)" },
      { id: "pfba-fva", name: "Parsimonious FVA" }
    ]
  }),
  props: ["card", "modifications"],
  watch: {
    "card.model"() {
      this.$emit("simulate-card");
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
    }
  }
});
</script>
