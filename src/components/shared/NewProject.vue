<template>
  <div>
    <v-dialog v-model="isVisible" width="650">
      <v-card class="pa-2">
        <v-container grid-list-lg text-md-left>
          <v-layout fill-height column wrap>
            <v-flex md6>
              <h3>Add a new project</h3>
            </v-flex>
            <v-flex>
              <v-form
                ref="form"
                v-model="valid"
                @keyup.native.enter="createProject"
              >
                <v-text-field
                  required
                  v-model="projectItem.name"
                  :rules="[rules.required]"
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
            @click="isVisible = false"
            :disabled="$store.state.isDialogVisible.loader"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="createProject"
            :disabled="$store.state.isDialogVisible.loader || !valid"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar
      color="success"
      v-model="isProjectCreationSuccess"
      :timeout="3000"
    >
      {{ projectItem.name }} successfully created.
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
  props: ["isProjectCreationDialogVisible"],
  data: () => ({
    valid: true,
    isProjectCreationSuccess: false,
    projectItem: {name: null},
    rules: {
      required: value => !!value || "Required."
    },
  }),
  methods: {
    createProject() {
      this.$store.commit("toggleDialog", "loader");
      axios
        .post(`${settings.apis.iam}/projects`, this.projectItem)
        .then((response: AxiosResponse) => {
          const projectItem = Object.assign(
            { name: this.projectItem.name },
            response.data
          );
          this.$store.commit("projects/addProject", projectItem);
          this.isVisible = false;
          this.isProjectCreationSuccess = true;
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
    isVisible: {
      get: function() {
        return this.isProjectCreationDialogVisible;
      },
      set: function(value) {
        this.$refs.form!.reset();
        this.$store.commit("toggleDialog", "project");
      }
    }
  },
  watch: {}
});
</script>
