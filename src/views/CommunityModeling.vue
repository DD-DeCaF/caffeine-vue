<template>
  <v-container>
    <v-card>
      <v-card-title></v-card-title>
      <v-card-text>
        <v-btn
          color="primary"
          small
          fab
          top
          right
          class="sidepanel-toggle"
          @click="isSidepanelOpen = true"
        >
          <v-icon>apps</v-icon>
        </v-btn>
        <v-container @click="isSidepanelOpen = false" v-if="communityData">
          <!-- Community Growth Rate -->
          <h1>Community Modeling</h1>
          <h2>Community Growth Rate</h2>
          <p>{{ communityData.growth_rate }}</p>
          <!-- Abundance -->
          <h2>Abundance</h2>
          <v-data-table
            :headers="headersAbundance"
            :items="communityData.abundance"
            class="elevation-1 pa-2 my-3"
          >
            <template v-slot:items="props">
              <td>
                {{
                  getOrganismByID(getModelByID(props.item.id).organism_id).name
                }}
              </td>
              <td>{{ getModelByID(props.item.id).name }}</td>
              <td>{{ props.item.value }}</td>
            </template>
            <template v-slot:no-data>
              <v-alert :value="true" color="error" icon="warning">
                No data to display yet. Select a medium and at least two models,
                then click SIMULATE NOW.
              </v-alert>
            </template>
          </v-data-table>
          <!-- Cross-Feeding -->
          <h2>Cross-Feeding</h2>
          <v-layout row justify-space-between>
            <v-flex xs3>
              <v-autocomplete
                v-model="fromSearch"
                :items="communityData.cross_feeding"
                filled
                chips
                color="primary"
                label="Source organism"
                item-value="from"
                multiple
              >
                <template slot="item" slot-scope="data">
                  {{ getModelByID(data.item.to).name }}
                </template>
                <template v-slot:selection="data">
                  <v-chip
                    :selected="data.selected"
                    close
                    class="chip--select-multi"
                    @input="removeFromFilter(data.item)"
                  >
                    {{ getModelByID(data.item.from).name }}
                  </v-chip>
                </template>
              </v-autocomplete>
            </v-flex>
            <v-flex xs3>
              <v-autocomplete
                v-model="toSearch"
                :items="communityData.cross_feeding"
                filled
                chips
                color="primary"
                label="Target organism"
                item-value="to"
                multiple
              >
                <template slot="item" slot-scope="data">
                  {{ getModelByID(data.item.to).name }}
                </template>
                <template v-slot:selection="data">
                  <v-chip
                    :selected="data.selected"
                    close
                    class="chip--select-multi"
                    @input="removeToFilter(data.item)"
                  >
                    {{ getModelByID(data.item.to).name }}
                  </v-chip>
                </template>
              </v-autocomplete>
            </v-flex>
            <v-flex xs3>
              <v-autocomplete
                v-model="metaboliteSearch"
                :items="communityData.cross_feeding"
                filled
                chips
                color="primary"
                label="Search metabolite"
                item-value="metabolite"
                multiple
              >
                <template slot="item" slot-scope="data">
                  {{ data.item.metabolite }}
                </template>
                <template v-slot:selection="data">
                  <v-chip
                    :selected="data.selected"
                    close
                    class="chip--select-multi"
                    @input="removeMetaboliteFilter(data.item)"
                  >
                    {{ data.item.metabolite }}
                  </v-chip>
                </template>
              </v-autocomplete>
            </v-flex>
          </v-layout>
          <v-data-table
            :headers="headersCrossFeeding"
            :items="communityDataFiltered"
            class="elevation-1 pa-2 my-3"
          >
            <template v-slot:items="props">
              <td>{{ getModelByID(props.item.from).name }}</td>
              <td>{{ getModelByID(props.item.to).name }}</td>
              <td>{{ props.item.metabolite }}</td>
              <td>{{ props.item.value }}</td>
            </template>
            <template v-slot:no-data>
              <v-alert :value="true" color="error" icon="warning">
                Cross-feeding could not be calculated. This could be due to
                mismatching metabolite identifiers between the selected models.
              </v-alert>
            </template>
          </v-data-table>
        </v-container>
        <v-container @click="isSidepanelOpen = false" v-else>
          No data to display yet. Select a medium and at least two models, then
          click SIMULATE NOW.
        </v-container>
      </v-card-text>
    </v-card>
    <v-navigation-drawer
      v-model="isSidepanelOpen"
      right
      absolute
      hide-overlay
      class="elevation-6"
    >
      <v-container class="py-1">
        <v-select
          :items="media"
          :disabled="isUpdating"
          label="Selected Medium"
          autofocus
          item-text="name"
          item-value="id"
          v-model="selectedMedium"
          return-object
          :rules="[v => !!v || 'Please choose a medium.']"
        ></v-select>
        <v-autocomplete
          v-model="selectedModels"
          :disabled="isUpdating"
          :items="models"
          box
          chips
          label="Selected Models"
          item-text="name"
          item-value="id"
          multiple
          :rules="[
            v =>
              v.length >= 2 ||
              'Please choose at least two metabolic models that you wish to simulate as a community.'
          ]"
        >
          <template v-slot:selection="data">
            <v-chip
              :selected="data.selected"
              close
              class="chip--select-multi"
              @input="remove(data.item)"
            >
              {{ data.item.name }}
            </v-chip>
          </template>
        </v-autocomplete>

        <v-select
          :items="methods"
          :disabled="isUpdating"
          label="Simulation Method"
          item-text="name"
          item-value="id"
          :hint="selectedMethod.description"
          persistent-hint
          v-model="selectedMethod"
          return-object
          :rules="[v => !!v || 'Please choose the simulation method.']"
        ></v-select>

        <v-btn
          :loading="isUpdating"
          :disabled="isUpdating || !isValid"
          color="primary"
          depressed
          @click="simulateCommunity"
        >
          <v-icon left>update</v-icon>
          Simulate Now
        </v-btn>
      </v-container>
    </v-navigation-drawer>
    <v-snackbar color="error" v-model="hasSimulationError" :timeout="8000">
      Sorry, we were not able to complete the simulation successfully. Please
      try again in a few seconds, or contact us if the problem persists.
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import * as settings from "@/utils/settings";
import { mapGetters } from "vuex";
import { partitionedList } from "@/utils/utility";

export default Vue.extend({
  name: "CommunityModeling",
  components: {},
  data: () => ({
    metaboliteSearch: [],
    fromSearch: [],
    toSearch: [],
    isUpdating: false,
    selectedModels: [],
    selectedMedium: null,
    selectedMethod: null,
    isSidepanelOpen: true,
    hasSimulationError: false,
    communityData: null,
    headersAbundance: [
      { text: "Organism", value: "id" },
      { text: "Model", value: "id" },
      { text: "Abundance", value: "value" }
    ],
    headersCrossFeeding: [
      { text: "From", value: "from" },
      { text: "To", value: "to" },
      { text: "Metabolite", value: "metabolite" },
      { text: "Value", value: "value" }
    ],
    media: [
      {
        id: 1,
        name: "M9 Glucose",
        componentIDs: [
          "ca2",
          "cl",
          "co2",
          "cobalt2",
          "cu2",
          "fe2",
          "glc__D",
          "h2o",
          "h",
          "hco3",
          "k",
          "mg2",
          "mn2",
          "mobd",
          "na1",
          "nh4",
          "ni2",
          "o2",
          "pi",
          "sel",
          "so4",
          "tungs",
          "zn2"
        ]
      },
      {
        id: 2,
        name: "M9 Glucose, Fructose, Sucrose",
        componentIDs: [
          "ca2",
          "cl",
          "cobalt2",
          "cu2",
          "fe2",
          "fe3",
          "h",
          "h2o",
          "k",
          "mg2",
          "mn2",
          "mobd",
          "na1",
          "tungs",
          "zn2",
          "co2",
          "ni2",
          "sel",
          "slnt",
          "so4",
          "nh4",
          "pi",
          "cbl1",
          "nh4",
          "h2",
          "glc__D",
          "fru",
          "sucr",
          "ergst",
          "zymst",
          "hdcea",
          "ocdca",
          "ocdcea",
          "ocdcya"
        ]
      }
    ],
    methods: [
      {
        id: "steadycom",
        name: "SteadyCom",
        description: "Implementation of SteadyCom (Chan et al 2017)"
      },
      {
        id: "steadiercom",
        name: "SteadierCom",
        description: "Improvements on SteadyCom by Daniel Machado"
      }
    ]
  }),
  computed: {
    isValid() {
      if (this.selectedModels.length >= 2 && this.selectedMedium !== null) {
        return true;
      } else {
        return false;
      }
    },
    models() {
      return partitionedList("models", "organisms");
    },
    availableModels() {
      return this.$store.state.models.models;
    },
    ...mapGetters({
      getModelByID: "models/getModelById",
      getOrganismByID: "organisms/getOrganismById"
    }),
    communityDataFiltered() {
      return this.communityData.cross_feeding.filter(i => {
        return (
          (!this.metaboliteSearch.length &&
            !this.fromSearch.length &&
            !this.toSearch.length) ||
          (this.metaboliteSearch.length > 0 ===
            this.metaboliteSearch.includes(i.metabolite) &&
            this.fromSearch.length > 0 === this.fromSearch.includes(i.from) &&
            this.toSearch.length > 0 === this.toSearch.includes(i.to))
        );
      });
    }
  },
  created() {
    this.selectedMedium = this.media[0];
    this.selectedMethod = this.methods[0];
  },
  methods: {
    simulateCommunity() {
      this.isUpdating = true;
      const payload = {
        medium: this.selectedMedium.componentIDs,
        model_ids: this.selectedModels,
        method: this.selectedMethod.id
      };
      axios
        .post(`${settings.apis.simulations}/community/simulate`, payload)
        .then(response => {
          this.communityData = response.data;
          this.isUpdating = false;
        })
        .catch(error => {
          this.isUpdating = false;
          this.communityData = null;
          this.hasSimulationError = true;
        });
    },
    remove(item) {
      const index = this.selectedModels.indexOf(item.id);
      if (index >= 0) {
        this.selectedModels.splice(index, 1);
      }
    },
    removeMetaboliteFilter(item) {
      const index = this.metaboliteSearch.indexOf(item.metabolite);
      if (index >= 0) {
        this.metaboliteSearch.splice(index, 1);
      }
    },
    removeFromFilter(item) {
      const index = this.fromSearch.indexOf(item.from);
      if (index >= 0) {
        this.fromSearch.splice(index, 1);
      }
    },
    removeToFilter(item) {
      const index = this.toSearch.indexOf(item.to);
      if (index >= 0) {
        this.toSearch.splice(index, 1);
      }
    }
  }
});
</script>

<style scoped>
.sidepanel-toggle {
  position: absolute;
}
</style>
