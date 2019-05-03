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
    editMap(state, payload: any) {
      state.maps[payload.index] = payload.item;
    },
    addMap(state, map: MapItem) {
      state.maps.push(map);
    },
    delete(state, ids) {
      state.maps = state.maps.filter(map => !ids.includes(map.id));
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
    },
    getMapById: state => (id: number) => {
      return state.maps.find(map => map.id === id);
    }
  }
};
