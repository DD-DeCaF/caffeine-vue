<template>
  <div>
    <v-btn
      color="secondary"
      @click.native.stop="isModelCreationDialogVisible = true"
    >
    <v-icon>add</v-icon>
    New model
    </v-btn>
    <v-dialog v-model="isModelCreationDialogVisible" width="650">
      <v-card class="pa-2">
        <div class="text-xs-center pa-4" v-if="isLoading">
          <v-progress-circular
            indeterminate
            color="primary"
            size="80"
          ></v-progress-circular>
        </div>
        <v-container grid-list-lg text-md-left v-if="!isLoading">
          <v-layout fill-height column wrap>
            <v-flex md6>
              <h3>Add a new model</h3>
              <p>We recommend that you visit <a href="https://memote.io" target="_blank">memote.io</a> to validate your model.</p>
            </v-flex>
            <v-flex>
              <v-form
                ref="form"
                v-model="valid"
                @keyup.native.enter="createModel"
              >
                <v-text-field
                  required
                  v-model="modelName.value"
                  :rules="modelName.rules"
                  name="name"
                  label="Name"
                  type="text"
                  placeholder="e.g. My Favourite Model"
                ></v-text-field>
                <v-select
                  return-object
                  required
                  item-text="name"
                  v-model="organismItemValidation.projectItem"
                  :items="availableOrganisms"
                  :rules="organismItemValidation.rules"
                  name="organism"
                  label="Organism"
                  type="text"
                >
                  <template v-slot:append-item>
                  <v-divider class="my-2"></v-divider>
                  <!-- Work out why clicking on the organism creation dialog will close it. How do I mimik the behaviour of the old platform here? -->
                  <NewOrganism />
                </template>
                </v-select>
                <v-select
                  return-object
                  required
                  item-text="name"
                  v-model="projectItemValidation.projectItem"
                  :items="availableProjects"
                  :rules="projectItemValidation.rules"
                  name="project"
                  label="Project"
                  type="text"
                >
                  <template v-slot:append-item>
                  <v-divider class="my-2"></v-divider>
                  <!-- Work out why clicking on the project creation dialog will close it. How do I mimik the behaviour of the old platform here? -->
                  <NewProject />
                </template>
                </v-select>
                <v-select
                  return-object
                  item-text="name"
                  v-model="mapItem"
                  :items="availableMaps"
                  hint="The default map displayed on the Interactive Map, optional"
                  persistent-hint
                  name="map"
                  label="Preferred Map"
                  type="text"
                >
                  <template v-slot:append-item>
                  <v-divider class="my-2"></v-divider>
                  <!-- Work out why clicking on the project creation dialog will close it. How do I mimik the behaviour of the old platform here? -->
                  <NewProject />
                </template>
                </v-select>
                <v-autocomplete
                  return-object
                  required
                  item-text="name"
                  v-model="reactionIdentifier"
                  :items="availableReactions"
                  hint="The reaction identifier of this model's default biomass reaction"
                  persistent-hint
                  name="map"
                  label="Default Biomass Reaction"
                  type="text"
                >
                </v-autocomplete>
              </v-form>
            </v-flex>
          </v-layout>
        </v-container>

        <v-divider class="my-2"></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="secondary"
            flat
            @click="isModelCreationDialogVisible = false"
            :disabled="isLoading"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="createModel"
            :disabled="isLoading || !valid"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar
      color="success"
      v-model="isModelCreationSuccess"
      bottom
      :timeout="3000"
    >
      {{ modelName.value }} successfully created.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";

export default Vue.extend({
  name: "NewModel",
  data: () => ({
    valid: true,
    isLoading: false,
    isModelCreationDialogVisible: false,
    isModelCreationSuccess: false,
    reactionIdentifier: {
      value: null,
      // Should be checked that it is indeed in the model.
      rules: [(v: string) => !!v || "A name is required."]
    },
    modelName: {
      value: null,
      rules: [(v: string) => !!v || "A name is required."]
    },
    organismItemValidation: {
      organismItem: {
        name: null,
        id: null
      },
      // Add ID validation here, check if it exists in the list of all projects
      rules: [(v: object) => !!v || "An organism is required."]
    },
    projectItemValidation: {
      projectItem: {
        name: null,
        id: null
      },
      // Add ID validation here, check if it exists in the list of all projects
      rules: [(v: object) => !!v || "A project is required."]
    },
    mapItem: null
  }),
  methods: {
    createModel() {
      this.isLoading = true;
      const payload = { 
        name: this.modelName.value,
        organism_id: this.organismItemValidation.organismItem.id,
        project_id: this.projectItemValidation.projectItem.id,
        }
      axios
        .post(`${settings.apis.modelStorage}/models`, payload)
        .then((response: AxiosResponse) => {
          this.$store.commit("models/addModel", response.data);
          this.isModelCreationDialogVisible = false;
          this.isModelCreationSuccess = true;
        })
        .catch(error => {
          this.$store.commit("setPostError", error);
        })
        .then(() => {
          this.isLoading = false;
        });
    }
  },
  computed: {
    availableProjects() {
      return this.$store.state.projects.projects
    },
    availableOrganisms() {
      return this.$store.state.organisms.organisms
    },
    availableMaps() {
      return this.$store.state.maps.maps
    },
    availableReactions() {
      return ["Biomass1", "Biomass2"]
    }
  },
  watch: {
    // Reset the model creation form when the creation dialog is closed.
    isModelCreationDialogVisible() {
      this.$refs.form.reset();
    }
  }
});
</script>
