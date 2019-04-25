<template>
  <div>
    <v-btn 
      color="secondary" 
      depressed 
      @click.native.stop="isProjectCreationDialogVisible = true"
    >
        New Project
    </v-btn>
    <v-dialog v-model="isProjectCreationDialogVisible" width="650">
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
              <h3> Add new project </h3>
            </v-flex>
            <v-flex>
               <v-form @keyup.native.enter="createProject">
                    <v-text-field
                      required
                      v-model="project_name.value"
                      :rules="project_name.rules"
                      name="name"
                      label="Name"
                      type="text"
                      placeholder="e.g. My Cool Project"
                    ></v-text-field>
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
            @click="isProjectCreationDialogVisible = false"
            :disabled="isLoading"
          >
            Cancel
          </v-btn>
          <v-btn color="primary" @click="createProject" :disabled="isLoading"
            >Create</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar color="success" v-model="isProjectCreationSuccess" top :timeout="3000">
      Project XYZ successfully created.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";

export default Vue.extend({
  name: "NewProject",
  data: () => ({
      isLoading: false,
      isProjectCreationDialogVisible: false,
      isProjectCreationSuccess: false,
      project_name: {
        value: null,
        rules: [(v: string) => !!v || "A name is required."]
    },
  }),
  methods: {
    createProject() {
      this.isLoading = true;
      axios
        .post(`${settings.apis.iam}/projects/`, { name: this.project_name.value})
        .then((response: AxiosResponse) => {
          // this.$store.commit("session/login", response.data);
          this.isProjectCreationDialogVisible = false;
          this.isProjectCreationSuccess = true;
          // this.$store.dispatch("fetchAllData");
        })
        .catch(error => {
        })
        .then(() => {
          this.isLoading = false;
        });
    }
  },
  computed: {}
});
</script>
