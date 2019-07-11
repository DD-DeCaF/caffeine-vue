<template>
  <div>
    <NewProject
      v-model="isProjectCreationDialogVisible"
      @return-object="passProject"
    />
    <NewMap v-model="isMapCreationDialogVisible" @return-object="passMap" />
    <NewOrganism
      v-model="isOrganismCreationDialogVisible"
      @return-object="passOrganism"
    />
    <v-dialog v-model="isVisible" width="650">
      <v-card class="pa-2">
        <v-container grid-list-lg text-md-left>
          <v-layout fill-height column wrap>
            <v-flex md6>
              <h3>Add a new model</h3>
              <p>
                We recommend that you visit
                <a href="https://memote.io" target="_blank">memote.io</a> to
                validate your model.
              </p>
            </v-flex>
            <v-flex>
              <v-form
                ref="form"
                v-model="isValid"
                @keyup.native.enter="onEnter"
              >
                <v-text-field
                  required
                  v-model="modelName"
                  :rules="[rules.required]"
                  name="name"
                  label="Name"
                  type="text"
                  placeholder="e.g. My Favourite Model"
                ></v-text-field>
                <v-autocomplete-extended
                  required
                  return-object
                  item-text="name"
                  item-value="id"
                  v-model="organism"
                  :items="availableOrganisms"
                  :rules="[rules.required]"
                  name="organism"
                  label="Organism"
                  type="text"
                >
                  <template v-slot:prepend-item>
                    <v-btn
                      depressed
                      @click.stop="isOrganismCreationDialogVisible = true"
                    >
                      <v-icon class="mr-4">add_circle</v-icon>
                      New Organism
                    </v-btn>
                    <v-divider class="my-2"></v-divider>
                  </template>
                </v-autocomplete-extended>
                <v-autocomplete-extended
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
                </v-autocomplete-extended>
                <v-autocomplete-extended
                  return-object
                  item-text="name"
                  item-value="id"
                  v-model="map"
                  :items="availableMaps"
                  hint="The default map displayed on the Interactive Map, optional"
                  persistent-hint
                  name="map"
                  label="Preferred Map"
                  type="text"
                >
                  <template v-slot:prepend-item>
                    <v-btn
                      depressed
                      @click.stop="isMapCreationDialogVisible = true"
                    >
                      <v-icon class="mr-4">add_circle</v-icon>
                      New Map
                    </v-btn>
                    <v-divider class="my-2"></v-divider>
                  </template>
                </v-autocomplete-extended>
                <FileUpload
                  v-model="filename"
                  @formData="loadFile"
                  :accept="'.json'"
                  :label="'Upload JSON model'"
                  :required="true"
                  :rules="[rules.required]"
                  :error-messages="errorMessage"
                />
                <v-autocomplete-extended
                  required
                  item-text="id"
                  item-value="id"
                  v-model="default_biomass_reaction"
                  :items="reactions"
                  :rules="[rules.required]"
                  hint="The reaction identifier of this model's default biomass reaction"
                  persistent-hint
                  name="map"
                  label="Default Biomass Reaction"
                  type="text"
                >
                </v-autocomplete-extended>
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
            @click="createModel"
            :disabled="$store.state.isDialogVisible.loader || !isValid"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar
      color="success"
      v-model="isModelCreationSuccess"
      :timeout="3000"
    >
      {{ modelName }} successfully created.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import { partitionedList } from "../utils/utility";

export default Vue.extend({
  name: "NewModel",
  props: ["value"],
  data: () => ({
    filename: null,
    isValid: true,
    isProjectCreationDialogVisible: false,
    isMapCreationDialogVisible: false,
    isOrganismCreationDialogVisible: false,
    isModelCreationSuccess: false,
    rules: {
      required: value => !!value || "Required."
    },
    modelName: null,
    model_serialized: null,
    map: null,
    project: null,
    organism: null,
    default_biomass_reaction: null,
    modelError: false,
    reactions: []
  }),
  computed: {
    errorMessage() {
      if (this.modelError) {
        return "The file is not valid.";
      } else {
        return [];
      }
    },
    availableProjects() {
      return this.$store.state.projects.projects;
    },
    availableOrganisms() {
      return this.$store.state.organisms.organisms;
    },
    availableMaps() {
      return partitionedList("maps", "models");
    },
    availableReactions() {
      return [{ id: "Biomass1" }, { id: "Biomass2" }];
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
        this.createModel();
      }
    },
    createModel() {
      this.$store.commit("toggleDialog", "loader");
      const payload = {
        name: this.modelName,
        model_serialized: this.model_serialized,
        preferred_map_id: this.map ? this.map.id : null,
        project_id: this.project.id,
        organism_id: this.organism.id,
        default_biomass_reaction: this.default_biomass_reaction
      };
      axios
        .post(`${settings.apis.modelStorage}/models`, payload)
        .then((response: AxiosResponse) => {
          const modelWithID = { ...payload, ...response.data };
          this.$store.commit("models/addModel", modelWithID);
          this.$emit("return-object", modelWithID);
          this.isVisible = false;
          this.isModelCreationSuccess = true;
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
        this.model_serialized = JSON.parse(fileReader.result as string);
        if (this.model_serialized.reactions) {
          this.modelError = false;
          this.reactions = this.model_serialized.reactions.map(
            reaction => reaction.id
          );
        } else {
          this.modelError = true;
        }
      };
      if (file) {
        // Read the file asynchroniously.
        // When it completes sucessfully the onload event defined above can access the data.
        fileReader.readAsText(file);
      }
    },
    passProject(project) {
      this.project = project;
    },
    passMap(map) {
      this.map = map;
    },
    passOrganism(organism) {
      this.organism = organism;
    }
  }
});
</script>
