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
  // Note that `model_serialized` will not be retrieved before requested through
  // the `withFullModel` action.
  model_serialized?: object;
}

// TODO (Moritz Beber): This mapping needs to be expanded to all organisms.
// See https://github.com/DD-DeCaF/caffeine-vue/issues/41
export const organism2ModelMapping = {
  "2": 10
};

export default {
  namespaced: true,
  state: {
    models: [],
    modelsPromise: null,
    // `fullModelPromises` contains the promises to request the full model,
    // keyed by model id. See the `withFullModel` action.
    fullModelPromises: {}
  },
  mutations: {
    setModels(state, models: ModelItem[]) {
      state.models = models;
    },
    setFullModel(state, model) {
      const index = state.models.findIndex(m => m.id === model.id);
      Vue.set(state.models, index, model);
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
    },
    setFullModelPromise(state, { modelId, promise }) {
      Vue.set(state.fullModelPromises, modelId, promise);
    }
  },
  actions: {
    fetchModels({ commit }) {
      const modelsPromise = axios
        .get(`${settings.apis.modelStorage}/models`)
        .then((response: AxiosResponse<ModelItem[]>) => {
          // Store the models, but initialize the missing `model_serialized`
          // field to null.
          commit(
            "setModels",
            response.data.map(model => ({
              ...model,
              model_serialized: null
            }))
          );
        })
        .catch(error => {
          commit("setFetchError", error, { root: true });
        });
      commit("setModelsPromise", modelsPromise);
    },
    withFullModel({ state, commit }, modelId) {
      // Use this action's returned promise to run logic which needs the full
      // model to be available. If requested for the first time it will be
      // retrieved, and from then on stay cached in the store and returned
      // instantly.
      if (state.fullModelPromises[modelId]) {
        return state.fullModelPromises[modelId];
      } else {
        const promise = new Promise((resolve, reject) => {
          axios
            .get(`${settings.apis.modelStorage}/models/${modelId}`)
            .then(response => {
              commit("setFullModel", response.data);
              resolve(response.data);
            })
            .catch(error => {
              commit("setFetchError", error, { root: true });
              reject(error);
            });
        });
        commit("setFullModelPromise", { modelId, promise });
        return promise;
      }
    }
  },
  getters: {
    getModelById: state => (id: number) => {
      return state.models.find(model => model.id === id);
    }
  }
};
