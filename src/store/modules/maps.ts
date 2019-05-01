import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/settings";

export interface MapItem {
  id: number;
  name: string;
  model_id: number;
  project_id: number;
}

export default {
  namespaced: true,
  state: {
    maps: [],
    fetchRequest: null
  },
  mutations: {
    setMaps(state, maps: MapItem[]) {
      state.maps = maps;
    },
    setFetchRequest(state, fetchRequest) {
      state.fetchRequest = fetchRequest;
    }
  },
  actions: {
    fetchMaps({ commit }) {
      const fetchRequest = axios
        .get(`${settings.apis.maps}/maps`)
        .then((response: AxiosResponse<MapItem[]>) => {
          commit("setMaps", response.data);
        })
        .catch(error => {
          commit("setFetchError", error, { root: true });
        })
        .then(() => {
          commit("setFetchRequest", null);
        });
      commit("setFetchRequest", fetchRequest);
    }
  },
  getters: {
    onData: state => callback => {
      if (state.fetchRequest !== null) {
        state.fetchRequest.then(callback);
      } else {
        callback();
      }
    }
  }
};
