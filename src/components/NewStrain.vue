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
                <v-form
                  ref="form"
                  v-model="isValid"
                  @keyup.native.enter="onEnter"
                >
                  <v-text-field
                    v-model="strainName"
                    :rules="[rules.required]"
                    name="name"
                    label="Name"
                    type="text"
                  ></v-text-field>
                  <v-autocomplete
                    return-object
                    item-text="name"
                    item-value="id"
                    v-model="parentStrain"
                    :items="availableStrains"
                    name="parentStrain"
                    label="Parent strain"
                    type="text"
                  >
                  </v-autocomplete>
                  <v-text-field
                    v-model="genotype"
                    name="genotype"
                    label="Genotype"
                    type="text"
                  ></v-text-field>
                  <v-autocomplete-extended
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
                        flat
                        @click.stop="isOrganismCreationDialogVisible = true"
                        class="pl-0"
                      >
                        <v-icon class="mr-2" color="primary">add_circle</v-icon>
                        New Organism
                      </v-btn>
                      <v-divider class="my-2"></v-divider>
                    </template>
                  </v-autocomplete-extended>
                  <v-autocomplete-extended
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
                        flat
                        @click.stop="isProjectCreationDialogVisible = true"
                        class="pl-0"
                      >
                        <v-icon class="mr-2" color="primary">add_circle</v-icon>
                        New project
                      </v-btn>
                      <v-divider class="my-2"></v-divider>
                    </template>
                  </v-autocomplete-extended>
                </v-form>
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
            @click="createStrain"
            :disabled="!isValid || isLoading"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar
      color="success"
      v-model="isStrainCreationSuccess"
      :timeout="3000"
    >
      {{ strainName }} successfully created.
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
    strainName: null,
    parentStrain: null,
    genotype: "",
    organism: null,
    project: null,
    isLoading: false,
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
    onEnter() {
      if (this.$refs.form.validate()) {
        this.createStrain();
      }
    },
    createStrain() {
      this.isLoading = true;
      const payload = {
        name: this.strainName,
        parent_id: this.parentStrain ? this.parentStrain.id : null,
        genotype: this.genotype,
        project_id: this.project.id,
        organism_id: this.organism.id
      };
      axios
        .post(`${settings.apis.warehouse}/strains`, payload)
        .then((response: AxiosResponse) => {
          const strainWithID = { ...payload, ...response.data };
          this.$store.commit("strains/addStrain", strainWithID);
          this.$emit("return-object", strainWithID);
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
