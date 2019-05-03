import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/settings";

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
    jobs: [],
    isPolling: false
  },
  mutations: {
    setJobs(state, jobs: JobItem[]) {
      state.jobs = jobs;
    },
    togglePollingStatus(state) {
      state.isPolling = !state.isPolling;
    }
  },
  actions: {
    fetchJobs({ state, commit, dispatch }) {
      if (!state.isPolling) {
        commit("togglePollingStatus");
        dispatch("fetchJobsPolling");
      }
    },
    fetchJobsPolling({ state, commit, dispatch }) {
      axios
        .get(`${settings.apis.metabolicNinja}/predictions`)
        .then((response: AxiosResponse<JobItem[]>) => {
          commit("setJobs", response.data);
        })
        .catch(error => {
          commit("setFetchError", error, { root: true });
        })
        .then(() => {
          if (
            state.jobs.some(job => {
              return job.status === "STARTED" || job.status === "PENDING";
            })
          ) {
            setTimeout(() => {
              dispatch("fetchJobsPolling");
            }, 5000);
          } else {
            commit("togglePollingStatus");
          }
        });
    }
  }
};
