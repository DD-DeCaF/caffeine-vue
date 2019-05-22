import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";

export interface DesignItem {
  design: {
    constraints: [
      {
        id: string;
        lower_bound: number;
        upper_bound: number;
      }
    ];
    gene_knockouts: object[];
    reaction_knockins: object[];
    reaction_knockouts: object[];
  };
  id: number;
  model_id: number;
  name: string;
  project_id: number;
  method: string;
}

export default {
  namespaced: true,
  state: {
    designs: [],
    designsPromise: null
  },
  mutations: {
    setDesigns(state, designs: DesignItem[]) {
      state.designs = designs;
    },
    delete(state, ids) {
      state.designs = state.designs.filter(design => !ids.includes(design.id));
    },
    setDesignsPromise(state, designsPromise) {
      state.designsPromise = designsPromise;
    }
  },
  actions: {
    fetchDesigns({ commit }) {
      const designsPromise = axios
        .get(`${settings.apis.designStorage}/designs`)
        .then((response: AxiosResponse<DesignItem[]>) => {
          commit("setDesigns", response.data);
        })
        .catch(error => {
          commit("setFetchError", error, { root: true });
        });
      commit("setDesignsPromise", designsPromise);
    }
  }
};
