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
    },
    link({ state }, payload) {
      state.analytics!.track("outbound_link", payload);
    },
    visualize({ state }, payload) {
      // destructure nullable properties
      const { project = {}, model = {}, map = {}, card = {} } = payload;
      const {
        method,
        showProteomicsData,
        type,
        uuid: cardId,
        name: cardName,
        organism = {},
        sample = {},
        experiment = {},
        conditionData = {},
        objective: {
          reaction: objectiveReaction = {},
          maximize: isObjectiveMaximize = null
        } = {}
      } = card || {};
      const { id: projectId, name: projectName } = project || {};
      const { id: modelId, name: modelName } = model || {};
      const { id: organismId, name: organismName } = organism || {};
      const { id: sampleId } = sample || {};
      const { id: experimentId, name: experimentName } = experiment || {};
      const { id: conditionId, name: conditionName, medium = {}, strain = {} } =
        conditionData || {};
      const { id: objectiveId, name: objectiveName } = objectiveReaction || {};

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
    }
  }
});
