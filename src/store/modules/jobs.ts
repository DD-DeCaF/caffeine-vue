import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";

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
  aerobic: boolean;
}

export default {
  namespaced: true,
  state: {
    jobs: [],
    isPolling: false,
    jobsPromise: null
  },
  mutations: {
    setJobs(state, jobs: JobItem[]) {
      state.jobs = jobs;
    },
    togglePollingStatus(state) {
      state.isPolling = !state.isPolling;
    },
    setJobsPromise(state, jobsPromise) {
      state.jobsPromise = jobsPromise;
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
      const jobsPromise = axios
        .get(`${settings.apis.metabolicNinja}/predictions`)
        .then((response: AxiosResponse<JobItem[]>) => {
          commit("setJobs", response.data);
        })
        .catch(error => {
          dispatch("setFetchError", error, { root: true });
        })
        .finally(() => {
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
      commit("setJobsPromise", jobsPromise);
    }
  },
  getters: {
    getJobById: state => (id: number) => {
      return state.jobs.find(job => job.id === id);
    }
  }
};
