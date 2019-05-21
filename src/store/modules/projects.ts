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
    projectsPromise: null
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
    setProjectsPromise(state, projectsPromise) {
      state.projectsPromise = projectsPromise;
    }
  },
  actions: {
    fetchProjects({ commit }) {
      const projectsPromise = axios
        .get(`${settings.apis.iam}/projects`)
        .then((response: AxiosResponse<ProjectItem[]>) => {
          commit("setProjects", response.data);
        })
        .catch(error => {
          commit("setFetchError", error, { root: true });
        });
      commit("setProjectsPromise", projectsPromise);
    }
  },
  getters: {
    getProjectById: state => (id: number) => {
      return state.projects.find(project => project.id === id);
    }
  }
};
