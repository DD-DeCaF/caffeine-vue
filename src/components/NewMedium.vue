<template>
  <div>
    <v-dialog
      v-model="isDialogVisible"
      v-analytics-model="{
        command: 'trackDialog',
        payload: { dialogName: 'new_medium' }
      }"
      width="650"
    >
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
                <v-alert :value="true" type="info">
                  Please note: Gases must be added as part of the medium. For
                  example, for aerobic conditions, please add oxygen explicitly.
                </v-alert>
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
                          <v-number-field
                            v-model.number="compound.mass_concentration"
                            name="mass"
                            label="Mass Concentration"
                            hint="mmol l <sup>-1</sup>"
                            persistent-hint
                            step="any"
                            class="mx-2"
                          ></v-number-field>
                        </v-flex>

                        <v-flex xs8>
                          <AutocompleteMnxMetabolite
                            label="Compound"
                            hint="Searches the entire <a-extended href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a-extended> database for known compounds."
                            @change="
                              compound.name = $event.name;
                              compound.id = $event.id;
                              compound.namespace = $event.namespace;
                            "
                            :modelIds="modelIds"
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
import { Prop } from "vue/types/options";
import * as settings from "@/utils/settings";
import { MediumItem } from "@/store/modules/media";

export default Vue.extend({
  name: "NewMedium",
  props: {
    value: {
      type: Boolean,
      required: true
    },
    modelIds: Array as Prop<Array<string>>
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
        .then(() => {
          // Refetch compounds from the warehouse in order to get updated state.
          // We could update the store locally and make sure to add the returned
          // IDs when POSTing the compounds - this is slightly slower for the
          // user but a lot less complex to implement.
          return this.$store.dispatch("media/fetchMediaCompounds");
        })
        .catch(error => {
          this.$store.commit("setPostError", error);
        })
        .then(() => (this.isLoading = false));
    },
    postCompounds(mediumId) {
      return this.compounds
        .filter(({ id }) => id)
        .map(compound => {
          const payload = {
            compound_identifier: compound.id,
            compound_name: compound.name,
            compound_namespace: compound.namespace,
            mass_concentration: compound.mass_concentration || null,
            medium_id: mediumId
          };
          this.$store.commit("media/addCompound", payload);
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
