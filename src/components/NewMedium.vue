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

                  <v-flex xs4>
                    <v-text-field
                      v-model.number="medium.ph"
                      :rules="[rules.required]"
                      name="ph"
                      label="pH"
                      type="number"
                    ></v-text-field>
                  </v-flex>

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
                      <v-btn
                        flat
                        @click.stop="
                          isProjectCreationDialogVisible = true;
                          $refs.projectAutocomplete.isMenuActive = false;
                        "
                        class="pl-0"
                      >
                        <v-icon class="mr-2" color="primary">add_circle</v-icon>
                        New project
                      </v-btn>
                      <v-divider class="my-2"></v-divider>
                    </template>
                  </v-autocomplete-extended>

                  <div class="body-2 mb-2">
                    Compounds:
                  </div>
                  <v-layout column mx-3>
                    <div
                      v-for="(compound, index) in medium.compounds"
                      :key="index"
                    >
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
                            type="number"
                            class="mx-2"
                          ></v-text-field>
                        </v-flex>

                        <v-flex xs8>
                          <v-autocomplete-extended
                            item-text="name"
                            item-value="id"
                            v-model="compound.id"
                            :items="availableCompounds"
                            clearable
                            name="compound"
                            label="Compound"
                            type="text"
                            class="mx-2"
                          ></v-autocomplete-extended>
                        </v-flex>

                        <v-flex xs2>
                          <v-layout>
                            <v-btn icon @click="medium.compounds.push({})">
                              <v-icon color="primary">add_circle</v-icon>
                            </v-btn>
                            <v-btn
                              icon
                              v-if="medium.compounds.length > 1"
                              @click="medium.compounds.splice(index, 1)"
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
      ph: null,
      project_id: null,
      compounds: [
        {
          id: null,
          mass_concentration: null
        }
      ]
    },

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
    },
    availableCompounds: []
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
  watch: {
    isDialogVisible() {
      this.getAvailableCompounds();
    }
  },
  mounted() {
    this.getAvailableCompounds();
  },
  methods: {
    getAvailableCompounds() {
      if (this.isDialogVisible) {
        this.isLoading = true;
        this.$store.dispatch("media/fetchCachedCompounds").then(compounds => {
          this.availableCompounds = compounds;
          this.isLoading = false;
        });
      }
    },
    createMedium() {
      this.isLoading = true;

      const payload = {
        ...this.medium,
        compounds: this.medium.compounds.filter(({ id }) => id)
      };
      axios
        .post(`${settings.apis.warehouse}/media`, payload)
        .then((response: AxiosResponse<MediumItem>) => {
          this.$store.commit("media/addMedium", response.data);
          this.$emit("return-object", response.data);
          this.isMediumCreationSuccess = true;
          this.isDialogVisible = false;
        })
        .catch(error => {
          this.$store.commit("setPostError", error);
        })
        .then(() => (this.isLoading = false));
    },
    passProject(project) {
      this.medium.project_id = project.id;
    }
  }
});
</script>
