<template>
  <v-dialog v-model="showDialog" width="1000">
    <v-card class="pa-3">
      <v-form ref="form" v-model="valid" lazy-validation>
        <div class="subheading mb-2">Reaction string:</div>
        <v-text-field
          :value="reactionString"
          :rules="reactionStringRules"
          solo
          readonly
        ></v-text-field>
        <v-layout align-center>
          <div class="mx-3 body-2">Reaction name:</div>

          <v-text-field
            v-model="reactionName"
            :rules="reactionNameRules"
            class="mx-2"
          ></v-text-field>
        </v-layout>
        <v-layout align-center>
          <div class="mx-3 body-2">Reaction id:</div>
          <v-text-field
            v-model="reactionId"
            :rules="[reactionIdRules]"
            class="mx-2"
          ></v-text-field
        ></v-layout>
        <v-layout align-center>
          <div class="mx-3 body-2">Bounds:</div>
          <v-flex xs2 mx-2>
            <v-text-field
              v-model.number="lowerBound"
              type="number"
              label="Lower bound"
              :rules="[singleBoundRules, boundRules(lowerBound, upperBound)]"
            ></v-text-field>
          </v-flex>
          <v-flex xs2 mx-2>
            <v-text-field
              v-model.number="upperBound"
              type="number"
              label="Upper bound"
              :rules="[singleBoundRules, boundRules(lowerBound, upperBound)]"
            ></v-text-field>
          </v-flex>
        </v-layout>
        <div class="body-2 ml-3 mb-2">
          Substrates:
        </div>
        <v-layout column mx-3>
          <div v-for="(metabolite, index) in substrates" :key="index">
            <v-layout>
              <v-flex xs1>
                <v-text-field
                  v-model.number="metabolite.stoichiometry"
                  :rules="[stoichiometryRules(metabolite)]"
                  solo
                  class="mx-2"
                  type="number"
                ></v-text-field></v-flex
              ><v-flex xs7>
                <v-autocomplete
                  v-model="metabolite.metabolite"
                  label="Metabolite"
                  :items="metaboliteItems"
                  :item-text="metaboliteDisplay"
                  item-value="id"
                  return-object
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
                  :rules="[compartmentRules(metabolite)]"
                  clearable
                  class="mx-2"
                >
                </v-autocomplete
              ></v-flex>
              <v-flex xs1>
                <v-layout
                  ><v-btn icon @click="addSubstrate">
                    <v-icon color="primary">add_circle</v-icon></v-btn
                  >
                  <v-btn icon v-if="substrates.length > 1" @click="deleteSubstrate(index)">
                    <v-icon color="primary">delete</v-icon></v-btn
                  ></v-layout
                ></v-flex
              >
            </v-layout>
          </div>
        </v-layout>
        <div class="body-2 ml-3 mb-2">
          Product:
        </div>
        <v-layout column mx-3>
          <div v-for="(metabolite, index) in products" :key="index">
            <v-layout>
              <v-flex xs1>
                <v-text-field
                  v-model.number="metabolite.stoichiometry"
                  :rules="[stoichiometryRules(metabolite)]"
                  solo
                  class="mx-2"
                  type="number"
                ></v-text-field></v-flex
              ><v-flex xs7>
                <v-autocomplete
                  v-model="metabolite.metabolite"
                  label="Metabolite"
                  :items="metaboliteItems"
                  :item-text="metaboliteDisplay"
                  item-value="id"
                  return-object
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
                  :rules="[compartmentRules(metabolite)]"
                  clearable
                  class="mx-2"
                >
                </v-autocomplete
              ></v-flex>
              <v-flex xs1>
                <v-layout
                  ><v-btn icon @click="addProduct">
                    <v-icon color="primary">add_circle</v-icon></v-btn
                  >
                  <v-btn icon v-if="products.length > 1" @click="deleteProduct(index)">
                    <v-icon color="primary">delete</v-icon></v-btn
                  ></v-layout
                ></v-flex
              >
            </v-layout>
          </div>
        </v-layout>
        <v-layout justify-end>
          <v-btn @click="clear" color="primary" flat>Clear</v-btn>
          <v-btn @click="addReaction" color="primary" :disabled="!valid"
            >Add reaction</v-btn
          ></v-layout
        >
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Reaction } from "@/store/modules/interactiveMap";

function getInitialState() {
  return {
    substrates: [
      {
        metabolite: null,
        compartment: "",
        stoichiometry: 1
      }
    ],
    products: [
      {
        metabolite: null,
        compartment: "",
        stoichiometry: 1
      }
    ],
    lowerBound: -1000,
    upperBound: 1000,
    reactionId: "",
    reactionName: "",
    valid: true,
    reactionStringRules: [v => !!v || "Reaction string should not be empty"],
    reactionNameRules: [v => !!v || "Reaction name is required"],
    singleBoundRules: v => {
      if (!v) {
        return "Bounds are required";
      }
      if (isNaN(v)) {
        return "Bounds must be a number";
      }
      if (v < -1000 || v > 1000) {
        return "Bounds must be in the range of -1000 to 1000";
      }
      return true;
    },
    stoichiometryRules: metabolite => {
      if (metabolite.metabolite && !metabolite.stoichiometry) {
        return "Stoichiometry is required";
      }
      if (metabolite.stoichiometry && metabolite.stoichiometry <= 0) {
        return "Please provide positive value";
      }
      return true;
    },
    compartmentRules: metabolite => {
      if (metabolite.metabolite && !metabolite.compartment) {
        return "Compartment is required";
      }
      return true;
    }
  };
}

export default Vue.extend({
  name: "ReactionDialog",
  props: ["model", "value", "card"],
  data: () => getInitialState(),
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
      return `${metabolite.name} (${this.getMetaboliteId(
        metabolite.id,
        metabolite.compartment
      )})`;
    },
    compartmentDisplay(compartment) {
      return `${compartment.name} (${compartment.id})`;
    },
    reactionIdRules(v) {
      if (!v) {
        return "Reaction id is required";
      }
      if (/\s/.test(v)) {
        return "Id should not contain whitespaces";
      }
      if (
        v &&
        this.model.model_serialized &&
        this.model.model_serialized.reactions.some(
          reaction => reaction.id === v
        )
      ) {
        return "Provided id already exists in the model";
      }
      return true;
    },
    boundRules(lowerBound, upperBound) {
      if (lowerBound > upperBound) {
        return "The lower bound cannot be larger than the upper bound";
      }
      return true;
    },
    serializeMetabolites(metabolites) {
      return metabolites
        .filter(m => m.metabolite)
        .map(metabolite => {
          const compartment = metabolite.compartment
            ? "_" + metabolite.compartment
            : "";
          return (
            metabolite.stoichiometry +
            " " +
            this.getMetaboliteId(
              metabolite.metabolite.id,
              metabolite.metabolite.compartment
            ) +
            compartment
          );
        });
    },
    getMetaboliteId(idWithCompartment, compartmentInMetabolite) {
      // getMetaboliteId('abc_c', 'c') => 'abc'
      // getMetaboliteId('abc_1', 'c') => 'abc_1'
      const compartmentInId = idWithCompartment.substring(
        idWithCompartment.lastIndexOf("_") + 1
      );
      if (compartmentInId !== compartmentInMetabolite) {
        return idWithCompartment;
      } else {
        return idWithCompartment.substring(
          0,
          idWithCompartment.lastIndexOf("_")
        );
      }
    },
    addSubstrate() {
      this.substrates.push({
        metabolite: null,
        compartment: "",
        stoichiometry: 1
      });
    },
    deleteSubstrate(index) {
      this.substrates.splice(index, 1);
    },
    addProduct() {
      this.products.push({
        metabolite: null,
        compartment: "",
        stoichiometry: 1
      });
    },
    deleteProduct(index) {
      this.products.splice(index, 1);
    },
    addReaction() {
      if (!this.$refs.form.validate()) {
        return;
      }

      const negativeSubstrates = this.substrates.map(m => ({
        ...m,
        stoichiometry: -m.stoichiometry
      }));

      const reaction: Reaction = {
        id: this.reactionId,
        name: this.reactionName,
        reactionString: this.reactionString,
        // Note: Assuming all reactions in the universal model are
        // reversible, but this might not be the case. Could potentially use
        // the reaction string to check reversibility.
        lowerBound: this.lowerBound,
        upperBound: this.upperBound,
        metabolites: [...negativeSubstrates, ...this.products]
          .filter(m => m.metabolite)
          .map(m => ({
            id: m.metabolite.id,
            name: m.metabolite.name,
            compartment: m.compartment,
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
      this.$refs.form.reset();
      this.showDialog = false;
    },
    clear() {
      this.$refs.form.resetValidation();
      Object.assign(this.$data, getInitialState());
    }
  }
});
</script>
