<template>
  <div>
    <v-dialog v-model="isVisible" width="650">
      <v-card class="pa-2">
        <v-container grid-list-lg text-md-left>
          <v-layout fill-height column wrap>
            <v-flex md6>
              <h3>Add a new map</h3>
            </v-flex>
            <v-flex>
              <v-form
                ref="form"
                v-model="valid"
                @keyup.native.enter="createMap"
              >
                <v-text-field
                  required
                  v-model="mapName.value"
                  :rules="mapName.rules"
                  name="name"
                  label="Name"
                  type="text"
                  placeholder="e.g. My Favourite Map"
                ></v-text-field>
                <v-autocomplete
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
                    <v-btn
                      color="secondary"
                      @click="$store.commit('toggleDialog', 'project')"
                    >
                      <v-icon>add</v-icon>
                      New project
                    </v-btn>
                  </template>
                </v-autocomplete>
                <v-autocomplete
                  required
                  return-object
                  item-text="name"
                  v-model="modelItem"
                  :items="availableModels"
                  persistent-hint
                  name="map"
                  label="Model"
                  type="text"
                >
                  <template v-slot:append-item>
                    <v-divider class="my-2"></v-divider>
                    <!-- Work out why clicking on the project creation dialog will close it. How do I mimik the behaviour of the old platform here? -->
                    <v-btn
                      color="secondary"
                      @click="$store.commit('toggleDialog', 'model')"
                    >
                      <v-icon>add</v-icon>
                      New Model
                    </v-btn>
                  </template>
                </v-autocomplete>
                <v-text-field
                  required
                  v-model="mapJSON.value"
                  :rules="mapJSON.rules"
                  name="name"
                  label="JSON Map"
                  type="file"
                  placeholder="e.g. My Favourite Map"
                  accept=".json"
                >
                </v-text-field>
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
            @click="isVisible = false"
            :disabled="$store.state.isDialogVisible.loader"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="createMap"
            :disabled="$store.state.isDialogVisible.loader || !valid"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar
      color="success"
      v-model="isMapCreationSuccess"
      bottom
      :timeout="3000"
    >
      {{ mapName.value }} successfully created.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/settings";

export default Vue.extend({
  name: "NewMap",
  props: ["isMapCreationDialogVisible"],
  data: () => ({
    valid: true,
    isMapCreationSuccess: false,
    mapName: {
      value: null,
      rules: [(v: string) => !!v || "A name is required."]
    },
    projectItemValidation: {
      projectItem: {
        name: null,
        id: null
      },
      // Add ID validation here, check if it exists in the list of all projects
      rules: [(v: object) => !!v || "A project is required."]
    },
    mapJSON: {
      value: null,
      // Add ID validation here, check if it exists in the list of all projects
      rules: [(v: object) => !!v || "A map JSON is required."]
    },
    modelItem: {
      value: null,
      rules: [(v: string) => !!v || "A model is required."]
    }
  }),
  methods: {
    createMap() {
      this.$store.commit("toggleDialog", "loader");
      const payload = {
        name: this.mapName.value,
        organism_id: this.organismItemValidation.organismItem.id,
        project_id: this.projectItemValidation.projectItem.id
      };
      axios
        .post(`${settings.apis.maps}/maps`, payload)
        .then((response: AxiosResponse) => {
          this.$store.commit("maps/addMap", response.data);
          this.isVisible = false;
          this.isMapCreationSuccess = true;
        })
        .catch(error => {
          this.$store.commit("setPostError", error);
        })
        .then(() => {
          this.$store.commit("toggleDialog", "loader");
        });
    },
    uploadFile() {
      console.log("This was uploaded.");
    }
  },
  computed: {
    availableProjects() {
      return this.$store.state.projects.projects;
    },
    availableModels() {
      return this.$store.state.models.models;
    },
    isVisible: {
      get: function() {
        return this.isMapCreationDialogVisible;
      },
      set: function(value) {
        this.$refs.form!.reset();
        this.$store.commit("toggleDialog", "map");
      }
    }
  },
  watch: {}
});
</script>
