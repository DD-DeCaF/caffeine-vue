import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import { hashMessage } from "@/utils/utility";
import { RootState } from "@/types/vuex";
import { vuexStoreModule } from "@/store/vuexStoreModule";
import store from "..";

/**
 * Response to GET request on iam/user endpoint
 */
interface IAMUser {
  email: string;
  first_name: string;
  id: number;
  last_name: string;
}

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

export interface Hotjar {
  // NOTE: Define additional properties once needed
  optOut: boolean;
}

export interface AnalyticsState {
  enableAnalytics: boolean;
  enableHotjar: boolean;
  analytics: Analytics | null;
  hotjar: Hotjar | null;
  lastEscherSearch: string | null;
}

export default vuexStoreModule({
  namespaced: true,
  state: {
    enableAnalytics: settings.enableAnalytics,
    enableHotjar: settings.enableHotjar,
    analytics: null,
    hotjar: null,
    lastEscherSearch: null
  } as AnalyticsState,
  mutations: {
    setEnableAnalytics(state, enabled) {
      state.enableAnalytics = enabled;
    },
    setEnableHotjar(state, enabled) {
      state.enableHotjar = enabled;
    },
    setAnalytics(state, analytics: Analytics) {
      state.analytics = analytics;
    },
    setHotjar(state, hotjar: Hotjar) {
      state.hotjar = hotjar;
    },
    setHotjarOptOut(state, optOut) {
      if (state.hotjar) {
        state.hotjar!.optOut = optOut;
      }
    },
    setLastEscherSearch(state, query) {
      state.lastEscherSearch = query;
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
          .then((response: AxiosResponse<IAMUser>) => {
            dispatch("login", response.data);
          })
          .catch(error => null);
        unsubscribe();
      });
    },
    logout({ state }) {
      state.analytics!.reset();
    },
    async identifyUser({ state }, payload) {
      const id = await hashMessage(payload.registeredEmail, "SHA-256");
      state.analytics!.identify(id, {
        ...payload,
        registeredEmail: undefined
      });
    },
    updateUser({ state }, payload) {
      state.analytics!.identify(null, payload);
    },
    page({ state }, payload) {
      state.analytics!.page(payload);
    },
    trackDialog({ state }, payload) {
      state.analytics!.track("dialog", payload);
    },
    link({ state }, payload) {
      state.analytics!.track("outbound_link", payload);
    },
    export({ state }, payload) {
      state.analytics!.track("export", payload);
    },
    visualize({ state }, payload) {
      // Destructure nullable properties
      const { project = {}, model = {}, map = {}, card = {} } = payload;
      const {
        method = null,
        showProteomicsData = null,
        type = null,
        uuid: cardId = null,
        name: cardName = null,
        organism = {},
        sample = {},
        experiment = {},
        conditionData = {},
        objective: {
          reaction: objectiveReaction = {},
          maximize: isObjectiveMaximize = null
        } = {}
      } = card || {};
      const { id: projectId = null, name: projectName = null } = project || {};
      const { id: modelId = null, name: modelName = null } = model || {};
      const { id: organismId = null, name: organismName = null } =
        organism || {};
      const { id: sampleId = null } = sample || {};
      const { id: experimentId = null, name: experimentName = null } =
        experiment || {};
      const {
        id: conditionId = null,
        name: conditionName = null,
        medium = {},
        strain = {}
      } = conditionData || {};
      const { id: objectiveId = null, name: objectiveName = null } =
        objectiveReaction || {};

      const data = {
        projectId,
        projectName,
        cardName,
        cardId,
        method,
        type,
        modelId,
        modelName,
        organismId,
        organismName,
        experimentId,
        experimentName,
        conditionId,
        conditionName,
        sampleId,
        objectiveName,
        objectiveId,
        objectiveDirection: isObjectiveMaximize ? "max" : "min",
        visualizationType: showProteomicsData ? "proteomics" : "flux",
        // modifications: card.manipulations, // Do not track modifications
        mapId: map.id,
        mapName: map.name,
        mediumId: medium.id,
        mediumName: medium.name,
        strainId: strain.id,
        strainName: strain.name,
        source: payload.source,
        sourceType: payload.sourceType,
        sourceId: payload.sourceId
      };
      state.analytics!.track("visualize", data);
    },
    sendToVisualize({ state }, payload) {
      state.analytics!.track("send_to_visualize", payload);
    },
    searchEscher({ commit, state }, payload) {
      const { searchItem, results } = payload;
      // Track searched query only after 2 secs to avoid tracking every
      // keystroke
      commit("setLastEscherSearch", searchItem);
      setTimeout(() => {
        if (state.lastEscherSearch !== searchItem) {
          return;
        }
        state.analytics!.track("search_escher", {
          searchItem,
          resultsCount: results.length
        });
      }, 2000);
    },
    loadHotjar({ commit, getters }) {
      if (getters.hotjarAllowed) {
        // Hotjar installation script modified to take ID and snippet version
        // from settings.
        (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
          h.hj =
            h.hj ||
            function() {
              (h.hj.q = h.hj.q || []).push(arguments);
            };
          h._hjSettings = {
            // NOTE: Our modification start
            hjid: settings.hotjarID,
            hjsv: settings.hotjarSnippetVersion
            // NOTE: Our modification end
          };
          a = o.getElementsByTagName("head")[0];
          r = o.createElement("script");
          r.async = 1;
          r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
          a.appendChild(r);
        })(window, document, "https://static.hotjar.com/c/hotjar-", ".js?sv=");
      } // Hotjar installation script end
      commit("setHotjar", (window as any).hj);

      // Enabling/Disabling Hotjar is done via Hotjar's `optOut` property
      store.watch(
        () =>
          this.getters["analytics/hotjarAllowed"] &&
          this.getters["consents/isConsentAccepted"]({
            type: "cookie",
            category: "statistics"
          }),
        canOptIn => commit("setHotjarOptOut", !canOptIn)
      );
    }
  },
  getters: {
    hotjarAllowed: state => state.enableAnalytics && state.enableHotjar
  }
});
