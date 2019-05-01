<template>
  <v-container>
    <DeletionDialog
      v-model="isDeletionDialogVisible"
      :items="[mapItem]"
      itemsType="maps"
      @toggleLoader="toggleLoader()"
    />
    <v-layout justify-center>
      <v-flex md6>
        <h1>Maps</h1>
        <v-data-table
          :headers="headers"
          :items="maps"
          class="elevation-8"
          :pagination.sync="pagination"
        >
          <template v-slot:items="props">
            <td>{{ props.item.name }}</td>
            <td>{{ model(props.item.model_id).name }}</td>
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
            @click="$store.commit('toggleDialog', 'map')"
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
              <h3>Edit {{ mapItem.name }}</h3>
            </v-flex>
            <v-flex>
              <v-form ref="form" v-model="valid" @keyup.native.enter="editMap">
                <v-text-field
                  required
                  v-model="mapItem.name"
                  :rules="[rules.required]"
                  name="name"
                  label="Name"
                  type="text"
                  placeholder="e.g. My Favourite Map"
                ></v-text-field>
                <v-autocomplete
                  required
                  item-text="name"
                  item-value="id"
                  v-model="mapItem.project_id"
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
                      color="secondary"
                      @click="$store.commit('toggleDialog', 'project')"
                    >
                      <v-icon>add</v-icon>
                      New project
                    </v-btn>
                  </template>
                </v-autocomplete>
                <v-autocomplete
                  required
                  item-text="name"
                  item-value="id"
                  v-model="mapItem.model_id"
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
                      color="secondary"
                      @click="$store.commit('toggleDialog', 'model')"
                    >
                      <v-icon>add</v-icon>
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
      {{ mapItem.name }} successfully edited.
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";
import { mapGetters } from "vuex";

export default Vue.extend({
  name: "Maps",
  data: () => ({
    valid: false,
    isMapEditSuccess: false,
    isInvalidCredentials: false,
    isUnauthorized: false,
    isNotFound: false,
    hasOtherError: false,
    rules: {
      required: value => !!value || "Required."
    },
    mapItem: { id: null, name: null, model_id: null, project_id: null },
    mapItemIndex: null,
    isMapEditDialogVisible: false,
    isDeletionDialogVisible: false,
    headers: [
      {
        text: "Name",
        align: "left",
        value: "name"
      },
      { text: "Model", value: "model_id" },
      { text: "Actions", value: "name", sortable: false }
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
      this.mapItem = item;
      this.isMapEditDialogVisible = true;
    },
    deleteItem(item) {
      this.mapItem = item;
      this.isDeletionDialogVisible = true;
    },
    editMap() {
      axios
        .put(`${settings.apis.maps}/maps/${this.mapItem.id}`, this.mapItem)
        .then((response: AxiosResponse) => {
          this.$store.commit("toggleDialog", "loader");
          const payload = {
            item: this.mapItem, 
            index: this.mapItemIndex
          }
          this.$store.commit("maps/editMap", payload);
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
    }
  },
  computed: {
    isAuthenticated() {
      return this.$store.state.session.isAuthenticated;
    },
    maps() {
      return this.$store.state.maps.maps;
    },
    ...mapGetters({
      model: "models/getModelById"
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
