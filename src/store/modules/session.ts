import axios from "axios";
import * as settings from "@/settings";

export interface JWT {
  jwt: string;
  refresh_token: {
    exp: number;
    val: string;
  };
}

export default {
  namespaced: true,
  state: {
    isAuthenticated: false,
    jwt: null,
    refreshError: null,
    // While a token refresh request is in progress, the following variable will
    // be set to its promise.
    refreshRequest: null
  },
  mutations: {
    login(state, jwt: JWT) {
      state.isAuthenticated = true;
      state.jwt = jwt;
      localStorage.setItem("jwt", JSON.stringify(state.jwt));
    },
    updateToken(state, jwt: string) {
      state.jwt.jwt = jwt;
      localStorage.setItem("jwt", JSON.stringify(state.jwt));
    },
    setRefreshError(state, error) {
      state.refreshError = error;
    },
    setRefreshRequest(state, refreshRequest) {
      state.refreshRequest = refreshRequest;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.jwt = null;
      localStorage.removeItem("jwt");
    }
  },
  actions: {
    interceptRequests({ commit, dispatch, state }) {
      // Add authorization header to requests for trusted urls.
      axios.interceptors.request.use(config => {
        // If not authenticated, there's no token to add.
        if (!state.isAuthenticated) {
          return config;
        }

        // If the request is not going to a trusted url, don't add the token.
        if (!settings.trustedURLs.some(url => config.url!.startsWith(url))) {
          return config;
        }

        // Don't send a potentially expired JWT when refreshing the token.
        if (config.url === `${settings.apis.iam}/refresh`) {
          return config;
        }

        // The request needs a token, so add the authorization header.
        config.headers.Authorization = `Bearer ${state.jwt.jwt}`;
        return config;
      });

      // Chain all requests when waiting for a refresh request
      // NOTE: This interceptor must be applied *after* the token interceptor
      // above to make sure that the *refreshed* token is picked up when the
      // request continues.
      axios.interceptors.request.use(
        config =>
          new Promise((resolve, reject) => {
            // Ignore the token refresh request itself
            if (config.url === `${settings.apis.iam}/refresh`) {
              resolve(config);
              return;
            }

            if (state.refreshRequest !== null) {
              // Refresh request is in progress - wait for it to complete first.
              state.refreshRequest.then(response => {
                resolve(config);
              });
            } else {
              // No refresh request in progress - go ahead with the original
              // request.
              resolve(config);
            }
          })
      );
    },
    refreshTokenLoop({ dispatch }) {
      dispatch("refreshToken");
      setTimeout(() => {
        dispatch("refreshTokenLoop");
      }, 9 * 60 * 1000);
    },
    refreshToken({ dispatch, commit, state }) {
      if (state.isAuthenticated) {
        const params = { refresh_token: state.jwt.refresh_token.val };
        const refreshRequest = axios
          .post(`${settings.apis.iam}/refresh`, params)
          .then(response => {
            commit("updateToken", response.data.jwt);
          })
          .catch(error => {
            commit("logout");
            commit("setRefreshError", error);
            dispatch("fetchAllData", null, { root: true });
          })
          .then(response => {
            commit("setRefreshRequest", null);
          });
        commit("setRefreshRequest", refreshRequest);
      }
    }
  }
};
