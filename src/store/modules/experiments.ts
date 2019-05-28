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
    experiments: []
  },
  mutations: {
    setExperiments(state, experiments: ExperimentItem[]) {
      state.experiments = experiments;
    }
  },
  actions: {
    fetchExperiments({ commit, dispatch }) {
      axios
        .get(`${settings.apis.warehouse}/experiments`)
        .then((response: AxiosResponse<ExperimentItem[]>) => {
          commit("setExperiments", response.data);
        })
        .catch(error => {
          dispatch("setFetchError", error, { root: true });
        });
    }
  }
};
