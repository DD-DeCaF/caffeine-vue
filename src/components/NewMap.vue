<template>
  <div>
    <NewProject
      v-model="isProjectCreationDialogVisible"
      @return-object="passProject"
    />
    <!--    <NewModel-->
    <!--      v-model="isProjectModelDialogVisible"-->
    <!--      @return-object="passModel"-->
    <!--    />-->
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
                v-model="isValid"
                @keyup.native.enter="onEnter"
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
                  <template v-slot:prepend-item>
                    <v-btn
                      depressed
                      @click.stop="isProjectCreationDialogVisible = true"
                    >
                      <v-icon class="mr-4">add_circle</v-icon>
                      New project
                    </v-btn>
                    <v-divider class="my-2"></v-divider>
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
                  <!--                  <template v-slot:prepend-item>-->
                  <!--                    <v-btn-->
                  <!--                      depressed-->
                  <!--                      @click.stop="isModelCreationDialogVisible = true"-->
                  <!--                    >-->
                  <!--                      <v-icon class="mr-4">add_circle</v-icon>-->
                  <!--                      New model-->
                  <!--                    </v-btn>-->
                  <!--                    <v-divider class="my-2"></v-divider>-->
                  <!--                  </template>-->
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
            :disabled="$store.state.isDialogVisible.loader || !isValid"
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
import * as settings from "@/utils/settings";

export default Vue.extend({
  name: "NewMap",
  props: ["value"],
  data: () => ({
    isProjectCreationDialogVisible: false,
    // isModelCreationDialogVisible: false,
    filename: null,
    isValid: true,
    isMapCreationSuccess: false,
    rules: {
      required: value => !!value || "Required."
    },
    mapName: null,
    model: { id: null },
    project: { id: null },
    map: null
  }),
  computed: {
    availableProjects() {
      return this.$store.state.projects.projects;
    },
    availableModels() {
      return this.$store.state.models.models;
    },
    isVisible: {
      get: function() {
        return this.value;
      },
      set: function(value) {
        this.$refs.form!.reset();
        this.$emit("input", value);
      }
    }
  },
  watch: {},
  methods: {
    onEnter() {
      if (this.$refs.form.validate()) {
        this.createMap()
      }
    },
    createMap() {
      this.$store.commit("toggleDialog", "loader");
      const payload = {
        name: this.mapName,
        model_id: this.model.id,
        project_id: this.project.id,
        map: this.map
      };
      axios
        .post(`${settings.apis.maps}/maps`, payload)
        .then((response: AxiosResponse) => {
          const mapWithID = { ...payload, ...response.data };
          this.$store.commit("maps/addMap", mapWithID);
          this.$emit("return-object", mapWithID);
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
    },
    passProject(project) {
      this.project = project;
    }
    // passModel(model) {
    //   this.model = model;
    // }
  }
});
</script>
