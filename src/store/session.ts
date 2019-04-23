import Vue from "vue";
import Vuex from "vuex";

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
    jwt: null
  },
  mutations: {
    login(state, jwt: JWT) {
      state.isAuthenticated = true;
      state.jwt = jwt;
      localStorage.setItem("jwt", JSON.stringify(jwt));
    },
    logout(state) {
      state.isAuthenticated = false;
      state.jwt = null;
      localStorage.removeItem("jwt");
    },
    recover(state) {
      if (localStorage.getItem("jwt") !== null) {
        state.isAuthenticated = true;
        state.jwt = JSON.parse(localStorage.getItem("jwt"));
      }
    }
  },
  actions: {}
};
