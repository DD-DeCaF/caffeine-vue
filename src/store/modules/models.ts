import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/settings";

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
    fetchRequest: null
  },
  mutations: {
    setModels(state, models: ModelItem[]) {
      state.models = models;
    },
    setFetchRequest(state, fetchRequest) {
      state.fetchRequest = fetchRequest;
    }
  },
  actions: {
    fetchModels({ commit }) {
      const fetchRequest = axios
        .get(`${settings.apis.modelStorage}/models`)
        .then((response: AxiosResponse<ModelItem[]>) => {
          commit("setModels", response.data);
        })
        .catch(error => {
          commit("setFetchError", error, { root: true });
        })
        .then(() => {
          commit("setFetchRequest", null);
        });
      commit("setFetchRequest", fetchRequest);
    }
  },
  getters: {
    getModelById: state => (id: number) => {
      return state.models.find(model => model.id === id);
    },
    onData: state => callback => {
      if (state.fetchRequest !== null) {
        state.fetchRequest.then(callback);
      } else {
        callback();
      }
    }
  }
};
