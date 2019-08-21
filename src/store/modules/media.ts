import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";

export interface MediumItem {
  id: number;
  name: string;
  ph: number;
  compounds: MediumCompound[];

  project_id: number;
  created: string;
  updated: string;
}

export interface MediumCompound {
  id: number;
  name: string; // sodium chloride
  reference: string; // CHEBI:26710
  namespace_id: number; // CHEBI
  type_id: number; // compound
  mass_concentration: number;

  project_id: number;
  created: string;
  updated: string;
}

export default {
  namespaced: true,
  state: {
    media: [],
    mediaPromise: null
  },
  mutations: {
    setMedia(state, media: MediumItem[]) {
      state.media = media;
    },
    addMedium(state, medium: MediumItem) {
      state.media.push(medium);
    },
    setMediaPromise(state, mediaPromise) {
      state.mediaPromise = mediaPromise;
    }
  },
  actions: {
    fetchMedia({ commit, dispatch }) {
      const mediaPromise = axios
        .get(`${settings.apis.warehouse}/media`)
        .then((response: AxiosResponse<MediumItem[]>) => {
          commit("setMedia", response.data);
        })
        .catch(error => {
          dispatch("setFetchError", error, { root: true });
        });
      commit("setMediaPromise", mediaPromise);
    }
  }
};
