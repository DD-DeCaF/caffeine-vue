import Vue from "vue";
import Vuex from "vuex";
import * as Sentry from "@sentry/browser";
import session from "./modules/session";
import consents from "./modules/consents";
import designs from "./modules/designs";
import experiments from "./modules/experiments";
import jobs from "./modules/jobs";
import maps from "./modules/maps";
import models from "./modules/models";
import organisms from "./modules/organisms";
import projects from "./modules/projects";
import strains from "./modules/strains";
import media from "./modules/media";
import interactiveMap from "./modules/interactiveMap";
import analytics from "./modules/analytics";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    session,
    consents,
    designs,
    experiments,
    jobs,
    maps,
    models,
    organisms,
    projects,
    strains,
    media,
    interactiveMap,
    analytics
  },
  state: {
    fetchDataError: false,
    postDataError: null,
    deleteDataError: null,
    unauthorizedError: null,
    passwordResetSuccess: false,
    isDialogVisible: {
      loader: false
    },
    loadingMessages: {
      default: "Loading. Please wait."
    },
    commonTooltipMessages: {
      unauthenticated: "Please log in or register to use this functionality!",
      publicData: "Public data can not be modified."
    }
  },
  mutations: {
    setFetchError(state, hasError) {
      state.fetchDataError = hasError;
    },
    setPostError(state, error) {
      state.postDataError = error;
    },
    setDeleteError(state, error) {
      state.deleteDataError = error;
    },
    setUnauthorizedError(state, error) {
      state.unauthorizedError = error;
    },
    toggleDialog(state, dialog) {
      state.isDialogVisible[dialog] = !state.isDialogVisible[dialog];
    },
    setPasswordResetSuccess(state, value: boolean) {
      state.passwordResetSuccess = value;
    }
  },
  actions: {
    fetchAllData({ dispatch }) {
      dispatch("consents/fetchConsents");
      dispatch("designs/fetchDesigns");
      dispatch("experiments/fetchExperiments");
      dispatch("jobs/fetchJobs");
      dispatch("maps/fetchMaps");
      dispatch("models/fetchModels");
      dispatch("organisms/fetchOrganisms");
      dispatch("projects/fetchProjects");
      dispatch("strains/fetchStrains");
      dispatch("media/fetchMedia");
      dispatch("media/fetchMediaCompounds");
    },
    setFetchError({ commit }, error) {
      // Dispatch this action when failing to retrieve platform data from the
      // backend. The root issue can vary (backend service down, invalid
      // request, runtime error in callbacks, etc.) so this generic action will
      // report the error to Sentry and display a generic error message to the
      // user.
      Sentry.captureException(error);
      commit("setFetchError", true);
    }
  },
  strict: process.env.NODE_ENV !== "production",
  // Remove spread workaround after https://github.com/vuejs/vuex/pull/1478 is released.
  ...{ devtools: process.env.NODE_ENV !== "production" }
});
