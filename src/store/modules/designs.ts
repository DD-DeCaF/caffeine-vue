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
    added_reactions?: Object[];
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
          const promises = response.data.map(design => {
            // if design comes initially from job then full reaction information
            // is already stored in the design storage
            if (design.method === "Pathway") {
              return {
                ...design,
                design: {
                  ...design.design,
                  added_reactions: design.design.reaction_knockins.map(
                    reaction => JSON.parse(reaction)
                  )
                }
              };
            } else {
              // otherwise request full information from BIGG
              return axios
                .all(
                  design.design.reaction_knockins.map(reactionId =>
                    axios.get(
                      `${
                        settings.apis.bigg
                      }/models/universal/reactions/${reactionId}`
                    )
                  )
                )
                .then(response => {
                  let addedReactions: any = [];
                  response.forEach(r => {
                    const reaction = {
                      id: r.data.bigg_id,
                      name: r.data.name,
                      reactionString: r.data.reaction_string,
                      lowerBound: -1000,
                      upperBound: 1000,
                      gene_reaction_rule: "",
                      metabolites: {
                        ...r.data.metabolites.map(m => ({
                          [`${m.bigg_id}_${
                            m.compartment_bigg_id
                          }`]: m.stoichiometrys
                        }))
                      },
                      metabolites_to_add: r.data.metabolites.map(m => ({
                        id: `${m.bigg_id}_${m.compartment_bigg_id}`,
                        name: m.name,
                        compartment: m.compartment_bigg_id,
                        charge: m.stoichiometry
                      }))
                    };
                    addedReactions.push(reaction);
                  });
                  return {
                    ...design,
                    design: {
                      ...design.design,
                      added_reactions: addedReactions
                    }
                  };
                })
                .catch(error => {
                  commit("setFetchError", error, { root: true });
                });
            }
          });
          Promise.all(promises).then(designs => {
            commit("setDesigns", designs);
          });
        })
        .catch(error => {
          commit("setFetchError", error, { root: true });
        });
    }
  }
};
