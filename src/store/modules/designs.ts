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
    gene_knockouts: string[];
    reaction_knockins: string[];
    reaction_knockouts: string[];
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
    designs: []
  },
  mutations: {
    setDesigns(state, designs: DesignItem[]) {
      state.designs = designs;
    },
    delete(state, ids) {
      state.designs = state.designs.filter(design => !ids.includes(design.id));
    }
  },
  actions: {
    fetchDesigns({ commit }) {
      axios
        .get(`${settings.apis.designStorage}/designs`)
        .then((response: AxiosResponse<DesignItem[]>) => {
          const designs = response.data.map(design => {
            return {
              ...design,
              design: {
                ...design.design,
                reaction_knockins: design.design.reaction_knockins.map(
                  reaction => JSON.parse(reaction)
                )
              }
            };
          });
          commit("setDesigns", designs);
        })
        .catch(error => {
          commit("setFetchError", error, { root: true });
        });
    }
  }
};
