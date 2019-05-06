import Vue from "vue";
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
    editModel(
      state,
      {
        editedModel,
        editedIndex
      }: { editedModel: ModelItem; editedIndex: number }
    ) {
      Vue.set(state.maps, editedIndex, editedModel);
    },
    addModel(state, model: ModelItem) {
      state.models.push(model);
    },
    delete(state, ids) {
      state.models = state.models.filter(model => !ids.includes(model.id));
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
