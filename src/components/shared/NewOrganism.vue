<template>
  <div>
    <v-btn
      color="secondary"
      depressed
      @click.native.stop="isOrganismCreationDialogVisible = true"
    >
      New Organism
    </v-btn>
    <v-dialog v-model="isOrganismCreationDialogVisible" width="650">
      <v-card class="pa-2">
        <div class="text-xs-center pa-4" v-if="isLoading">
          <v-progress-circular
            indeterminate
            color="primary"
            size="80"
          ></v-progress-circular>
        </div>
        <v-container grid-list-lg text-md-left v-if="!isLoading">
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
                  required
                  v-model="organismName.value"
                  :rules="organismName.rules"
                  name="name"
                  label="Name"
                  type="text"
                  placeholder="e.g. My Cool Organism"
                ></v-text-field>
                <v-select
                  required
                  item-text="name"
                  v-model="projectName.value"
                  :items="availableProjects"
                  :rules="projectName.rules"
                  name="project"
                  label="Project"
                  type="text"
                >
                  <template v-slot:append-item>
                  <v-divider class="my-2"></v-divider>
                  <NewProject />
                </template>
                </v-select>
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
            @click="isOrganismCreationDialogVisible = false"
            :disabled="isLoading"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="createOrganism"
            :disabled="isLoading || !valid"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar
      color="success"
      v-model="isOrganismCreationSuccess"
      bottom
      :timeout="3000"
    >
      {{ organismName.value }} successfully created.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";

export default Vue.extend({
  name: "NewOrganism",
  data: () => ({
    valid: true,
    isLoading: false,
    isOrganismCreationDialogVisible: false,
    isOrganismCreationSuccess: false,
    organismName: {
      value: null,
      rules: [(v: string) => !!v || "A name is required."]
    },
    projectName: {
      value: null,
      rules: [(v: string) => !!v || "A project is required."]
    }
  }),
  methods: {
    createOrganism() {
      this.isLoading = true;
      axios
        .post(`${settings.apis.iam}/organisms`, { name: this.organismName.value })
        .then((response: AxiosResponse) => {
          const organismItem = Object.assign(
            { name: this.organismName.value },
            response.data
          );
          this.$store.commit("organisms/addOrganism", organismItem);
          this.isOrganismCreationDialogVisible = false;
          this.isOrganismCreationSuccess = true;
        })
        .catch(error => {
          this.$store.commit("setPostError", error);
        })
        .then(() => {
          this.isLoading = false;
        });
    }
  },
  computed: {
    availableProjects() {
      return this.$store.state.projects.projects
    }
  },
  watch: {
    // Reset the organism creation form when the creation dialog is closed.
    isOrganismCreationDialogVisible() {
      this.$refs.form.reset();
    }
  }
});
</script>
