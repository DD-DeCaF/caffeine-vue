import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";

export interface ProjectItem {
  id: number;
  name: string;
}

export default {
  namespaced: true,
  state: {
    projects: []
  },
  mutations: {
    setProjects (state, projects: ProjectItem[]) {
      state.projects = projects;
    }
  },
  actions: {
    fetchProjects({ commit }) {
      axios
        .get(`${settings.apis.iam}/projects`)
        .then((response: AxiosResponse<ProjectItem[]>) => {
          commit("setProjects", response.data);
        })
        .catch(error => {
          commit("setFetchError", error);
        });
    }
  }
};
