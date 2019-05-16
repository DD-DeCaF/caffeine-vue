<template>
  <div id="app">
    <v-app>
      <LoaderDialog
        :loadingMessage="$store.state.loadingMessages.default"
        :isLoaderDialogVisible="$store.state.isDialogVisible.loader"
      />
      <NewMap :isMapCreationDialogVisible="$store.state.isDialogVisible.map" />
      <NewModel
        :isModelCreationDialogVisible="$store.state.isDialogVisible.model"
      />
      <v-toolbar app clipped-left color="primary" dark>
        <v-toolbar-side-icon
          @click.stop="drawer = !drawer"
        ></v-toolbar-side-icon>
        <v-toolbar-title>Caffeine</v-toolbar-title>
        <v-spacer></v-spacer>
        <template>
          <LoginDialog />
        </template>
      </v-toolbar>

      <v-navigation-drawer v-model="drawer" app clipped class="elevation-6">
        <v-layout column justify-space-between fill-height>
          <v-list>
            <v-list-group
              v-if="!$store.state.currentlyActiveProject"
              v-model="isExpanded"
            >
              <template v-slot:activator>
                <v-list-tile>
                  <v-list-tile-content>
                    <v-list-tile-title>Projects</v-list-tile-title>
                  </v-list-tile-content>
                </v-list-tile>
              </template>
              <v-list-tile
                v-for="project in availableProjects"
                :key="project.id"
                @click="setActiveProject(project.id)"
              >
                <v-list-tile-action>
                  <v-icon :color="projectPrimaryColor(project.id)"
                    >folder</v-icon
                  >
                </v-list-tile-action>

                <v-list-tile-content>
                  <v-list-tile-title>{{ project.name }}</v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>
            </v-list-group>
            <v-list-tile
              v-else
              @click="returnToDefault"
              class="primary white--text"
              dark
            >
              <v-list-tile-action>
                <v-icon>chevron_left</v-icon>
              </v-list-tile-action>

              <v-list-tile-content>
                <v-list-tile-title>{{
                  project($store.state.currentlyActiveProject).name
                }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>

            <v-list-tile to="/">
              <v-list-tile-action>
                <v-icon>home</v-icon>
              </v-list-tile-action>

              <v-list-tile-content>
                <v-list-tile-title>Home</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>

            <v-list-tile to="/interactive-map">
              <v-list-tile-action>
                <v-icon>$vuetify.icons.interactive_map</v-icon>
              </v-list-tile-action>

              <v-list-tile-content>
                <v-list-tile-title>Interactive Map</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>

            <v-tooltip bottom :disabled="isAuthenticated">
              <v-list-tile
                slot="activator"
                to="/design"
                :disabled="!isAuthenticated"
              >
                <v-list-tile-action>
                  <v-icon>edit</v-icon>
                </v-list-tile-action>

                <v-list-tile-content>
                  <v-list-tile-title>Design</v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>
              <span>
                {{ $store.state.commonTooltipMessages.unauthenticated }}
              </span>
            </v-tooltip>

            <v-tooltip bottom :disabled="isAuthenticated">
              <v-list-tile
                to="/jobs"
                slot="activator"
                :disabled="!isAuthenticated"
              >
                <v-list-tile-action>
                  <v-icon>hourglass_empty</v-icon>
                </v-list-tile-action>

                <v-list-tile-content>
                  <v-list-tile-title>Jobs</v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>
              <span>
                {{ $store.state.commonTooltipMessages.unauthenticated }}
              </span>
            </v-tooltip>

            <v-tooltip bottom :disabled="isAuthenticated">
              <v-list-tile
                to="/designs"
                slot="activator"
                :disabled="!isAuthenticated"
              >
                <v-list-tile-action>
                  <v-icon>device_hub</v-icon>
                </v-list-tile-action>

                <v-list-tile-content>
                  <v-list-tile-title>Designs</v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>
              <span>
                {{ $store.state.commonTooltipMessages.unauthenticated }}</span
              >
            </v-tooltip>

            <v-tooltip bottom :disabled="isAuthenticated">
              <v-list-tile
                to="/projects"
                slot="activator"
                :disabled="!isAuthenticated"
              >
                <v-list-tile-action>
                  <v-icon>subject</v-icon>
                </v-list-tile-action>

                <v-list-tile-content>
                  <v-list-tile-title>Projects</v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>
              <span>
                {{ $store.state.commonTooltipMessages.unauthenticated }}</span
              >
            </v-tooltip>

            <v-list-tile to="/maps">
              <v-list-tile-action>
                <v-icon>map</v-icon>
              </v-list-tile-action>

              <v-list-tile-content>
                <v-list-tile-title>Maps</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>

            <v-list-tile to="/models">
              <v-list-tile-action>
                <v-icon>rounded_corner</v-icon>
              </v-list-tile-action>

              <v-list-tile-content>
                <v-list-tile-title>Models</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
          <v-spacer></v-spacer>
          <div>
            <v-btn primary flat small to="/terms-of-service"
              >Terms of Service</v-btn
            >
            <v-btn primary flat small to="/privacy-policy"
              >Privacy Policy</v-btn
            >
          </div>
        </v-layout>
      </v-navigation-drawer>

      <v-content>
        <router-view />
      </v-content>

      <v-snackbar color="error" v-model="hasFetchDataError" :timeout="6000">
        Sorry, we were unable to retrieve some data from the server. Please try
        again in a few minutes.
      </v-snackbar>

      <v-snackbar color="error" v-model="hasPostDataError" :timeout="6000">
        Sorry, we were unable to complete this operation. Is the server offline
        or are you not logged in?
      </v-snackbar>

      <v-snackbar color="error" v-model="hasDeleteDataError" :timeout="6000">
        Sorry, we were unable to delete data. Please check if you are logged in.
      </v-snackbar>

      <v-snackbar color="error" v-model="hasRefreshError" :timeout="6000">
        Your session has expired and you have been logged out. Please log in
        again.
      </v-snackbar>

      <v-snackbar color="error" v-model="unauthorizedError" :timeout="6000">
        Sorry, you need to be logged in to access {{ unauthorizedError }}.
      </v-snackbar>
    </v-app>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import LoginDialog from "@/components/LoginDialog.vue";
import { mapGetters } from "vuex";
import colors from "vuetify/es5/util/colors";

export default Vue.extend({
  components: {
    LoginDialog
  },
  data: () => ({
    drawer: false,
    isProjectCreationDialogVisible: false,
    isOrganismCreationDialogVisible: false,
    isExpanded: true
  }),
  computed: {
    isAuthenticated() {
      return this.$store.state.session.isAuthenticated;
    },
    hasRefreshError: {
      get() {
        return this.$store.state.session.refreshError !== null;
      },
      set(newValue) {
        this.$store.commit("session/setRefreshError", null);
      }
    },
    hasFetchDataError: {
      get() {
        return this.$store.state.fetchDataError !== null;
      },
      set(newValue) {
        this.$store.commit("setFetchError", null);
      }
    },
    hasPostDataError: {
      get() {
        return this.$store.state.postDataError !== null;
      },
      set(newValue) {
        this.$store.commit("setPostError", null);
      }
    },
    hasDeleteDataError: {
      get() {
        return this.$store.state.deleteDataError !== null;
      },
      set(newValue) {
        this.$store.commit("setDeleteError", null);
      }
    },
    unauthorizedError: {
      get() {
        return this.$store.state.unauthorizedError;
      },
      set() {
        // Ignore passed value argument.
        this.$store.commit("setUnauthorizedError", null);
      }
    },
    availableProjects() {
      return this.$store.state.projects.projects;
    },
    ...mapGetters({
      project: "projects/getProjectById"
    }),
    sensibleColors() {
      let obj = {};
      for (let color in colors) {
        if (["yellow", "shades"].indexOf(color) === -1) {
          for (let shade in colors[color]) {
            if (shade.includes("base") || shade.includes("darken2")) {
              obj[String(color + "_" + shade)] = colors[color][shade];
            }
          }
        }
      }
      return obj;
    }
  },
  methods: {
    setActiveProject(projectID) {
      this.$store.commit("setCurrentlyActiveProject", projectID);
      this.$vuetify.theme.primary = this.projectPrimaryColor(projectID);
    },
    returnToDefault() {
      this.$vuetify.theme.primary = colors.blue.base;
      this.$store.commit("setCurrentlyActiveProject", null);
    },
    projectPrimaryColor(projectID) {
      const sortedColors = Object.values(this.sensibleColors).sort();
      return String(
        sortedColors[projectID % Object.keys(this.sensibleColors).length]
      );
    },
    camelToKebab(string) {
      return string
        .replace(/\W+/g, "-")
        .replace(/([a-z\d])([A-Z])/g, "$1-$2")
        .toLowerCase();
    }
  },
  beforeCreate() {
    // Configure the HTTP interceptors before anything else, to make sure HTTP
    // requests behave as expected. (See the interceptors for details)
    this.$store.dispatch("session/interceptRequests");

    // Regularly refresh the authorization token.
    this.$store.dispatch("session/refreshTokenLoop");

    // Now fetch the user data, as session/token logic is ready and will ensure
    // the requests are authorized as expected.
    this.$store.dispatch("fetchAllData");
  }
});
</script>
