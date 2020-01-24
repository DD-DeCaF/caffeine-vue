<template>
    <div class='interactive-map fill-height'>
    <v-container>
    <h1>Some test results go here</h1>
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
    </v-container>
    <v-navigation-drawer
    v-model="isSidepanelOpen"
    right
    absolute
    hide-overlay
    class="elevation-6"
    >
        <v-container class="py-1">
            <v-select
            :items='media'
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
                :rules="[v => v.length >= 2 || 'Please choose at least two metabolic models that you wish to simulate as a community.']"
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
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import * as settings from "@/utils/settings";
import { mapGetters } from "vuex";
import { partitionedList } from "@/utils/utility";

export default Vue.extend({
  name: "CommunityModeling",
  components: {
  },
  data: () => ({
    isUpdating: false,
    selectedModels:[],
    selectedMedium: null,
    isSidepanelOpen: true,
    hasSimulationError: false,
    communityData: null,
    media: [{'id':1, 'name':"M9 Glucose", 'componentIDs':["ca2", "cl", "co2", "cobalt2", "cu2", "fe2", "glc__D", "h2o", "h", "hco3", "k", "mg2", "mn2", "mobd", "na1", "nh4", "ni2", "o2", "pi", "sel", "so4", "tungs", "zn2"]}]
  }),
  computed: {
    isValid() {
        if (this.selectedModels.length >= 2 && this.selectedMedium !== null) {
        return true;
        } else { return false;}
    },
    models() {
    return partitionedList("models", "organisms");
    },
    availableModels() {
      return this.$store.state.models.models;
    },
    ...mapGetters({
      organism: "organisms/getOrganismById"
    })
  },
  mounted() {
  },
  methods: {
    simulateCommunity() {
        this.isUpdating = true;
        const payload = {
            medium: this.selectedMedium.componentIDs,
            model_ids: this.selectedModels
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
    remove (item) {
    const index = this.selectedModels.indexOf(item.id)
    if (index >= 0) { this.selectedModels.splice(index, 1) }
    }
  }
});
</script>

<style scoped>
.sidepanel-toggle {
  position: absolute;
}
</style>

