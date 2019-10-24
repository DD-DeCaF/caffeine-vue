import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import { vuexStoreModule } from "@/store/vuexStoreModule";

export interface OrganismItem {
  id: number;
  name: string;
  project_id: number;
  created: string;
  updated: string;
}

export default vuexStoreModule({
  namespaced: true,
  state: {
    organisms: [] as OrganismItem[],
    organismsPromise: null as Promise<void> | null
  },
  mutations: {
    setOrganisms(state, organisms: OrganismItem[]) {
      state.organisms = organisms;
    },
    addOrganism(state, organism: OrganismItem) {
      state.organisms.push(organism);
    },
    setOrganismsPromise(state, organismsPromise) {
      state.organismsPromise = organismsPromise;
    }
  },
  actions: {
    fetchOrganisms({ commit, dispatch }) {
      const organismsPromise = axios
        .get(`${settings.apis.warehouse}/organisms`)
        .then((response: AxiosResponse<OrganismItem[]>) => {
          commit("setOrganisms", response.data);
        })
        .catch(error => {
          dispatch("setFetchError", error, { root: true });
        });
      commit("setOrganismsPromise", organismsPromise);
    }
  },
  getters: {
    getOrganismById: state => (id: number) => {
      return state.organisms.find(organism => organism.id === id);
    },
    getOrganisms: state => {
      return state.organisms;
    }
  }
});
