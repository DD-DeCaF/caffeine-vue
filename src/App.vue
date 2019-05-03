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
      <v-navigation-drawer v-model="drawer" app clipped>
        <v-layout column fill-height>
          <v-list>
            <v-list-tile to="/">
              <v-list-tile-action>
                <v-icon>home</v-icon>
              </v-list-tile-action>

              <v-list-tile-content>
                <v-list-tile-title>Home</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>

            <v-list-tile to="/interactiveMap">
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
              <span> {{ disabledTooltipText }} </span>
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
              <span> {{ disabledTooltipText }} </span>
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
              <span> {{ disabledTooltipText }} </span>
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
              <span> {{ disabledTooltipText }} </span>
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

export default Vue.extend({
  components: {
    LoginDialog
  },
  data: () => ({
    drawer: false,
    isProjectCreationDialogVisible: false,
    isOrganismCreationDialogVisible: false
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
    }
  },
  methods: {},
  beforeCreate() {
    // Configure the HTTP interceptors before anything else, to make sure HTTP
    // requests behave as expected. (See the interceptors for details)
    this.$store.dispatch("session/interceptRequests");

    // Restore potential existing session from local storage.
    const token = localStorage.getItem("jwt");
    if (token !== null) {
      this.$store.commit("session/login", JSON.parse(token));
    }

    // Regularly refresh the authorization token.
    this.$store.dispatch("session/refreshTokenLoop");

    // Now fetch the user data, as session/token logic is ready and will ensure
    // the requests are authorized as expected.
    this.$store.dispatch("fetchAllData");
  }
});
</script>
