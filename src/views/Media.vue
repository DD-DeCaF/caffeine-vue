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
    <NewModel
      v-model="isModelCreationDialogVisible"
      @return-object="passModel"
    />
    <NewMap v-model="isMapCreationDialogVisible" />
    <v-layout justify-center>
      <v-flex md6>
        <h1 class="mb-2">Maps</h1>
        <v-data-table
          :headers="headers"
          :items="availableMaps"
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
                    pointerDisabled: !isAuthenticated || medium.project_id === null
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
                    pointerDisabled: !isAuthenticated || medium.project_id === null
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
                    <!-- Work out why clicking on the project creation dialog will close it. How do I mimik the behaviour of the old platform here? -->
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
                <v-autocomplete-extended
                  required
                  return-object
                  item-text="name"
                  item-value="id"
                  v-model="selectedModel"
                  :items="availableModels"
                  :rules="[rules.required]"
                  persistent-hint
                  name="model"
                  label="Model"
                  type="text"
                  ref="modelAutocomplete"
                >
                  <template v-slot:prepend-item>
                    <v-list-tile
                      ripple
                      @click="
                        isModelCreationDialogVisible = true;
                        $refs.modelAutocomplete.isMenuActive = false;
                      "
                    >
                      <v-icon class="mr-3">add_circle</v-icon>
                      <v-list-tile-title>
                        New Model
                      </v-list-tile-title>
                    </v-list-tile>
                    <v-divider class="my-2"></v-divider>
                  </template>
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
            @click.stop="isMapEditDialogVisible = false"
            :disabled="$store.state.isDialogVisible.loader"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="editMap"
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
      v-model="isMapEditSuccess"
      bottom
      :timeout="3000"
    >
      {{ name }} successfully edited.
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import { mapGetters } from "vuex";

export default Vue.extend({
  name: "Maps",
  data: () => ({
    isValid: false,
    isDeleting: false,
    isLoading: true,
    isMapCreationDialogVisible: false,
    isModelCreationDialogVisible: false,
    isProjectCreationDialogVisible: false,
    isMapEditSuccess: false,
    isInvalidCredentials: false,
    isUnauthorized: false,
    isNotFound: false,
    hasOtherError: false,
    selectedModel: null,
    name: null,
    project: null,
    rules: {
      required: value => !!value || "Required."
    },
    mediumItem: { name: null },
    mediumItemIndex: null,
    isMapEditDialogVisible: false,
    isDeletionDialogVisible: false,
    headers: [
      { text: "Name", align: "left", value: "name", width: "45%" },
      { text: "Model", value: "model_id", width: "40%" },
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
    ...mapGetters({
      getModel: "models/getModelById"
    }),
    availableProjects() {
      return this.$store.state.projects.projects;
    },
    availableModels() {
      return this.$store.state.models.models;
    }
  },
  created() {
    this.$store.state.media.mediaPromise.then(() => {
      this.isLoading = false;
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
      this.selectedModel = this.availableModels.find(
        obj => obj.id == item.model_id
      );
      this.mediumItemIndex = this.availableMaps.indexOf(item);
      this.isMapEditDialogVisible = true;
    },
    deleteItem(item) {
      this.mediumItem = item;
      this.isDeletionDialogVisible = true;
    },
    editMedium() {
      const payload = {
        id: this.id,
        name: this.name,
        project_id: this.project.id,
        model_id: this.selectedModel.id
      };
      axios
        .put(`${settings.apis.warehouse}/media/${this.id}`, payload)
        .then((response: AxiosResponse) => {
          this.$store.commit("toggleDialog", "loader");
          const commitPayload = {
            item: payload,
            index: this.mediumItemIndex
          };
          this.$store.commit("media/editMedium", commitPayload);
          this.isMapEditSuccess = true;
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
          this.$store.commit("toggleDialog", "loader");
          this.isMediumEditDialogVisible = false;
        });
    },
    passProject(project) {
      this.project = project;
    },
    passModel(model) {
      this.selectedModel = model;
    },
    toggleLoader() {
      this.isDeleting = !this.isDeleting;
    }
  }
});
</script>
