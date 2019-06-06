<template>
  <v-dialog v-model="showDialog" width="1000">
    <v-card class="pa-3">
      <div class="body-2 mb-2">Reaction string:</div>
      <v-text-field :value="reactionString" solo readonly></v-text-field>
      <div>
        <div class="body-1 ml-3 mb-2">
          Substrates:
        </div>
        <v-layout column mx-3>
          <div
            v-for="(metabolite, index) in substrates"
            :key="metabolite.id + index"
          >
            <v-layout>
              <v-flex xs1>
                <v-text-field
                  v-model="metabolite.stoichiometry"
                  solo
                  class="mx-2"
                  type="number"
                ></v-text-field></v-flex
              ><v-flex xs7>
                <v-autocomplete
                  v-model="metabolite.id"
                  label="Metabolite"
                  :items="metaboliteItems"
                  :item-text="metaboliteDisplay"
                  item-value="id"
                  clearable
                  class="mx-2"
                >
                </v-autocomplete
              ></v-flex>
              <v-flex xs3
                ><v-autocomplete
                  v-model="metabolite.compartment"
                  label="Compartment"
                  :items="compartmentItems"
                  :item-text="compartmentDisplay"
                  item-value="id"
                  clearable
                  class="mx-2"
                >
                </v-autocomplete
              ></v-flex>
              <v-flex xs1
                ><v-btn icon @click="addSubstrate">
                  <v-icon color="primary">add_circle</v-icon></v-btn
                ></v-flex
              >
            </v-layout>
          </div>
        </v-layout>
        <div class="body-1 ml-3 mb-2">
          Product:
        </div>
        <v-layout column mx-3>
          <div
            v-for="(metabolite, index) in products"
            :key="metabolite.id + index"
          >
            <v-layout>
              <v-flex xs1>
                <v-text-field
                  v-model="metabolite.stoichiometry"
                  solo
                  class="mx-2"
                  type="number"
                ></v-text-field></v-flex
              ><v-flex xs7>
                <v-autocomplete
                  v-model="metabolite.id"
                  label="Metabolite"
                  :items="metaboliteItems"
                  :item-text="metaboliteDisplay"
                  item-value="id"
                  clearable
                  class="mx-2"
                >
                </v-autocomplete
              ></v-flex>
              <v-flex xs3
                ><v-autocomplete
                  v-model="metabolite.compartment"
                  label="Compartment"
                  :items="compartmentItems"
                  :item-text="compartmentDisplay"
                  item-value="id"
                  clearable
                  class="mx-2"
                >
                </v-autocomplete
              ></v-flex>
              <v-flex xs1
                ><v-btn icon @click="addProduct">
                  <v-icon color="primary">add_circle</v-icon></v-btn
                ></v-flex
              >
            </v-layout>
          </div>
        </v-layout>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "ReactionDialog",
  props: ["model", "value"],
  data: () => ({
    substrates: [
      {
        id: "",
        name: "",
        compartment: "",
        stoichiometry: 1
      }
    ],
    products: [
      {
        id: "",
        name: "",
        compartment: "",
        stoichiometry: 1
      }
    ]
  }),
  computed: {
    reactionString() {
      const substratesSerialized = this.serializeMetabolites(
        this.substrates
      ).join(" + ");
      const productsSerialized = this.serializeMetabolites(this.products).join(
        " + "
      );
      if (!productsSerialized) return substratesSerialized;
      return substratesSerialized + " ⇌ " + productsSerialized;
    },
    metaboliteItems() {
      return this.model.model_serialized
        ? this.model.model_serialized.metabolites
        : [];
    },
    compartmentItems() {
      return this.model.model_serialized
        ? Object.keys(this.model.model_serialized.compartments).map(id => ({
            id: id,
            name: this.model.model_serialized.compartments[id]
          }))
        : [];
    },
    showDialog: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("input", value);
      }
    }
  },
  methods: {
    metaboliteDisplay(metabolite) {
      const id = metabolite.id.substring(0, metabolite.id.length - 2);
      return `${metabolite.name} (${id})`;
    },
    compartmentDisplay(compartment) {
      return `${compartment.name} (${compartment.id})`;
    },
    serializeMetabolites(metabolites) {
      return metabolites.map(metabolite => {
        const stoichiometryNormalized = Math.abs(metabolite.stoichiometry);
        const stoichiometrySerialized =
          stoichiometryNormalized === 1 ? "" : stoichiometryNormalized + " ";
        const id = metabolite.id
          ? metabolite.id.substring(0, metabolite.id.length - 2)
          : "";
        const compartment = metabolite.compartment
          ? "_" + metabolite.compartment
          : "";
        return stoichiometrySerialized + id + compartment;
      });
    },
    addSubstrate() {
      this.substrates.push({
        id: "",
        name: "",
        compartment: "",
        stoichiometry: 1
      });
    },
    addProduct() {
      this.products.push({
        id: "",
        name: "",
        compartment: "",
        stoichiometry: 1
      });
    }
  }
});
</script>
