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
                  v-model="mapName"
                  :rules="[rules.required]"
                  name="name"
                  label="Name"
                  type="text"
                  placeholder="e.g. My Favourite Map"
                ></v-text-field>
                <v-autocomplete
                  required
                  return-object
                  item-text="name"
                  item-value="id"
                  v-model="project"
                  :items="availableProjects"
                  :rules="[rules.required]"
                  name="project"
                  label="Project"
                  type="text"
                >
                  <template v-slot:append-item>
                    <v-divider class="my-2"></v-divider>
                    <!-- Work out why clicking on the project creation dialog will close it. How do I mimik the behaviour of the old platform here? -->
                    <v-btn
                      depressed
                      @click="$store.commit('toggleDialog', 'project')"
                    >
                      <v-icon class="mr-4">add_circle</v-icon>
                      New project
                    </v-btn>
                  </template>
                </v-autocomplete>
                <v-autocomplete
                  required
                  return-object
                  item-text="name"
                  item-value="id"
                  v-model="model"
                  :items="availableModels"
                  :rules="[rules.required]"
                  persistent-hint
                  name="map"
                  label="Model"
                  type="text"
                >
                  <template v-slot:append-item>
                    <v-divider class="my-2"></v-divider>
                    <v-btn
                      depressed
                      @click="$store.commit('toggleDialog', 'model')"
                    >
                      <v-icon class="mr-4">add_circle</v-icon>
                      New Model
                    </v-btn>
                  </template>
                </v-autocomplete>
                <FileUpload
                  v-model="filename"
                  @formData="loadFile"
                  :accept="'.json'"
                  :label="'Upload JSON map'"
                  :required="true"
                  :rules="[rules.required]"
                />
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
    <v-snackbar color="success" v-model="isMapCreationSuccess" :timeout="3000">
      {{ mapName }} successfully created.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";

export default Vue.extend({
  name: "NewMap",
  props: ["isMapCreationDialogVisible"],
  data: () => ({
    filename: null,
    valid: true,
    isMapCreationSuccess: false,
    rules: {
      required: value => !!value || "Required."
    },
    mapName: null,
    model: { id: null },
    project: { id: null },
    map: null
  }),
  methods: {
    createMap() {
      this.$store.commit("toggleDialog", "loader");
      const payload = {
        name: this.mapName,
        model_id: this.model.id,
        project_id: this.project.id,
        map: this.map
      };
      console.log("Creating a map", payload);
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
    // A great tutorial for the inner workings of the following function can be found at
    // https://alligator.io/vuejs/file-reader-component/
    loadFile($event): void {
      // FileUpload emits an event which contains a FormData object, which itself contains
      // a list of Files. Since FileUpload is limited to accepting only a single
      // file we only concern ourselves with the first element of that list.
      const file = $event[0].get("data");
      // Create a new instance of FileReader
      const fileReader = new FileReader();
      // Is called when the readAsText operation below successfully completes
      fileReader.onload = () => {
        this.map = JSON.parse(fileReader.result as string);
      };
      if (file) {
        // Read the file asynchroniously.
        // When it completes sucessfully the onload event defined above can access the data.
        fileReader.readAsText(file);
      }
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
