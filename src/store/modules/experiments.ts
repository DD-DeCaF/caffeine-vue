import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";

export interface ExperimentItem {
  created: string;
  description: string;
  id: number;
  name: string;
  project_id: number;
  updated: string;
}

export default {
  namespaced: true,
  state: {
    experiments: [],
    experimentsPromise: null
  },
  mutations: {
    setExperiments(state, experiments: ExperimentItem[]) {
      state.experiments = experiments;
    },
    setExperimentsPromise(state, experimentsPromise) {
      state.experimentsPromise = experimentsPromise;
    }
  },
  actions: {
    fetchExperiments({ commit, dispatch }) {
      const experimentsPromise = axios
        .get(`${settings.apis.warehouse}/experiments`)
        .then((response: AxiosResponse<ExperimentItem[]>) => {
          commit("setExperiments", response.data);
        })
        .catch(error => {
          dispatch("setFetchError", error, { root: true });
        });
      commit("setExperimentsPromise", experimentsPromise);
    }
  }
};
