import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import { vuexStoreModule } from "@/store/vuexStoreModule";

export interface StrainItem {
  id: number;
  name: string;
  organism_id: number;
  genotype: string;
  parent_id: number;
  project_id: number;
  created: string;
  updated: string;
}

export default vuexStoreModule({
  namespaced: true,
  state: {
    strains: [] as StrainItem[],
    strainsPromise: null as Promise<void> | null
  },
  mutations: {
    setStrains(state, strains: StrainItem[]) {
      state.strains = strains;
    },
    addStrain(state, strain: StrainItem) {
      state.strains.push(strain);
    },
    setStrainsPromise(state, strainsPromise) {
      state.strainsPromise = strainsPromise;
    }
  },
  actions: {
    fetchStrains({ commit, dispatch }) {
      const strainsPromise = axios
        .get(`${settings.apis.warehouse}/strains`)
        .then((response: AxiosResponse<StrainItem[]>) => {
          commit("setStrains", response.data);
        })
        .catch(error => {
          dispatch("setFetchError", error, { root: true });
        });
      commit("setStrainsPromise", strainsPromise);
    }
  }
});
