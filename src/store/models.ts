import Vue from "vue";
import Vuex from "vuex";
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
  mutations: {
    setModels(state, models: ModelItem[]) {
      state.models = models;
    }
  },
  actions: {
    fetchModels({ commit }) {
      axios
        .get(`${settings.apis.model_storage}/models`)
        .then((response: AxiosResponse<ModelItem[]>) => {
          commit("setModels", response.data);
        })
        .catch(error => {
          commit("setFetchError", error);
        });
    }
  }
};
