import Vue from "vue";
import Vuex from "vuex";
import session from "./session";
import designs from "./designs";
import experiments from "./experiments";
import jobs from "./jobs";
import maps from "./maps";
import models from "./models";
import organisms from "./organisms";
import projects from "./projects";

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
  state: {},
  mutations: {},
  actions: {}
});
