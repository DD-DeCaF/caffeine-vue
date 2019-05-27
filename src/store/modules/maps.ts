import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";

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
    mapsPromise: null
  },
  mutations: {
    setMaps(state, maps: MapItem[]) {
      state.maps = maps;
    },
    editMap(state, payload: any) {
      Vue.set(state.maps, payload.index, payload.item);
    },
    addMap(state, map: MapItem) {
      state.maps.push(map);
    },
    delete(state, ids) {
      state.maps = state.maps.filter(map => !ids.includes(map.id));
    },
    setMapsPromise(state, mapsPromise) {
      state.mapsPromise = mapsPromise;
    }
  },
  actions: {
    fetchMaps({ commit, dispatch }) {
      const mapsPromise = axios
        .get(`${settings.apis.maps}/maps`)
        .then((response: AxiosResponse<MapItem[]>) => {
          commit("setMaps", response.data);
        })
        .catch(error => {
          dispatch("setFetchError", error, { root: true });
        });
      commit("setMapsPromise", mapsPromise);
    }
  },
  getters: {
    getMapById: state => (id: number) => {
      return state.maps.find(map => map.id === id);
    },
    getMaps: state => {
      return state.maps;
    }
  }
};
