import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import { vuexStoreModule } from "@/store/vuexStoreModule";

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

export interface MediaState {
  media: MediumItem[];
  mediaPromise: Promise<void> | null;
  _compoundsPromise: Promise<MediumCompound[]> | null;
}

export default vuexStoreModule({
  namespaced: true,
  state: {
    media: [] as MediumItem[],
    compounds: [] as MediumCompound[],
    mediaPromise: null as Promise<void> | null,
    compoundsPromise: null as Promise<MediumCompound[]> | null
  },
  mutations: {
    setMedia(state, media: MediumItem[]) {
      state.media = media;
    },
    addMedium(state, medium: MediumItem) {
      state.media.push(medium);
    },
    editMedium(state, payload: any) {
      Vue.set(state.media, payload.index, payload.item);
    },
    delete(state, ids) {
      state.media = state.media.filter(medium => !ids.includes(medium.id));
    },
    setCompounds(state, compounds: MediumCompound[]) {
      state.compounds = compounds;
    },
    addCompound(state, compound: MediumCompound) {
      state.compounds.push(compound);
    },
    setMediaPromise(state, mediaPromise) {
      state.mediaPromise = mediaPromise;
    },
    setCompoundsPromise(state, compoundsPromise) {
      state.compoundsPromise = compoundsPromise;
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
    fetchMediaCompounds({ commit, dispatch }) {
      const compoundsPromise = axios
        .get(`${settings.apis.warehouse}/media/compounds`)
        .then((response: AxiosResponse<MediumCompound[]>) => {
          commit("setCompounds", response.data);
        })
        .catch(error => {
          dispatch("setFetchError", error, { root: true });
          throw error;
        });
      commit("setCompoundsPromise", compoundsPromise);
    }
  }
});
