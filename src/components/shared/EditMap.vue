<template>
  <div>
    <v-dialog v-model="isVisible" width="650">
      <v-card class="pa-2">
        <v-container grid-list-lg text-md-left>
          <v-layout fill-height column wrap>
            <v-flex md6>
              <h3>Edit {{ editedMapItem.name }}</h3>
            </v-flex>
            <v-flex>
              <v-form
                ref="form"
                v-model="valid"
                @keyup.native.enter="editMap"
              >
                <v-text-field
                  required
                  v-model="editedMapItem.name"
                  :rules="[rules.required]"
                  name="name"
                  label="Name"
                  type="text"
                  placeholder="e.g. My Favourite Map"
                ></v-text-field>
                <v-autocomplete
                  required
                  item-text="selectedProject"
                  v-model="editedMapItem.project_id"
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
                  item-text="selectedModel"
                  v-model="editedMapItem.map_id"
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
            @click="isVisible = false"
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
    <v-snackbar
      color="success"
      v-model="isMapEditSuccess"
      bottom
      :timeout="3000"
    >
      {{ mapItem.name }} successfully edited.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";
import { mapGetters } from 'vuex';

export default Vue.extend({
  name: "EditMap",
  props: {
    value: {
      type: Boolean,
      required: true
    },
    mapItem: {
      required: true
    }
  },
  data: () => ({
    valid: false,
    isMapEditSuccess: false,
    isInvalidCredentials: false,
    isUnauthorized: false,
    isNotFound: false,
    hasOtherError: false,
    rules: {
      required: value => !!value || "Required."
    }
  }),
  methods: {
    editMap() {
      axios
      .put(`${settings.apis.maps}/maps`, this.editedMapItem)
      .then((response: AxiosResponse) => {
        this.$store.commit("toggleDialog", "loader");
        this.$store.commit("editMap", this.editedMapItem.id);
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
    availableProjects() {
      return this.$store.state.projects.projects;
    },
    availableModels() {
      return this.$store.state.models.models;
    },
    isVisible: {
      get: function() {
        return this.value;
      },
      set: function(value) {
        this.$refs.form!.reset();
        return value;
      }
    },
    editedMapItem: {
      get: function() {
        return this.mapItem
      },
      set: function(value: any) {
        return value;
      }
    },
    selectedProject() {
      return this.project(this.editedMapItem.project_id);
    },
    selectedModel() {
      return this.model(this.editedMapItem.model_id);
    },
    ...mapGetters({
      project: "projects/getProjectById",
      model: "models/getModelById"
    })
  },
  watch: {}
});
</script>
