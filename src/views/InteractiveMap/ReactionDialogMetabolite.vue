<template>
  <v-layout>
    <MetaboliteDialog
      v-model="isMetaboliteDialogVisible"
      @return-object="passMetabolite"
    />
    <v-flex xs1>
      <v-text-field
        v-model.number="metabolite.stoichiometry"
        :rules="[stoichiometryRules(metabolite)]"
        solo
        class="mx-1"
        type="number"
      ></v-text-field></v-flex
    ><v-flex xs8>
      <v-autocomplete-extended
        v-model="metabolite.metabolite"
        label="Metabolite"
        :items="metaboliteItems"
        :item-text="metaboliteDisplay"
        :search-input.sync="metaboliteSearchQuery"
        item-value="id"
        return-object
        clearable
        class="mx-2"
        hide-selected
        @change="onMetaboliteChange(metabolite, $event)"
      >
        <template v-slot:prepend-item>
          <v-btn
            flat
            @click.stop="isMetaboliteDialogVisible = true"
            class="pl-0"
          >
            <v-icon class="mr-2" color="primary">add_circle</v-icon>
            New metabolite
          </v-btn>
        </template>
      </v-autocomplete-extended></v-flex
    >
    <v-flex xs3
      ><v-autocomplete-extended
        v-model="metabolite.compartment"
        label="Compartment"
        :items="compartmentItems"
        :item-text="compartmentDisplay"
        item-value="id"
        :rules="[compartmentRules(metabolite)]"
        clearable
        class="mx-2"
      >
      </v-autocomplete-extended
    ></v-flex>
  </v-layout>
</template>

<script lang="ts">
import Vue from "vue";
import MetaboliteDialog from "@/views/InteractiveMap/MetaboliteDialog.vue";
import * as settings from "@/utils/settings";
import { getMetaboliteId } from "@/utils/metabolite";
import axios from "axios";

export default Vue.extend({
  name: "ReactionDialogMetabolite",
  components: {
    MetaboliteDialog
  },
  props: ["model", "customMetabolites", "metabolite"],
  data: () => ({
    isMetaboliteDialogVisible: false,
    mnxSearchResults: [],
    mnxMetabolites: [],
    metaboliteSearchQuery: null
  }),
  computed: {
    metaboliteItems() {
      return [
        ...this.customMetabolites,
        ...(this.model.model_serialized
          ? this.model.model_serialized.metabolites.map(metabolite => ({
              ...metabolite,
              model: true
            }))
          : []),
        ...this.mnxSearchResults,
        ...this.mnxMetabolites
      ];
    },
    compartmentItems() {
      return this.model.model_serialized
        ? Object.keys(this.model.model_serialized.compartments).map(id => ({
            id: id,
            name: this.model.model_serialized.compartments[id]
          }))
        : [];
    }
  },
  watch: {
    metaboliteSearchQuery(query) {
      if (query) {
        this.getMnxMetabolites(query);
      }
    }
  },
  methods: {
    metaboliteDisplay(metabolite) {
      return `${metabolite.name} (${getMetaboliteId(
        metabolite.id,
        metabolite.compartment
      )}${
        metabolite.model ? "[" + metabolite.compartment + "], in the model" : ""
      })`;
    },
    compartmentDisplay(compartment) {
      return `${compartment.name} (${compartment.id})`;
    },
    onMetaboliteChange(metabolite, value) {
      if (!value) {
        return;
      }
      if (value.compartment) {
        metabolite.compartment = value.compartment;
      } else {
        this.mnxMetabolites.push(value);
      }
    },
    passMetabolite(metabolite) {
      this.customMetabolites.push(metabolite);
      Vue.set(this.metabolite, "metabolite", {
        ...this.metabolite.metabolite,
        id: metabolite.id,
        name: metabolite.name
      });
    },
    getMnxMetabolites(query) {
      this.mnxSearchResults = [];
      if (query === null || query.trim().length === 0) {
        return;
      }
      axios
        .get(`${settings.apis.metanetx}/metabolites?query=${query}`)
        .then(response => {
          this.mnxSearchResults = response.data.map(metabolite => ({
            id: metabolite.mnx_id,
            name: metabolite.name,
            formula: metabolite.formula,
            annotation: metabolite.annotation
          }));
        })
        .catch(error => {
          this.mnxRequestError = true;
        });
    },
    stoichiometryRules: metabolite => {
      if (
        metabolite.metabolite &&
        !metabolite.stoichiometry &&
        metabolite.stoichiometry !== 0
      ) {
        return "Stoichiometry is required";
      }
      if (
        (metabolite.stoichiometry && metabolite.stoichiometry < 0) ||
        metabolite.stoichiometry === 0
      ) {
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
  }
});
</script>
