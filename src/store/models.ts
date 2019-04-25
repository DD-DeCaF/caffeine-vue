import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";

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
    models: []
  },
  getters: {
    getModelById: (state) => (id: number) => {
      return state.models.find(model => model.id === id);
    }
  },
  mutations: {
    setModels(state, models: ModelItem[]) {
      state.models = models;
    }
  },
  actions: {
    fetchModels({ commit }) {
      axios
        .get(`${settings.apis.modelStorage}/models`)
        .then((response: AxiosResponse<ModelItem[]>) => {
          commit("setModels", response.data);
        })
        .catch(error => {
          commit("setFetchError", error, { root: true });
        });
    }
  }
};
