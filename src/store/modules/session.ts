import axios from "axios";
import * as settings from "@/utils/settings";

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
      // Note that the intercepters apply in the reverse order of which they are
      // added here, and the order is both intentional and important:
      // 1. Dispatch a refresh request if the current token is about to expire.
      // 2. Have the request wait for any existing refresh request (either
      //    dispatched by the first interceptor, or the refreshTokenLoop action)
      //    to resolve before continuing.
      // 3. Add the (potentially refreshed) authorization token for API
      //    requests.

      // Interceptor 3/3: Add JWT token
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

      // Interceptor 2/3: Wait for refresh request
      // Chain all requests when waiting for a refresh request
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

      // Interceptor 1/3: Check expiry
      // If the token is about to expire, trigger an extra refresh request. This
      // will be mostly irrelevant since the token is regularly updated
      // automatically, but it might catch some edge cases, for example if the
      // user suspends the computed with the tab open, or similar.
      axios.interceptors.request.use(config => {
        if (state.refreshRequest) {
          // Refresh request is in progress - no need to check expiry.
          return config;
        }
        // Buffer is the number of seconds before *actual* expiry when the token
        // will be considered expired, to account for clock skew and
        // service-to-service requests delays.
        const buffer = 60;
        const jwt = JSON.parse(atob(state.jwt.jwt.split(".")[1]));
        if (new Date((jwt.exp - buffer) * 1000) <= new Date()) {
          // The token is expired, so dispatch a refresh request. Then let the
          // request proceed - later interceptors will make sure API requests
          // wait for the refresh request to finish, in order to use the renewed
          // token.
          dispatch("refreshToken");
        }
        return config;
      });
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
