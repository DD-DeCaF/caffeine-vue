import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import { vuexStoreModule } from "@/store/vuexStoreModule";

export interface DesignItem {
  design: {
    constraints: [
      {
        id: string;
        lower_bound: number;
        upper_bound: number;
      }
    ];
    gene_knockouts: any[];
    reaction_knockins: any[];
    reaction_knockouts: any[];
  };
  id: number;
  model_id: number;
  name: string;
  project_id: number;
  method: string;
}

export default vuexStoreModule({
  namespaced: true,
  state: {
    designs: [] as DesignItem[],
    designsPromise: null as Promise<void> | null
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
    fetchDesigns({ commit, dispatch }) {
      const designsPromise = axios
        .get(`${settings.apis.designStorage}/designs`)
        .then((response: AxiosResponse<DesignItem[]>) => {
          commit(
            "setDesigns",
            response.data.map(design => ({
              // Map snake_case to camelCase.
              ...design,
              design: {
                reactionKnockins: design.design.reaction_knockins.map(r => ({
                  ...r,
                  lowerBound: r.lower_bound,
                  upperBound: r.upper_bound,
                  reactionString: r.reaction_string,
                  metabolites: r.metabolites.map(m => ({
                    ...m,
                    compartment: m.compartment_id
                  }))
                })),
                reactionKnockouts: design.design.reaction_knockouts.map(r => ({
                  ...r,
                  lowerBound: r.lower_bound,
                  upperBound: r.upper_bound,
                  reactionString: r.reaction_string,
                  metabolites: r.metabolites.map(m => ({
                    ...m,
                    compartment: m.compartment_id
                  }))
                })),
                geneKnockouts: design.design.gene_knockouts.map(g => ({
                  ...g,
                  reactions: g.reactions.map(r => ({
                    ...r,
                    geneReactionRule: r.gene_reaction_rule
                  }))
                })),
                constraints: design.design.constraints.map(r => ({
                  ...r,
                  lowerBound: r.lower_bound,
                  upperBound: r.upper_bound
                }))
              }
            }))
          );
        })
        .catch(error => {
          dispatch("setFetchError", error, { root: true });
        });
      commit("setDesignsPromise", designsPromise);
    }
  },
  getters: {
    getDesignById: state => (id: number) => {
      return state.designs.find(design => design.id === id);
    }
  }
});
