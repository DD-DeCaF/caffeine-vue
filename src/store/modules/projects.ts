import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import colors from "vuetify/es5/util/colors";
import * as settings from "@/utils/settings";

export interface ProjectItem {
  id: number;
  name: string;
}

export interface ColoredProjectItem extends ProjectItem {
  color: string;
}

interface ProjectStore {
  projects: ColoredProjectItem[];
  activeProject?: ColoredProjectItem;
  projectsPromise?: Promise<void>;
}

const sensibleColors = {};
const excludedColors = new Set(["yellow", "shades"]);
for (let color in colors) {
  if (color in excludedColors) {
    continue;
  }
  for (let shade in colors[color]) {
    if (shade.includes("base") || shade.includes("darken2")) {
      sensibleColors[String(color + "_" + shade)] = colors[color][shade];
    }
  }
}
const sortedColors = Object.values(sensibleColors).sort();
const numColors = Object.keys(sortedColors).length;

export default {
  namespaced: true,
  state: {
    projects: [],
    activeProject: null,
    projectsPromise: null
  },
  mutations: {
    setProjects(state: ProjectStore, projects: ColoredProjectItem[]) {
      state.projects = projects;
    },
    addProject(state: ProjectStore, project: ColoredProjectItem) {
      state.projects.push(project);
    },
    editProject(state: ProjectStore, payload: any) {
      Vue.set(state.projects, payload.index, payload.item);
    },
    delete(state: ProjectStore, ids) {
      state.projects = state.projects.filter(
        project => !ids.includes(project.id)
      );
    },
    setActiveProject(state: ProjectStore, id: number) {
      state.activeProject = state.projects.find(project => project.id === id);
    },
    setProjectsPromise(state: ProjectStore, projectsPromise: Promise<void>) {
      state.projectsPromise = projectsPromise;
    }
  },
  actions: {
    fetchProjects({ commit, dispatch }) {
      const projectsPromise: Promise<void> = axios
        .get(`${settings.apis.iam}/projects`)
        .then((response: AxiosResponse<ProjectItem[]>) => {
          commit(
            "setProjects",
            response.data.map(
              (project: ProjectItem): ColoredProjectItem => {
                return {
                  color: String(sortedColors[project.id % numColors]),
                  ...project
                };
              }
            )
          );
        })
        .catch(error => {
          dispatch("setFetchError", error, { root: true });
        });
      commit("setProjectsPromise", projectsPromise);
    }
  },
  getters: {
    getProjectById: state => (id: number) => {
      return state.projects.find(project => project.id === id);
    },
    getProjects: state => {
      return state.projects;
    }
  }
};
