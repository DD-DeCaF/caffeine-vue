import axios from "axios";
import settings from "@/settings";

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
    refreshError: null
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
    logout(state) {
      state.isAuthenticated = false;
      state.jwt = null;
      localStorage.removeItem("jwt");
    }
  },
  actions: {
    refreshToken({ commit, dispatch, state }) {
      setTimeout(() => {
        if (state.isAuthenticated) {
          const params = { refresh_token: state.jwt.refresh_token.val };
          axios
            .post(`${settings.apis.iam}/refresh`, params)
            .then(response => {
              commit("updateToken", response.data.jwt);
            })
            .catch(error => {
              commit("logout");
              commit("setRefreshError", error);
            });
        }
        dispatch("refreshToken");
      }, 9 * 60 * 1000);
    }
  }
};
