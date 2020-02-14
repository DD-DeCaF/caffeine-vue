<template>
  <v-container>
    <DeletionDialog
      v-model="isDeletionDialogVisible"
      :items="[mediumItem]"
      itemsType="media"
      @toggleLoader="toggleLoader()"
    />
    <NewProject
      v-model="isProjectCreationDialogVisible"
      @return-object="passProject"
    />
    <NewMedium v-model="isMediumCreationDialogVisible" />
    <v-layout justify-center>
      <v-flex md6>
        <h1 class="mb-2">Media</h1>
        <v-data-table
          :headers="headers"
          :items="availableMedia"
          class="elevation-8"
          :loading="isLoading || isDeleting"
          :pagination.sync="pagination"
        >
          <template v-slot:items="{ item: medium }">
            <td>{{ medium.name }}</td>
            <td>
              <v-tooltip
                bottom
                :disabled="isAuthenticated && medium.project_id !== null"
              >
                <div v-if="!isAuthenticated">
                  <span>
                    {{ $store.state.commonTooltipMessages.unauthenticated }}
                  </span>
                </div>
                <div v-else-if="medium.project_id === null">
                  <span>
                    {{ $store.state.commonTooltipMessages.publicData }}
                  </span>
                </div>
                <v-icon
                  slot="activator"
                  @click="editItem(medium)"
                  :disabled="!isAuthenticated || medium.project_id === null"
                  :class="{
                    pointerDisabled:
                      !isAuthenticated || medium.project_id === null
                  }"
                >
                  edit
                </v-icon>
              </v-tooltip>
              <v-tooltip
                bottom
                :disabled="isAuthenticated && medium.project_id !== null"
              >
                <div v-if="!isAuthenticated">
                  <span>
                    {{ $store.state.commonTooltipMessages.unauthenticated }}
                  </span>
                </div>
                <div v-else-if="medium.project_id === null">
                  <span>
                    {{ $store.state.commonTooltipMessages.publicData }}
                  </span>
                </div>
                <v-icon
                  slot="activator"
                  @click="deleteItem(medium)"
                  :disabled="!isAuthenticated || medium.project_id === null"
                  :class="{
                    pointerDisabled:
                      !isAuthenticated || medium.project_id === null
                  }"
                >
                  delete
                </v-icon>
              </v-tooltip>
            </td>
          </template>
        </v-data-table>
        <v-tooltip bottom :disabled="isAuthenticated">
          <span>
            {{ $store.state.commonTooltipMessages.unauthenticated }}
          </span>
          <v-btn
            slot="activator"
            fixed
            fab
            bottom
            right
            :disabled="!isAuthenticated"
            @click="isMediumCreationDialogVisible = true"
            color="primary"
            v-bind:style="styleObject"
          >
            <v-icon>add</v-icon>
          </v-btn>
        </v-tooltip>
      </v-flex>
    </v-layout>
    <!-- Definition of the edit dialog -->
    <v-dialog v-model="isMediumEditDialogVisible" width="650">
      <v-card class="pa-2">
        <v-container grid-list-lg text-md-left>
          <v-layout fill-height column wrap>
            <v-flex md6>
              <h3>Edit {{ name }}</h3>
            </v-flex>
            <v-flex>
              <v-form
                ref="form"
                v-model="isValid"
                @keyup.native.enter="onEnter"
              >
                <v-text-field
                  required
                  v-model="name"
                  :rules="[rules.required]"
                  name="name"
                  label="Name"
                  type="text"
                  placeholder="e.g. My Favourite Medium"
                ></v-text-field>
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
              </v-form>
              <div class="body-2 mb-2">
                Compounds:
              </div>
              <v-layout column mx-3>
                <div
                  v-for="(compound, index) in filteredCompounds"
                  :key="index"
                >
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
                        hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known compounds."
                        @change="
                          compound.compound_name = $event.name;
                          compound.compound_identifier =
                            $event.annotation['bigg.metabolite'][0] ||
                            $event.id;
                          compound.compound_namespace = $event.namespace;
                        "
                        :modelIds="modelIds"
                        :passedMetabolite="
                          convertToMetaNetXMetabolite(compound)
                        "
                      ></AutocompleteMnxMetabolite>
                    </v-flex>

                    <v-flex xs2>
                      <v-layout>
                        <v-btn icon @click="filteredCompounds.push({})">
                          <v-icon color="primary">add_circle</v-icon>
                        </v-btn>
                        <v-btn icon @click="filteredCompounds.splice(index, 1)">
                          <v-icon color="primary">delete</v-icon>
                        </v-btn>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                </div>
                <!-- If it's an empty medium, explicitly show a button to add compounds -->
                <v-btn
                  v-if="filteredCompounds.length === 0"
                  icon
                  @click="filteredCompounds.push({})"
                >
                  <v-icon color="primary">add_circle</v-icon>
                </v-btn>
              </v-layout>
            </v-flex>
          </v-layout>
        </v-container>

        <v-divider class="my-2"></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="secondary"
            flat
            @click.stop="isMediumEditDialogVisible = false"
            :disabled="$store.state.isDialogVisible.loader"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="editMedium"
            :disabled="$store.state.isDialogVisible.loader || !isValid"
          >
            Edit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Definition of notifications and banners -->
    <v-snackbar
      color="success"
      v-model="isMediumEditSuccess"
      bottom
      :timeout="3000"
    >
      {{ name }} successfully edited.
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop } from "vue/types/options";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import {
  MetaNetXMetabolite,
  Annotation
} from "../components/AutocompleteMnxMetabolite.vue";

export default Vue.extend({
  name: "Media",
  props: {
    modelIds: Array as Prop<Array<string>>
  },
  data: () => ({
    isValid: false,
    isDeleting: false,
    isLoading: true,
    isMediumCreationDialogVisible: false,
    isProjectCreationDialogVisible: false,
    isMediumEditSuccess: false,
    isInvalidCredentials: false,
    isUnauthorized: false,
    isNotFound: false,
    hasOtherError: false,
    name: null,
    project: null,
    id: null,
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
    mediumItem: { name: null },
    mediumItemIndex: null,
    isMediumEditDialogVisible: false,
    isDeletionDialogVisible: false,
    filteredCompounds: [],
    existingCompoundsInCurrentMedium: [],
    headers: [
      { text: "Name", align: "left", value: "name", width: "45%" },
      { text: "Actions", value: "name", sortable: false, width: "15%" }
    ],
    pagination: {
      rowsPerPage: 10
    },
    // Vuitify disables all pointer events on disabled objects.
    // https://stackoverflow.com/questions/51826891/how-do-i-enable-tooltips-on-a-disabled-text-field-in-vuetify
    // This style object is what we use to re-enable them so that the tooltip can be triggered on a disabled button.
    styleObject: {
      "pointer-events": "auto"
    },
    pointerDisabled: {
      "pointer-events": "none"
    }
  }),
  computed: {
    isAuthenticated() {
      return this.$store.state.session.isAuthenticated;
    },
    availableMedia() {
      return this.$store.state.media.media;
    },
    availableCompounds() {
      return this.$store.state.media.compounds;
    },
    availableProjects() {
      return this.$store.state.projects.projects;
    }
  },
  created() {
    this.$store.state.media.mediaPromise.then(() => {
      this.$store.state.media.compoundsPromise.then(() => {
        this.isLoading = false;
      });
    });
  },
  methods: {
    onEnter() {
      if (this.$refs.form.validate()) {
        this.editMedium();
      }
    },
    editItem(item) {
      this.id = item.id;
      this.name = item.name;
      this.project = this.availableProjects.find(
        obj => obj.id == item.project_id
      );
      this.mediumItemIndex = this.availableMedia.indexOf(item);
      this.isMediumEditDialogVisible = true;
      // Note: Use Object.assign in order to copy the compound elements from the
      // store. Without this, modifying the object would incorrectly modify the
      // store as well for the shared object reference.
      this.existingCompoundsInCurrentMedium = this.availableCompounds
        .filter(element => element.medium_id === this.id)
        .map(compound => Object.assign({}, compound));
      this.filteredCompounds = this.existingCompoundsInCurrentMedium.map(
        compound => Object.assign({}, compound)
      );
    },
    deleteItem(item) {
      this.mediumItem = item;
      this.isDeletionDialogVisible = true;
    },
    editMedium() {
      const payload_medium = {
        id: this.id,
        name: this.name,
        project_id: this.project.id
      };
      axios
        .put(`${settings.apis.warehouse}/media/${this.id}`, payload_medium)
        .then((response: AxiosResponse) => {
          this.$store.commit("toggleDialog", "loader");
          const commitPayload = {
            item: payload_medium,
            index: this.mediumItemIndex
          };
          this.$store.commit("media/editMedium", commitPayload);

          // To update compounds, first delete all existing ones
          return Promise.all(
            this.existingCompoundsInCurrentMedium.map(compound =>
              axios.delete(
                `${settings.apis.warehouse}/media/compounds/${compound.id}`
              )
            )
          );
        })
        .then(() => {
          // Now create the new compounds
          return Promise.all(
            this.filteredCompounds
              // Ignore empty rows
              .filter(compound => compound.compound_identifier)
              .map(compound => {
                return axios.post(
                  `${settings.apis.warehouse}/media/compounds`,
                  {
                    medium_id: this.id,
                    mass_concentration: compound.mass_concentration || null,
                    compound_identifier: compound.compound_identifier,
                    compound_name: compound.compound_name,
                    compound_namespace: compound.compound_namespace
                  }
                );
              })
          );
        })
        .then(() => {
          // Refetch compounds from the warehouse in order to get updated state.
          // We could update the store locally and make sure to add the returned
          // IDs when POSTing the compounds - this is slightly slower for the
          // user but a lot less complex to implement.
          return this.$store.dispatch("media/fetchMediaCompounds");
        })
        .catch(error => {
          if (error.response && error.response.status === 401) {
            this.isInvalidCredentials = true;
          } else if (error.response && error.response.status === 403) {
            this.isUnauthorized = true;
          } else if (error.response && error.response.status === 404) {
            this.isNotFound = true;
          } else {
            this.hasOtherError = true;
          }
        })
        .then(() => {
          this.isMediumEditSuccess = true;
          this.$store.commit("toggleDialog", "loader");
          this.isMediumEditDialogVisible = false;
        });
    },
    passProject(project) {
      this.project = project;
    },
    toggleLoader() {
      this.isDeleting = !this.isDeleting;
    },
    convertToMetaNetXMetabolite({
      compound_name,
      compound_identifier,
      compound_namespace
    }) {
      return {
        name: compound_name,
        id: compound_identifier,
        namespace: compound_namespace,
        formula: "Unavailable"
      };
    }
  }
});
</script>
