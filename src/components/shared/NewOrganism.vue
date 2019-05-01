<template>
  <div>
    <v-dialog v-model="isVisible" width="650">
      <v-card class="pa-2">
        <v-container grid-list-lg text-md-left>
          <v-layout fill-height column wrap>
            <v-flex md6>
              <h3>Add a new organism</h3>
            </v-flex>
            <v-flex>
              <v-form
                ref="form"
                v-model="valid"
                @keyup.native.enter="createOrganism"
              >
                <v-text-field
                  autofocus
                  required
                  v-model="organismName"
                  :rules="[rules.required]"
                  name="name"
                  label="Name"
                  type="text"
                  placeholder="e.g. My Cool Organism"
                ></v-text-field>
                <v-autocomplete
                  return-object
                  required
                  item-text="name"
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
                      depressed=""
                      @click="$store.commit('toggleDialog', 'project')"
                    >
                      <v-icon class="mr-4">add_circle</v-icon>
                      New project
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
            @click="createOrganism"
            :disabled="$store.state.isDialogVisible.loader || !valid"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar
      color="success"
      v-model="isOrganismCreationSuccess"
      :timeout="3000"
    >
      {{ organismName }} successfully created.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/settings";

export default Vue.extend({
  name: "NewOrganism",
  props: ["isOrganismCreationDialogVisible"],
  data: () => ({
    valid: true,
    isOrganismCreationSuccess: false,
    rules: {
      required: value => !!value || "Required."
    },
    organismName: null,
    project: {name: null, id: null}
  }),
  methods: {
    createOrganism() {
      this.$store.commit("toggleDialog", "loader");
      const payload = {name: this.organismName, project_id: this.project.id}
      console.log("The current organismItem:", payload)
      axios
        .post(`${settings.apis.warehouse}/organisms`, payload)
        .then((response: AxiosResponse) => {
          this.$store.commit("organisms/addOrganism", response.data);
          this.isVisible = false;
          this.isOrganismCreationSuccess = true;
        })
        .catch(error => {
          this.$store.commit("setPostError", error);
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
    isVisible: {
      get: function() {
        return this.isOrganismCreationDialogVisible;
      },
      set: function(value) {
        this.$refs.form!.reset();
        this.$store.commit("toggleDialog", "organism");
      }
    }
  },
  watch: {}
});
</script>
