import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";

export interface ModelItem {
  id: number;
  name: string;
  organism_id: number;
  project_id: number;
  preferred_id: number;
  default_biomass_reaction: string;
  model_serialized?: object;
}

export default {
  namespaced: true,
  state: {
    models: [],
    modelsPromise: null
  },
  mutations: {
    setModels(state, models: ModelItem[]) {
      state.models = models;
    },
    editModel(state, payload: any) {
      Vue.set(state.models, payload.index, payload.item);
    },
    addModel(state, model: ModelItem) {
      state.models.push(model);
    },
    delete(state, ids) {
      state.models = state.models.filter(model => !ids.includes(model.id));
    },
    setModelsPromise(state, modelsPromise) {
      state.modelsPromise = modelsPromise;
    }
  },
  actions: {
    fetchModels({ commit }) {
      const modelsPromise = axios
        .get(`${settings.apis.modelStorage}/models`)
        .then((response: AxiosResponse<ModelItem[]>) => {
          commit("setModels", response.data);
        })
        .catch(error => {
          commit("setFetchError", error, { root: true });
        });
      commit("setModelsPromise", modelsPromise);
    }
  },
  getters: {
    getModelById: state => (id: number) => {
      return state.models.find(model => model.id === id);
    }
  }
};
