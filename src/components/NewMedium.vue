<template>
  <div>
    <v-dialog v-model="isDialogVisible" width="650">
      <NewProject
        v-model="isProjectCreationDialogVisible"
        @return-object="passProject"
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
            <v-container text-md-left>
              <v-layout fill-height column wrap>
                <v-flex md6>
                  <h3>Add a new medium</h3>
                </v-flex>
                <v-flex>
                  <v-text-field
                    v-model="medium.name"
                    :rules="[rules.required]"
                    name="name"
                    label="Name"
                    type="text"
                  ></v-text-field>

                  <v-autocomplete-extended
                    item-text="name"
                    item-value="id"
                    v-model="medium.project_id"
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
                          New Project
                        </v-list-tile-title>
                      </v-list-tile>
                      <v-divider class="my-2"></v-divider>
                    </template>
                  </v-autocomplete-extended>

                  <div class="body-2 mb-2">
                    Compounds:
                  </div>
                  <v-layout column mx-3>
                    <div v-for="(compound, index) in compounds" :key="index">
                      <v-layout>
                        <v-flex xs3>
                          <v-text-field
                            v-model.number="compound.mass_concentration"
                            :rules="[
                              rules.conditionallyRequired(
                                compound.mass_concentration,
                                !!compound.id
                              )
                            ]"
                            name="mass"
                            label="Mass Concentration"
                            placeholder=" "
                            suffix="mmol/l"
                            type="number"
                            step="any"
                            class="mx-2"
                          ></v-text-field>
                        </v-flex>

                        <v-flex xs8>
                          <AutocompleteMnxMetabolite
                            hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known metabolites."
                            @change="
                              compound.name = $event.name;
                              compound.id = $event.mnx_id;
                            "
                          ></AutocompleteMnxMetabolite>
                        </v-flex>

                        <v-flex xs2>
                          <v-layout>
                            <v-btn icon @click="compounds.push({})">
                              <v-icon color="primary">add_circle</v-icon>
                            </v-btn>
                            <v-btn
                              icon
                              v-if="compounds.length > 1"
                              @click="compounds.splice(index, 1)"
                            >
                              <v-icon color="primary">delete</v-icon>
                            </v-btn>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                    </div>
                  </v-layout>
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
              @click="createMedium"
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
      v-model="isMediumCreationSuccess"
      :timeout="3000"
    >
      {{ medium.name }} successfully created.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import { MediumItem } from "@/store/modules/media";

export default Vue.extend({
  name: "NewMedium",
  props: {
    value: {
      type: Boolean,
      required: true
    }
  },
  data: () => ({
    medium: {
      name: null,
      project_id: null
    },
    compounds: [{}],

    isValid: true,
    isProjectCreationDialogVisible: false,
    isMediumCreationSuccess: false,
    isLoading: false,
    rules: {
      required: value => !!value || "Required.",
      conditionallyRequired: (value, condition) => {
        if (condition) {
          return !!value || "Required.";
        } else {
          return true;
        }
      }
    }
  }),
  computed: {
    availableProjects() {
      return this.$store.state.projects.projects;
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
    createMedium() {
      this.isLoading = true;
      axios
        .post(`${settings.apis.warehouse}/media`, this.medium)
        .then((response: AxiosResponse) => {
          this.medium.id = response.data.id;
          return Promise.all(this.postCompounds(this.medium.id));
        })
        .then(() => {
          this.$store.commit("media/addMedium", this.medium);
          this.$emit("return-object", this.medium);
          this.isMediumCreationSuccess = true;
          this.isDialogVisible = false;
        })
        .catch(error => {
          this.$store.commit("setPostError", error);
        })
        .finally(() => (this.isLoading = false));
    },
    postCompounds(mediumId) {
      return this.compounds
        .filter(({ id }) => id)
        .map(compound => {
          const payload = {
            compound_identifier: compound.id,
            compound_name: compound.name,
            compound_namespace: "metanetx.chemical",
            mass_concentration: compound.mass_concentration,
            medium_id: mediumId
          };
          return axios.post(
            `${settings.apis.warehouse}/media/compounds`,
            payload
          );
        });
    },
    passProject(project) {
      this.medium.project_id = project.id;
    }
  }
});
</script>
