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
  actions: {}
});
