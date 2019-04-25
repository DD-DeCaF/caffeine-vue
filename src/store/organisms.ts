import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";

export interface OrganismItem {
  id: number;
  name: string;
  project_id: number;
  created: string;
  updated: string;
}

export default {
  namespaced: true,
  state: {
    organisms: []
  },
  mutations: {
    setOrganisms(state, organisms: OrganismItem[]) {
      state.organisms = organisms;
    },
    addOrganism(state, organism: OrganismItem) {
      state.organisms.push(organism);
    }
  },
  actions: {
    fetchOrganisms({ commit }) {
      axios
        .get(`${settings.apis.warehouse}/organisms`)
        .then((response: AxiosResponse<OrganismItem[]>) => {
          commit("setOrganisms", response.data);
        })
        .catch(error => {
          commit("setFetchError", error, { root: true });
        });
    }
  },
  getters: {
    getOrganismById: (state) => (id: number) => {
      return state.organisms.find(organism => organism.id === id);
    }
  }
};
