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

export interface Compound {
  id: number;
  name: string; // sodium chloride
  reference: string; // CHEBI:26710
  namespace_id: number; // CHEBI
  type_id: number; // compound

  project_id: number;
  created: string;
  updated: string;
}

export interface NewMediumCompound {
  id: number;
  mass_concentration: number;
}

export interface MediumCompound extends NewMediumCompound, Compound {}

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
        .get<Compound[]>(`${settings.apis.warehouse}/bioentities/compounds`)
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
