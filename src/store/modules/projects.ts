import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/settings";

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
    setProjects(state, projects: ProjectItem[]) {
      state.projects = projects;
    },
    addProject(state, project: ProjectItem) {
      state.projects.push(project);
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
    getProjectById: (state) => (id: number) => {
      return state.projects.find(project => project.id === id);
    }
  }
};
