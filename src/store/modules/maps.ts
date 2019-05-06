import Vue from "vue";
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
    maps: []
  },
  mutations: {
    setMaps(state, maps: MapItem[]) {
      state.maps = maps;
    },
    editMap(state, payload: any) {
      Vue.set(state.maps, payload.index, payload.item)
    },
    addMap(state, map: MapItem) {
      state.maps.push(map);
    },
    delete(state, ids) {
      state.maps = state.maps.filter(map => !ids.includes(map.id));
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
    getMapById: state => (id: number) => {
      return state.maps.find(map => map.id === id);
    }
  }
};
