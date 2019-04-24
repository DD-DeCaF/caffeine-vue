import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";

export interface JobItem {
  id: number;
  created: string;
  max_predictions: number;
  organism_id: number;
  product_name: string;
  project_id: number;
  status: string;
  updated: string;
  model_id: number;
}

export default {
  namespaced: true,
  state: {
    jobs: []
  },
  mutations: {
    setJobs (state, jobs: JobItem[]) {
      state.jobs = jobs;
    }
  },
  actions: {
    fetchJobs({ commit }) {
      axios
        .get(`${settings.apis.metabolicNinja}/predictions`)
        .then((response: AxiosResponse<JobItem[]>) => {
          commit("setJobs", response.data);
        })
        .catch(error => {
          commit("setFetchError", error);
        });
    }
  }
};
