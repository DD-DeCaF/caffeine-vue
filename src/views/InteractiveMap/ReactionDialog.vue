<template>
  <v-dialog v-model="showDialog" width="1000">
    <v-card class="pa-3">
      <div class="subheading mb-2">Reaction string:</div>
      <v-text-field :value="reactionString" solo readonly></v-text-field>
      <v-form ref="form" v-model="valid" lazy-validation>
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
            :rules="reactionIdRules"
            class="mx-2"
          ></v-text-field
        ></v-layout>
        <v-layout align-center>
          <div class="mx-3 body-2">Bounds:</div>
          <v-flex xs2 mx-2>
            <v-text-field
              v-model="lowerBound"
              type="number"
              label="Lower bound"
              :rules="[boundRules]"
            ></v-text-field>
          </v-flex>
          <v-flex xs2 mx-2>
            <v-text-field
              v-model="upperBound"
              type="number"
              label="Upper bound"
              :rules="[boundRules]"
            ></v-text-field>
          </v-flex>
          <v-flex
            ><div v-if="hasInvalidBoundsError" class="red--text">
              The lower bound cannot be larger than the upper bound
            </div></v-flex
          >
        </v-layout>
        <div class="body-2 ml-3 mb-2">
          Substrates:
        </div>
        <v-layout column mx-3>
          <div v-for="(metabolite, index) in substrates" :key="index">
            <v-layout>
              <v-flex xs1>
                <v-text-field
                  v-model="metabolite.stoichiometry"
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
              <v-flex xs1
                ><v-btn icon @click="addSubstrate">
                  <v-icon color="primary">add_circle</v-icon></v-btn
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
                  v-model="metabolite.stoichiometry"
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
              <v-flex xs1
                ><v-btn icon @click="addProduct">
                  <v-icon color="primary">add_circle</v-icon></v-btn
                ></v-flex
              >
            </v-layout>
          </div>
        </v-layout>
        <v-btn
          @click="addReaction"
          color="primary"
          :disabled="!valid || hasInvalidBoundsError || !reactionString"
          >Add reaction</v-btn
        >
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Reaction } from "@/store/modules/interactiveMap";

export default Vue.extend({
  name: "ReactionDialog",
  props: ["model", "value", "card"],
  data: () => ({
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
    boundRules: value => {
      if (isNaN(parseFloat(value))) {
        return "Bounds must be a number";
      }
      if (value < -1000 || value > 1000) {
        return "Bounds must be in the range of -1000 to 1000";
      }
      return true;
    },
    reactionNameRules: [v => !!v || "Reaction name is required"],
    reactionIdRules: [
      v => !!v || "Reaction id is required",
      v => (v && !/\s/.test(v)) || "Id should not contain whitespaces"
    ],
    stoichiometryRules: metabolite => {
      if (metabolite.metabolite && !metabolite.stoichiometry) {
        return "Stoichiometry is required";
      }
      if (
        metabolite.stoichiometry &&
        parseFloat(metabolite.stoichiometry) === 0
      ) {
        return "Stoichiometry cannot be 0";
      }
      return true;
    },
    compartmentRules: metabolite => {
      if (metabolite.metabolite && !metabolite.compartment) {
        return "Compartment is required";
      }
      return true;
    },
    lowerBound: -1000,
    upperBound: 1000,
    reactionId: "",
    reactionName: "",
    valid: true
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
    },
    hasInvalidBoundsError() {
      return parseFloat(this.lowerBound) > parseFloat(this.upperBound);
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
    serializeMetabolites(metabolites) {
      return metabolites
        .filter(m => m.metabolite)
        .map(metabolite => {
          const stoichiometrySerialized =
            metabolite.stoichiometry === 1
              ? ""
              : metabolite.stoichiometry + " ";
          const compartment = metabolite.compartment
            ? "_" + metabolite.compartment
            : "";
          return (
            stoichiometrySerialized +
            this.getMetaboliteId(
              metabolite.metabolite.id,
              metabolite.metabolite.compartment
            ) +
            compartment
          );
        });
    },
    getMetaboliteId(idWithCompartment, compartmentInMetabolite) {
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
    addProduct() {
      this.products.push({
        metabolite: null,
        compartment: "",
        stoichiometry: 1
      });
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
    }
  }
});
</script>
