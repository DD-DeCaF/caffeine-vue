<template>
  <v-container>
    <DeletionDialog
      v-model="isDeletionDialogVisible"
      :items="[projectItem]"
      itemsType="projects"
    />
    <NewProject v-model="isProjectCreationDialogVisible" />
    <v-layout justify-center>
      <v-flex md6>
        <h1>Projects</h1>
        <v-data-table
          :headers="headers"
          :items="availableProjects"
          class="elevation-8"
          :pagination.sync="pagination"
        >
          <template v-slot:items="props">
            <td>{{ props.item.name }}</td>
            <td>
              <v-icon slot="activator" @click="editItem(props.item)">
                edit
              </v-icon>
              <v-icon slot="activator" @click="deleteItem(props.item)">
                delete
              </v-icon>
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
            @click.stop="isProjectCreationDialogVisible = true"
            color="primary"
            v-bind:style="styleObject"
          >
            <v-icon>add</v-icon>
          </v-btn>
        </v-tooltip>
      </v-flex>
    </v-layout>
    <!-- Definition of the edit dialog -->
    <v-dialog v-model="isProjectEditDialogVisible" width="650">
      <v-card class="pa-2">
        <v-container grid-list-lg text-md-left>
          <v-layout fill-height column wrap>
            <v-flex md6>
              <h3>Edit {{ name }}</h3>
            </v-flex>
            <v-flex>
              <v-form
                ref="form"
                v-model="valid"
                @keyup.native.enter="editProject"
              >
                <v-text-field
                  required
                  v-model="name"
                  :rules="[rules.required]"
                  name="name"
                  label="Name"
                  type="text"
                  placeholder="e.g. My Favourite Project"
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
            @click.stop="isProjectEditDialogVisible = false"
            :disabled="$store.state.isDialogVisible.loader"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="editProject"
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
      v-model="isProjectEditSuccess"
      bottom
      :timeout="3000"
    >
      {{ name }} successfully edited.
    </v-snackbar>
    <v-snackbar
      color="error"
      v-model="isInvalidCredentials"
      bottom
      :timeout="3000"
    >
      401: The server could not authenticate you. You have to be logged in to
      perform this action.
    </v-snackbar>
    <v-snackbar color="error" v-model="isUnauthorized" bottom :timeout="3000">
      403: You lack permission to perform this action.
    </v-snackbar>
    <v-snackbar color="error" v-model="isNotFound" bottom :timeout="3000">
      404: The server could not find the requested data.
    </v-snackbar>
    <v-snackbar color="error" v-model="hasOtherError" bottom :timeout="5000">
      An unknown error occured. Please contact us about this.
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
  name: "Projects",
  data: () => ({
    projectItem: { name: null },
    projectItemIndex: null,
    isProjectCreationDialogVisible: false,
    isProjectEditDialogVisible: false,
    isDeletionDialogVisible: false,
    valid: true,
    isProjectEditSuccess: false,
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
  methods: {
    editItem(item) {
      this.id = item.id;
      this.name = item.name;
      this.projectItemIndex = this.availableProjects.indexOf(item);
      this.isProjectEditDialogVisible = true;
    },
    deleteItem(item) {
      this.projectItem = item;
      this.isDeletionDialogVisible = true;
    },
    editProject() {
      const payload = {
        id: this.id,
        name: this.name
      };
      axios
        .put(`${settings.apis.iam}/projects/${this.id}`, payload)
        .then((response: AxiosResponse) => {
          this.$store.commit("toggleDialog", "loader");
          const commitPayload = {
            item: payload,
            index: this.projectItemIndex
          };
          this.$store.commit("projects/editProject", commitPayload);
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
          this.isProjectEditDialogVisible = false;
        });
    },
    passProject(project) {
      this.project = project;
    }
  },
  computed: {
    isAuthenticated() {
      return this.$store.state.session.isAuthenticated;
    },
    availableProjects() {
      return this.$store.state.projects.projects;
    }
  }
});
</script>
