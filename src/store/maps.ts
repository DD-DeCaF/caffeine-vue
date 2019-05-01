import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";

export interface MapItem {
  id: number;
  name: string;
  model_id: number;
  project_id: number;
}

export default {
  namespaced: true,
  state: {
    maps: []
  },
  mutations: {
    setMaps(state, maps: MapItem[]) {
      state.maps = maps;
    },
    editMap(state, editedMap: MapItem, editedIndex: number) {
      let mapsCopy = state.maps.copy();
      mapsCopy[editedIndex] = editedMap;
      state.maps = mapsCopy;
    }
  },
  actions: {
    fetchMaps({ commit }) {
      axios
        .get(`${settings.apis.maps}/maps`)
        .then((response: AxiosResponse<MapItem[]>) => {
          commit("setMaps", response.data);
        })
        .catch(error => {
          commit("setFetchError", error, { root: true });
        });
    }
  },
  getters: {
    getMapById: (state) => (id: number) => {
      return state.maps.find(map => map.id === id);
    }
  }
};
