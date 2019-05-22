import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";

export interface ProjectItem {
  id: number;
  name: string;
}

export default {
  namespaced: true,
  state: {
    projects: [],
    currentlyActiveProject: null
  },
  mutations: {
    setProjects(state, projects: ProjectItem[]) {
      state.projects = projects;
    },
    addProject(state, project: ProjectItem) {
      state.projects.push(project);
    },
    editProject(state, payload: any) {
      Vue.set(state.projects, payload.index, payload.item);
    },
    delete(state, ids) {
      state.projects = state.projects.filter(
        project => !ids.includes(project.id)
      );
    },
    setCurrentlyActiveProject(state, value) {
      state.currentlyActiveProject = value;
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
          commit("setFetchError", error, { root: true });
        });
    }
  },
  getters: {
    getProjectById: state => (id: number) => {
      return state.projects.find(project => project.id === id);
    }
  }
};
