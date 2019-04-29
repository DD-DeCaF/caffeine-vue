import Vue from "vue";
import Vuex from "vuex";
import session from "./modules/session";
import designs from "./modules/designs";
import experiments from "./modules/experiments";
import jobs from "./modules/jobs";
import maps from "./modules/maps";
import models from "./modules/models";
import organisms from "./modules/organisms";
import projects from "./modules/projects";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    session,
    designs,
    experiments,
    jobs,
    maps,
    models,
    organisms,
    projects
  },
  state: {
    fetchDataError: null,
    postDataError: null,
    deleteDataError: null,
    unauthorizedError: null,
    isDialogVisible: {
      model: false,
      map: false,
      organism: false,
      project: false,
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
    setFetchError(state, error) {
      state.fetchDataError = error;
    },
    setPostError(state, error) {
      console.log(error);
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
    }
  },
  actions: {
    fetchAllData({ dispatch }) {
      dispatch("designs/fetchDesigns");
      dispatch("experiments/fetchExperiments");
      dispatch("jobs/fetchJobs");
      dispatch("maps/fetchMaps");
      dispatch("models/fetchModels");
      dispatch("organisms/fetchOrganisms");
      dispatch("projects/fetchProjects");
    }
  }
});
