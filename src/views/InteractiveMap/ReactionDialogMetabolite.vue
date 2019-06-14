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
      <v-autocomplete
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
      </v-autocomplete></v-flex
    >
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
  </v-layout>
</template>

<script lang="ts">
import Vue from "vue";
import MetaboliteDialog from "@/views/InteractiveMap/MetaboliteDialog.vue";
import * as settings from "@/utils/settings";
import axios from "axios";
export default Vue.extend({
  name: "ReactionDialog",
  components: {
    MetaboliteDialog
  },
  props: ["model", "customMetabolites", "metabolite", "index"],
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
        ...this.mnxSearchResults,
        ...this.mnxMetabolites,
        ...(this.model.model_serialized
          ? this.model.model_serialized.metabolites
          : [])
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
      return `${metabolite.name} (${this.getMetaboliteId(
        metabolite.id,
        metabolite.compartment
      )})`;
    },
    compartmentDisplay(compartment) {
      return `${compartment.name} (${compartment.id})`;
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
    onMetaboliteChange(metabolite, value) {
      if (!value) return;
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
