import { vuexStoreModule } from "@/store/vuexStoreModule";

/**
 * Analytics class from https://github.com/DavidWells/analytics
 */
export interface Analytics {
  identify: Function;
  track: Function;
  page: Function;
  user: Function;
  reset: Function;
  ready: Function;
  on: Function;
  once: Function;
  getState: Function;
  enablePlugin: Function;
  disablePlugin: Function;
  storage: {
    getItem: Function;
    setItem: Function;
    removeItem: Function;
  };
}

export interface AnalyticsState {
  analytics: Analytics | null;
}

export default vuexStoreModule({
  namespaced: true,
  state: {
    analytics: null
  } as AnalyticsState,
  mutations: {
    setAnalytics(state, analytics: Analytics) {
      state.analytics = analytics;
    }
  },
  actions: {
    login({ state }, payload) {
      state.analytics!.track("login", payload);
    },
    loginLocalStorage({ dispatch, rootState }) {
      // Make an API call to get user's data to handle the edge case of when
      // the user has already been logged in before web analytics were set up
      let unsubscribe = store.subscribe((mutation, state) => {
        if (!(rootState as RootState).session.isAuthenticated) {
          return;
        }
        axios
          .get(`${settings.apis.iam}/user`)
          .then((response: AxiosResponse<AIMUser>) => {
            dispatch("login", response.data);
          })
          .catch(error => null);
        unsubscribe();
      });
    },
    logout({ state }) {
      state.analytics!.reset();
    },
    identifyUser({ state }, payload) {
      state.analytics!.identify(payload.registeredEmail, {
        ...payload,
        registeredEmail: undefined
      });
    },
    updateUser({ state }, payload) {
      state.analytics!.identify(null, payload);
    }
  }
});
