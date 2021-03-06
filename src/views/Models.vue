<template>
  <v-container>
    <DeletionDialog
      v-model="isDeletionDialogVisible"
      :items="[modelItem]"
      itemsType="models"
      @toggleLoader="toggleLoader()"
    />
    <NewModel v-model="isModelCreationDialogVisible" />
    <!-- Disabled because its not on the old platform -->
    <!-- <NewProject
      v-model="isProjectCreationDialogVisible"
      @return-object="passProject"
    /> -->
    <NewMap v-model="isMapCreationDialogVisible" @return-object="passMap" />
    <NewOrganism
      v-model="isOrganismCreationDialogVisible"
      @return-object="passOrganism"
    />
    <v-layout justify-center>
      <v-flex md6>
        <h1 class="mb-2">Models</h1>
        <v-data-table
          :headers="headers"
          :items="availableModels"
          class="elevation-8"
          :loading="isLoading || isDeleting"
          :pagination.sync="pagination"
        >
          <template v-slot:items="{ item: model }">
            <td>{{ model.name }}</td>
            <td>
              <v-tooltip
                bottom
                :disabled="isAuthenticated && model.project_id !== null"
              >
                <div v-if="!isAuthenticated">
                  <span>
                    {{ $store.state.commonTooltipMessages.unauthenticated }}
                  </span>
                </div>
                <div v-else-if="model.project_id === null">
                  <span>
                    {{ $store.state.commonTooltipMessages.publicData }}
                  </span>
                </div>
                <v-icon
                  slot="activator"
                  @click="handler(model)"
                  :disabled="!isAuthenticated || model.project_id === null"
                  :class="{
                    pointerDisabled:
                      !isAuthenticated || model.project_id === null
                  }"
                >
                  edit
                </v-icon>
              </v-tooltip>
              <v-tooltip
                bottom
                :disabled="isAuthenticated && model.project_id !== null"
              >
                <div v-if="!isAuthenticated">
                  <span>
                    {{ $store.state.commonTooltipMessages.unauthenticated }}
                  </span>
                </div>
                <div v-else-if="model.project_id === null">
                  <span>
                    {{ $store.state.commonTooltipMessages.publicData }}
                  </span>
                </div>
                <v-icon
                  slot="activator"
                  @click="deleteItem(model)"
                  :disabled="!isAuthenticated || model.project_id === null"
                  :class="{
                    pointerDisabled:
                      !isAuthenticated || model.project_id === null
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
            @click.stop="isModelCreationDialogVisible = true"
            color="primary"
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
                  placeholder="e.g. My Favourite Model"
                ></v-text-field>
                <v-autocomplete-extended
                  return-object
                  required
                  item-text="name"
                  item-value="id"
                  v-model="organism"
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
                  return-object
                  item-text="name"
                  item-value="id"
                  v-model="preferredMap"
                  :items="availableMaps"
                  persistent-hint
                  name="map"
                  label="Preferred Map"
                  type="text"
                  ref="mapAutocomplete"
                >
                  <template v-slot:prepend-item>
                    <v-list-tile
                      ripple
                      @click="
                        isMapCreationDialogVisible = true;
                        $refs.mapAutocomplete.isMenuActive = false;
                      "
                    >
                      <v-icon class="mr-3" color="primary">add_circle</v-icon>
                      <v-list-tile-title>
                        New Map
                      </v-list-tile-title>
                    </v-list-tile>
                    <v-divider class="my-2"></v-divider>
                  </template>
                </v-autocomplete-extended>
                <v-autocomplete-extended
                  required
                  item-text="id"
                  item-value="id"
                  v-model="default_biomass_reaction"
                  :items="reactions"
                  hint="The reaction identifier of this model's default biomass reaction"
                  persistent-hint
                  name="biomass"
                  label="Default Biomass Reaction"
                  type="text"
                >
                </v-autocomplete-extended>
                <v-checkbox
                  v-model="ecModel"
                  label="This is an enzyme-constrained model (ecModel)"
                  hint="If checked, integration of proteomics data on this model will be allowed. <a-extended href='https://geckotoolbox.readthedocs.io'>Read more about GECKO and ecModels</a-extended>"
                  persistent-hint
                  required
                ></v-checkbox>
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
import { partitionedList } from "@/utils/utility";

export default Vue.extend({
  name: "Models",
  data: () => ({
    modelItem: { name: null },
    modelItemIndex: null,
    isDeleting: false,
    isLoading: true,
    isModelCreationDialogVisible: false,
    isOrganismCreationDialogVisible: false,
    isMapCreationDialogVisible: false,
    // Disabled because its not on the old platform
    // isProjectCreationDialogVisible: false,
    isModelEditDialogVisible: false,
    isDeletionDialogVisible: false,
    isValid: true,
    isMapEditSuccess: false,
    isInvalidCredentials: false,
    isUnauthorized: false,
    isNotFound: false,
    hasOtherError: false,
    reactions: [],
    rules: {
      required: value => !!value || "Required."
    },
    id: null,
    name: null,
    preferredMap: null,
    project: null,
    organism: null,
    default_biomass_reaction: null,
    ecModel: false,
    headers: [
      { text: "Name", align: "left", value: "name", width: "85%" },
      { text: "Actions", value: "name", sortable: false, width: "15%" }
    ],
    pagination: {
      rowsPerPage: 10
    },
    show: false,
    // Vuitify disables all pointer events on disabled objects.
    // https://stackoverflow.com/questions/51826891/how-do-i-enable-tooltips-on-a-disabled-text-field-in-vuetify
    // This style object is what we use to re-enable them so that the tooltip can be triggered on a disabled button.
    styleObject: {
      "pointer-events": "auto"
    }
  }),
  computed: {
    isAuthenticated() {
      return this.$store.state.session.isAuthenticated;
    },
    availableModels() {
      return this.$store.state.models.models;
    },
    availableProjects() {
      return this.$store.state.projects.projects;
    },
    availableMaps() {
      return this.$store.state.maps.maps;
    },
    availableOrganisms() {
      return this.$store.state.organisms.organisms;
    }
  },
  created() {
    this.$store.state.models.modelsPromise.then(() => {
      this.isLoading = false;
    });
  },
  methods: {
    onEnter() {
      if (this.$refs.form.validate()) {
        this.editModel();
      }
    },
    handler(item) {
      this.editItem(item);
      this.getReactions();
    },
    editItem(item) {
      this.id = item.id;
      this.name = item.name;
      this.preferredMap = this.availableMaps.find(
        obj => obj.id == item.preferred_map_id
      );
      this.organism = this.availableOrganisms.find(
        obj => obj.id == item.organism_id
      );
      this.project = this.availableProjects.find(
        obj => obj.id == item.project_id
      );
      this.default_biomass_reaction = item.default_biomass_reaction;
      this.ecModel = item.ec_model;
      this.modelItemIndex = this.availableModels.indexOf(item);
      this.isModelEditDialogVisible = true;
    },
    deleteItem(item) {
      this.modelItem = item;
      this.isDeletionDialogVisible = true;
    },
    editModel() {
      const payload = {
        id: this.id,
        name: this.name,
        preferred_map_id: this.preferredMap.id,
        organism_id: this.organism.id,
        project_id: this.project.id,
        default_biomass_reaction: this.default_biomass_reaction
      };
      axios
        .put(`${settings.apis.modelStorage}/models/${this.id}`, payload)
        .then((response: AxiosResponse) => {
          this.$store.commit("toggleDialog", "loader");
          const commitPayload = {
            item: payload,
            index: this.modelItemIndex
          };
          this.$store.commit("models/editModel", commitPayload);
          this.isModelEditSuccess = true;
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
          this.isModelEditDialogVisible = false;
        });
    },
    getReactions() {
      // Fetch the serialized selected model and return its reactions
      axios
        .get(`${settings.apis.modelStorage}/models/${this.id}`)
        .then((response: AxiosResponse) => {
          this.reactions = response.data.model_serialized.reactions;
        })
        .catch(error => {
          if (error.response && error.response.status === 404) {
            this.isNotFound = true;
            return null;
          } else {
            this.hasOtherError = true;
            return null;
          }
        });
    },
    passProject(project) {
      this.project = project;
    },
    passMap(map) {
      this.preferredMap = map;
    },
    passOrganism(organism) {
      this.organism = organism;
    },
    toggleLoader() {
      this.isDeleting = !this.isDeleting;
    }
  }
});
</script>
