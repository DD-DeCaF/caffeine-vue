import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import { vuexStoreModule } from "@/store/vuexStoreModule";

export interface ExperimentItem {
  created: string;
  description: string;
  id: number;
  name: string;
  project_id: number;
  updated: string;
}

export default vuexStoreModule({
  namespaced: true,
  state: {
    experiments: [] as ExperimentItem[],
    experimentsPromise: null as Promise<void> | null
  },
  mutations: {
    setExperiments(state, experiments: ExperimentItem[]) {
      state.experiments = experiments;
    },
    addExperiment(state, experiment: ExperimentItem) {
      state.experiments.push(experiment);
    },
    setExperimentsPromise(state, experimentsPromise) {
      state.experimentsPromise = experimentsPromise;
    },
    delete(state, ids) {
      state.experiments = state.experiments.filter(
        experiment => !ids.includes(experiment.id)
      );
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
});
