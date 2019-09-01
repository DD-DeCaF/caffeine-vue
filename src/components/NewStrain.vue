<template>
  <div>
    <v-dialog v-model="isDialogVisible" width="650">
      <NewProject
        v-model="isProjectCreationDialogVisible"
        @return-object="passProject"
      />
      <NewOrganism
        v-model="isOrganismCreationDialogVisible"
        @return-object="passOrganism"
      />
      <v-form ref="form" v-model="isValid" @submit.prevent="">
        <v-card class="pa-2">
          <div class="text-xs-center pa-4" v-if="isLoading">
            <v-progress-circular
              indeterminate
              color="primary"
              size="50"
            ></v-progress-circular>
          </div>
          <div v-if="!isLoading">
            <v-container grid-list-lg text-md-left>
              <v-layout fill-height column wrap>
                <v-flex md6>
                  <h3>Add a new strain</h3>
                </v-flex>
                <v-flex>
                  <v-text-field
                    v-model="strain.name"
                    :rules="[rules.required]"
                    name="name"
                    label="Name"
                    type="text"
                  ></v-text-field>
                  <v-autocomplete-extended
                    item-text="name"
                    item-value="id"
                    v-model="strain.parent_id"
                    :items="availableStrains"
                    name="parentStrain"
                    label="Parent strain"
                    type="text"
                  >
                  </v-autocomplete-extended>
                  <v-text-field
                    v-model="strain.genotype"
                    name="genotype"
                    label="Genotype"
                    type="text"
                  ></v-text-field>
                  <v-autocomplete-extended
                    item-text="name"
                    item-value="id"
                    v-model="strain.organism_id"
                    :items="availableOrganisms"
                    :rules="[rules.required]"
                    name="organism"
                    label="Organism"
                    type="text"
                    ref="organismAutocomplete"
                  >
                    <template v-slot:prepend-item>
                      <v-list-tile
                        ripple
                        @click="
                          isOrganismCreationDialogVisible = true;
                          $refs.organismAutocomplete.isMenuActive = false;
                        "
                      >
                        <v-icon class="mr-3" color="primary">add_circle</v-icon>
                        <v-list-tile-title>
                          New Organism
                        </v-list-tile-title>
                      </v-list-tile>
                      <v-divider class="my-2"></v-divider>
                    </template>
                  </v-autocomplete-extended>
                  <v-autocomplete-extended
                    item-text="name"
                    item-value="id"
                    v-model="strain.project_id"
                    :items="availableProjects"
                    :rules="[rules.required]"
                    name="project"
                    label="Project"
                    type="text"
                    ref="projectAutocomplete"
                  >
                    <template v-slot:prepend-item>
                      <v-list-tile
                        ripple
                        @click="
                          isProjectCreationDialogVisible = true;
                          $refs.projectAutocomplete.isMenuActive = false;
                        "
                      >
                        <v-icon class="mr-3" color="primary">add_circle</v-icon>
                        <v-list-tile-title>
                          New project
                        </v-list-tile-title>
                      </v-list-tile>
                      <v-divider class="my-2"></v-divider>
                    </template>
                  </v-autocomplete-extended>
                </v-flex>
              </v-layout>
            </v-container>
          </div>

          <v-divider class="my-2"></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="secondary"
              flat
              @click="isDialogVisible = false"
              :disabled="isLoading"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              type="submit"
              @click="createStrain"
              :disabled="!isValid || isLoading"
            >
              Create
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
    <v-snackbar
      color="success"
      v-model="isStrainCreationSuccess"
      :timeout="3000"
    >
      {{ strain.name }} successfully created.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";

export default Vue.extend({
  name: "NewStrain",
  props: {
    value: {
      type: Boolean,
      required: true
    }
  },
  data: () => ({
    isValid: true,
    isProjectCreationDialogVisible: false,
    isOrganismCreationDialogVisible: false,
    isStrainCreationSuccess: false,
    isLoading: false,
    strain: {
      name: null,
      parent_id: null,
      genotype: "",
      organism_id: null,
      project_id: null
    },
    rules: {
      required: value => !!value || "Required."
    }
  }),
  computed: {
    availableStrains() {
      return this.$store.state.strains.strains;
    },
    availableProjects() {
      return this.$store.state.projects.projects;
    },
    availableOrganisms() {
      return this.$store.state.organisms.organisms;
    },
    isDialogVisible: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("input", value);
      }
    }
  },
  methods: {
    createStrain() {
      this.isLoading = true;
      axios
        .post(`${settings.apis.warehouse}/strains`, this.strain)
        .then((response: AxiosResponse) => {
          const strainWithId = { ...this.strain, ...response.data };
          console.log({ strainWithId });
          this.$store.commit("strains/addStrain", strainWithId);
          this.$emit("return-object", strainWithId);
          this.isStrainCreationSuccess = true;
          this.isDialogVisible = false;
        })
        .catch(error => {
          this.$store.commit("setPostError", error);
        })
        .then(() => (this.isLoading = false));
    },
    passOrganism(organism) {
      this.organism = organism;
    },
    passProject(project) {
      this.project = project;
    }
  }
});
</script>
