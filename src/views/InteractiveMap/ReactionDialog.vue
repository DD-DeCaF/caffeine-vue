<template>
  <v-dialog v-model="showDialog" width="1000">
    <v-card class="pa-4">
      <v-form ref="form" v-model="isValid" lazy-validation>
        <v-layout align-center>
          <div class="mr-3 body-2">Reaction name:</div>

          <v-text-field
            v-model="reactionName"
            :rules="reactionNameRules"
            class="mx-2"
          ></v-text-field>
        </v-layout>
        <v-layout align-center>
          <div class="mr-3 body-2">Reaction id:</div>
          <v-text-field
            v-model="reactionId"
            :rules="[reactionIdRules]"
            class="mx-2"
          ></v-text-field
        ></v-layout>
        <v-layout align-center>
          <div class="mr-3 body-2">Bounds:</div>
          <v-flex xs2 mx-2>
            <v-number-field
              v-model.number="lowerBound"
              step="any"
              label="Lower bound"
              :rules="[singleBoundRules, boundRules(lowerBound, upperBound)]"
            ></v-number-field>
          </v-flex>
          <v-flex xs2 mx-2>
            <v-number-field
              v-model.number="upperBound"
              step="any"
              label="Upper bound"
              :rules="[singleBoundRules, boundRules(lowerBound, upperBound)]"
            ></v-number-field>
          </v-flex>
        </v-layout>
        <div class="body-2 my-2">
          Substrates:
        </div>
        <v-layout column mx-3>
          <div v-for="(metabolite, index) in substrates" :key="index">
            <v-layout>
              <v-flex xs11>
                <ReactionDialogMetabolite
                  :model="model"
                  :customMetabolites="customMetabolites"
                  :metabolite="metabolite"
              /></v-flex>
              <v-flex xs1>
                <v-layout
                  ><v-btn icon @click="addSubstrate">
                    <v-icon color="primary">add_circle</v-icon></v-btn
                  >
                  <v-btn
                    icon
                    v-if="substrates.length > 1"
                    @click="deleteSubstrate(index)"
                  >
                    <v-icon color="primary">delete</v-icon></v-btn
                  ></v-layout
                ></v-flex
              >
            </v-layout>
          </div>
        </v-layout>
        <div class="body-2 mb-2">
          Products:
        </div>
        <v-layout column mx-3>
          <div v-for="(metabolite, index) in products" :key="index">
            <v-layout>
              <v-flex xs11>
                <ReactionDialogMetabolite
                  :model="model"
                  :customMetabolites="customMetabolites"
                  :metabolite="metabolite"
              /></v-flex>
              <v-flex xs1>
                <v-layout
                  ><v-btn icon @click="addProduct">
                    <v-icon color="primary">add_circle</v-icon></v-btn
                  >
                  <v-btn
                    icon
                    v-if="products.length > 1"
                    @click="deleteProduct(index)"
                  >
                    <v-icon color="primary">delete</v-icon></v-btn
                  ></v-layout
                ></v-flex
              ></v-layout
            >
          </div>
        </v-layout>
        <div class="subheading mb-2">Preview:</div>
        <v-text-field
          :value="reactionString"
          :rules="reactionStringRules"
          solo
          readonly
        ></v-text-field>
        <v-layout justify-end>
          <v-btn @click="clear" color="primary" flat>Clear</v-btn>
          <v-btn @click="addReaction" color="primary" :disabled="!isValid"
            >Add reaction</v-btn
          ></v-layout
        >
      </v-form>
    </v-card>
    <v-snackbar color="error" v-model="mnxRequestError" :timeout="6000">
      Could not search Metanetx for metabolites, please check your internet
      connection.
    </v-snackbar>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Reaction } from "@/store/modules/interactiveMap";
import ReactionDialogMetabolite from "@/views/InteractiveMap/ReactionDialogMetabolite.vue";
import * as settings from "@/utils/settings";
import { getMetaboliteId } from "@/utils/metabolite";
import { buildReactionString } from "@/utils/reaction";
import axios from "axios";

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
    isValid: true,
    reactionStringRules: [v => !!v || "Reaction string should not be empty"],
    reactionNameRules: [v => !!v || "Reaction name is required"],
    customMetabolites: [],
    mnxRequestError: false,
    singleBoundRules: v => {
      if (!v && v !== 0) {
        return "Bounds are required";
      }
      if (isNaN(v)) {
        return "Bounds must be a number";
      }
      return true;
    }
  };
}

export default Vue.extend({
  name: "ReactionDialog",
  components: {
    ReactionDialogMetabolite
  },
  props: ["model", "value", "card", "inputReaction"],
  data: () => getInitialState(),
  computed: {
    reactionString() {
      return buildReactionString(
        [
          ...this.serializeMetabolites(this.substrates, false),
          ...this.serializeMetabolites(this.products, true)
        ],
        this.lowerBound,
        this.upperBound
      );
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
  watch: {
    inputReaction(inputReaction: Reaction) {
      this.clear();
      this.reactionId = inputReaction.id;
      this.reactionName = inputReaction.name;
      this.lowerBound = inputReaction.lowerBound;
      this.upperBound = inputReaction.upperBound;

      const metabolites = inputReaction.metabolites.map(m => ({
        metabolite: { id: m.id, name: m.name, formula: m.formula },
        compartment: m.compartment,
        stoichiometry: m.stoichiometry
      }));
      this.substrates = metabolites
        .filter(m => m.stoichiometry < 0)
        .map(m => ({ ...m, stoichiometry: -m.stoichiometry }));
      this.products = metabolites.filter(m => m.stoichiometry >= 0);

      this.customMetabolites.push(...metabolites.map(m => m.metabolite));
    }
  },
  methods: {
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
    serializeMetabolites(metabolites, isProduct) {
      return metabolites
        .filter(metabolite => metabolite.metabolite)
        .map(metabolite => ({
          stoichiometry: isProduct
            ? Math.abs(metabolite.stoichiometry)
            : -Math.abs(metabolite.stoichiometry),
          id: getMetaboliteId(
            metabolite.metabolite.id,
            metabolite.metabolite.compartment
          ),
          compartment: metabolite.compartment || "",
          name: metabolite.metabolite.name || "N/A",
          formula: metabolite.metabolite.formula || "N/A"
        }));
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
        lowerBound: this.lowerBound,
        upperBound: this.upperBound,
        metabolites: [...negativeSubstrates, ...this.products]
          .filter(m => m.metabolite)
          .map(m => ({
            id: getMetaboliteId(m.metabolite.id, m.metabolite.compartment),
            name: m.metabolite.name,
            formula: m.metabolite.formula,
            compartment: m.compartment,
            stoichiometry: m.stoichiometry
          }))
      };

      // Add the reaction to the card.
      this.$store.commit("interactiveMap/addReaction", {
        uuid: this.card.uuid,
        reaction: reaction
      });

      this.$emit("simulate-card");
      this.clear();
      this.showDialog = false;
    },
    clear() {
      this.$refs.form.resetValidation();
      Object.assign(this.$data, getInitialState());
    }
  }
});
</script>
