<template>
  <v-container>
    <DeletionDialog
      v-model="isDeletionDialogVisible"
      :items="[mapItem]"
      itemsType="maps"
    />
    <NewProject
      v-model="isProjectCreationDialogVisible"
      @returnObject="passProject"
    />
    <NewModel
      v-model="isModelCreationDialogVisible"
      @returnObject="passModel"
    />
    <NewMap v-model="isMapCreationDialogVisible" />
    <v-layout justify-center>
      <v-flex md6>
        <h1>Maps</h1>
        <v-data-table
          :headers="headers"
          :items="availableMaps"
          class="elevation-8"
          :pagination.sync="pagination"
        >
          <template v-slot:items="props">
            <td>{{ props.item.name }}</td>
            <td>{{ getModel(props.item.model_id).name }}</td>
            <td>
              <v-tooltip
                bottom
                :disabled="isAuthenticated && props.item.project_id !== null"
              >
                <div v-if="!isAuthenticated">
                  <span>
                    {{ $store.state.commonTooltipMessages.unauthenticated }}
                  </span>
                </div>
                <div v-else-if="props.item.project_id === null">
                  <span>
                    {{ $store.state.commonTooltipMessages.publicData }}
                  </span>
                </div>
                <v-icon
                  slot="activator"
                  @click="editItem(props.item)"
                  :disabled="!isAuthenticated || props.item.project_id === null"
                  v-bind:style="styleObject"
                >
                  edit
                </v-icon>
              </v-tooltip>
              <v-tooltip
                bottom
                :disabled="isAuthenticated && props.item.project_id !== null"
              >
                <div v-if="!isAuthenticated">
                  <span>
                    {{ $store.state.commonTooltipMessages.unauthenticated }}
                  </span>
                </div>
                <div v-else-if="props.item.project_id === null">
                  <span>
                    {{ $store.state.commonTooltipMessages.publicData }}
                  </span>
                </div>
                <v-icon
                  slot="activator"
                  @click="deleteItem(props.item)"
                  :disabled="!isAuthenticated || props.item.project_id === null"
                  v-bind:style="styleObject"
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
            @click="isMapCreationDialogVisible = true"
            color="primary"
            v-bind:style="styleObject"
          >
            <v-icon>add</v-icon>
          </v-btn>
        </v-tooltip>
      </v-flex>
    </v-layout>
    <!-- Definition of the edit dialog -->
    <v-dialog v-model="isMapEditDialogVisible" width="650">
      <v-card class="pa-2">
        <v-container grid-list-lg text-md-left>
          <v-layout fill-height column wrap>
            <v-flex md6>
              <h3>Edit {{ name }}</h3>
            </v-flex>
            <v-flex>
              <v-form ref="form" v-model="valid" @keyup.native.enter="editMap">
                <v-text-field
                  required
                  v-model="name"
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
                      @click.stop="isProjectCreationDialogVisible = true"
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
                  v-model="selectedModel"
                  :items="availableModels"
                  :rules="[rules.required]"
                  persistent-hint
                  name="model"
                  label="Model"
                  type="text"
                >
                  <template v-slot:append-item>
                    <v-divider class="my-2"></v-divider>
                    <v-btn
                      depressed
                      @click.stop="isModelCreationDialogVisible = true"
                    >
                      <v-icon class="mr-4">add_circle</v-icon>
                      New Model
                    </v-btn>
                  </template>
                </v-autocomplete>
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
            :disabled="$store.state.isDialogVisible.loader || !valid"
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
import * as settings from "@/settings";
import { mapGetters } from "vuex";

export default Vue.extend({
  name: "Maps",
  data: () => ({
    valid: false,
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
    mapItem: { name: null },
    mapItemIndex: null,
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
    }
  }),
  methods: {
    editItem(item) {
      this.id = item.id;
      this.name = item.name;
      this.project = this.availableProjects.find(
        obj => obj.id == item.project_id
      );
      this.selectedModel = this.availableModels.find(
        obj => obj.id == item.model_id
      );
      this.mapItemIndex = this.availableMaps.indexOf(item);
      this.isMapEditDialogVisible = true;
    },
    deleteItem(item) {
      this.mapItem = item;
      this.isDeletionDialogVisible = true;
    },
    editMap() {
      const payload = {
        id: this.id,
        name: this.name,
        project_id: this.project.id,
        model_id: this.selectedModel.id
      };
      axios
        .put(`${settings.apis.maps}/maps/${this.id}`, payload)
        .then((response: AxiosResponse) => {
          this.$store.commit("toggleDialog", "loader");
          const commitPayload = {
            item: payload,
            index: this.mapItemIndex
          };
          this.$store.commit("maps/editMap", commitPayload);
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
          this.isMapEditDialogVisible = false;
        });
    },
    passProject(project) {
      this.project = project;
    },
    passModel(model) {
      this.selectedModel = model;
    }
  },
  computed: {
    isAuthenticated() {
      return this.$store.state.session.isAuthenticated;
    },
    availableMaps() {
      return this.$store.state.maps.maps;
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
  }
});
</script>
