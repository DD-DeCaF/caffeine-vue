<template>
  <v-container>
        <DeletionDialog
      v-model="isDeletionDialogVisible"
      :items="[modelItem]"
      itemsType="models"
      @toggleLoader="toggleLoader()"
    />
    <v-layout justify-center>
      <v-flex md6>
        <h1>Models</h1>
        <v-data-table
          :headers="headers"
          :items="models"
          class="elevation-8"
          :pagination.sync= "pagination"
        >
          <template v-slot:items="props">
          <td>{{ props.item.name }}</td>
          <td>
            <v-tooltip bottom :disabled="isAuthenticated && props.item.project_id !== null">
            <div v-if="!isAuthenticated">
              <span> {{ $store.state.commonTooltipMessages.unauthenticated }} </span>
            </div>
            <div v-else-if="props.item.project_id === null">
              <span> {{ $store.state.commonTooltipMessages.publicData }} </span>
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
            <v-tooltip bottom :disabled="isAuthenticated && props.item.project_id !== null">
            <div v-if="!isAuthenticated">
              <span> {{ $store.state.commonTooltipMessages.unauthenticated }} </span>
            </div>
            <div v-else-if="props.item.project_id === null">
              <span> {{ $store.state.commonTooltipMessages.publicData }} </span>
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
          <span> {{ $store.state.commonTooltipMessages.unauthenticated }} </span>
        <v-btn
          slot="activator"
          fixed
          fab
          bottom
          right
          large
          :disabled="!isAuthenticated"
          @click="$store.commit('toggleDialog', 'model')"
          color='secondary'
          v-bind:style="styleObject"
        >
          <v-icon>add</v-icon>
        </v-btn>
        </v-tooltip>
      </v-flex>
    </v-layout>
     <!-- Definition of the edit dialog -->
     <v-dialog v-model="isModelEditDialogVisible" width="650">
      <v-card class="pa-2">
        <v-container grid-list-lg text-md-left>
          <v-layout fill-height column wrap>
            <v-flex md6>
              <h3>Edit {{ modelItem.name }}</h3>
            </v-flex>
            <v-flex>
              <v-form
                ref="form"
                v-model="valid"
                @keyup.native.enter="editModel"
              >
                <v-text-field
                  required
                  v-model="modelItem.name"
                  :rules="[rules.required]"
                  name="name"
                  label="Name"
                  type="text"
                  placeholder="e.g. My Favourite Model"
                ></v-text-field>
                <v-autocomplete
                  required
                  item-text="name"
                  item-value="id"
                  v-model="modelItem.organism_id"
                  :items="availableOrganisms"
                  :rules="[rules.required]"
                  name="organism"
                  label="Organism"
                  type="text"
                >
                  <template v-slot:append-item>
                    <v-divider class="my-2"></v-divider>
                    <v-btn
                      color="secondary"
                      @click="$store.commit('toggleDialog', 'organism')"
                    >
                      <v-icon>add</v-icon>
                      New organism
                    </v-btn>
                  </template>
                </v-autocomplete>
                <v-autocomplete
                  item-text="name"
                  item-value="id"
                  v-model="modelItem.map_id"
                  :items="availableMaps"
                  persistent-hint
                  name="map"
                  label="Preferred Map"
                  type="text"
                >
                  <template v-slot:append-item>
                    <v-divider class="my-2"></v-divider>
                    <v-btn
                      color="secondary"
                      @click="$store.commit('toggleDialog', 'map')"
                    >
                      <v-icon>add</v-icon>
                      New Map
                    </v-btn>
                  </template>
                </v-autocomplete>
                <v-autocomplete
                  required
                  item-text="name"
                  item-value="id"
                  v-model="modelItem.default_biomass_reaction"
                  :items="availableReactions"
                  hint="The reaction identifier of this model's default biomass reaction"
                  persistent-hint
                  name="biomass"
                  label="Default Biomass Reaction"
                  type="text"
                >
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
            @click.stop="isModelEditDialogVisible = false"
            :disabled="$store.state.isDialogVisible.loader"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="editModel"
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
      {{ modelItem.name }} successfully edited.
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";
import { mapGetters } from 'vuex';

export default Vue.extend({
  name: "Models",
  data: () => ({
    modelItemIndex: null,
    isModelEditDialogVisible: false,
    isDeletionDialogVisible: false,
    valid: true,
    isMapEditSuccess: false,
    isInvalidCredentials: false,
    isUnauthorized: false,
    isNotFound: false,
    hasOtherError: false,
    rules: {
      required: value => !!value || "Required."
    },
    modelItem: {id: null, name: null, map_id: null, project_id: null, organism_id: null},
    headers: [
          {
            text: 'Name',
            align: 'left',
            value: 'name'
          },
          { text: 'Actions', value: 'name', sortable: false }
        ],
    pagination: {
      rowsPerPage: 10
    },
    show: false,
    // Vuitify disables all pointer events on disabled objects.
    // https://stackoverflow.com/questions/51826891/how-do-i-enable-tooltips-on-a-disabled-text-field-in-vuetify
    // This style object is what we use to re-enable them so that the tooltip can be triggered on a disabled button.
    styleObject: {
      'pointer-events': "auto"
    }
  }),
  methods: {
    editItem(item) {
      this.modelItem = item;
      this.isModelEditDialogVisible = true
    },
     deleteItem(item) {
      this.modelItem = item;
      this.isDeletionDialogVisible = true
    },
    editModel() {
      axios
      .put(`${settings.apis.models}/models/${this.modelItem.id}`, this.modelItem)
      .then((response: AxiosResponse) => {
        this.$store.commit("toggleDialog", "loader");
        this.$store.commit("models/editModel", this.modelItem, this.modelItemIndex);
        this.isModelEditSuccess = true;
        this.isModelEditDialogVisible = false;
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
        });
    }
  },
  computed: {
    isAuthenticated() {
      return this.$store.state.session.isAuthenticated;
    },
    models() {
      return this.$store.state.models.models
    },
    ...mapGetters({
      map: "maps/getMapById",
      project: "projects/getProjectById",
      organism: "organisms/getOrganismsById"
    }),
  availableProjects() {
      return this.$store.state.projects.projects;
    },
  availableMaps() {
      return this.$store.state.maps.maps;
    },
  availableOrganisms() {
      return this.$store.state.organisms.organisms;
    },
    availableReactions() {
      return ["Biomass1", "Biomass2"];
    },
  }
});
</script>
