import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";

export interface MediumItem {
  id: number;
  name: string;
  project_id: number;
}

export interface MediumCompound {
  compound_identifier: string;
  compound_name: string; // sodium chloride
  compound_namespace: string; // CHEBI
  id: number;
  mass_concentration: number;
  medium_id: number;
}

export default {
  namespaced: true,
  state: {
    media: [],
    mediaPromise: null,
    _compoundsPromise: null
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
    },
    setCompoundsPromise(state, compoundsPromise) {
      state._compoundsPromise = compoundsPromise;
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
    },

    /**
     * Because getting all compounds takes a few seconds they are only fetched
     * once - on first demand. To ensure correct usage, they should only be
     * accessed through fetchCachedCompounds.
     */
    fetchCachedCompounds({ commit, dispatch, state }) {
      if (state._compoundsPromise) {
        return state._compoundsPromise;
      }

      const compoundsPromise = axios
        .get<MediumCompound[]>(`${settings.apis.warehouse}/media/compounds`)
        .then(response => response.data.slice(0, 100))
        .catch(error => {
          dispatch("setFetchError", error, { root: true });
          throw error;
        });
      commit("setCompoundsPromise", compoundsPromise);
      return compoundsPromise;
    }
  }
};