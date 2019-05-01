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
    models: []
  },
  mutations: {
    setModels(state, models: ModelItem[]) {
      state.models = models;
    },
    editModel(state, editedModel: ModelItem, editedIndex: number) {
      let modelsCopy = state.models.copy();
      modelsCopy[editedIndex] = editedModel;
      state.models = modelsCopy;
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
  },
  getters: {
    getModelById: state => (id: number) => {
      let model = state.models.find(model => model.id === id);
      if (model === undefined) {
        model = { name: "???" };
      }
      return model;
    }
  }
};
