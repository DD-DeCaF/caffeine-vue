import Analytics from "analytics";
import { capitalize, omitBy, isNil } from "lodash";
import { DirectiveOptions, VNode, VNodeData, VueConstructor } from "vue";
import VueRouter from "vue-router";
import { Store } from "vuex";
import { snakeCasePropertyNames } from "@/utils/utility";

interface AnalyticsPackageConfig {
  app?: string;
  debug?: boolean;
  reducers?: object;
  version?: string;
}

type AnalyticsConfig = AnalyticsPackageConfig & {
  router: VueRouter;
  store: Store<object>;
};

// Router.options and router.history are private properties, so they
// are not on the original type
type Router = VueRouter & {
  options: { base: string };
  history: { ready: boolean };
};

type VNodeWithModel = VNode & {
  data: VNodeData & {
    model: { value: any };
  };
};

/**
 * Directive that dispatches an action in store's analytics module if
 * components's model value changes to truthy
 */
export const analyticsModelDirective: DirectiveOptions = {
  update: function(el, binding, vnode, oldVnode) {
    if (!(vnode as VNodeWithModel).data.model) {
      throw TypeError(
        "analyticsModelDirective used on component without model directive"
      );
    }
    const value = (vnode as VNodeWithModel).data.model.value;
    const oldValue = (oldVnode as VNodeWithModel).data.model.value;
    // Directive can have optional modifier "not" which negates the value
    const modifiedValue = binding.modifiers.not ? !value : value;
    if (!modifiedValue || value === oldValue) {
      return;
    }
    const { command, payload } = binding.value;
    vnode.context!.$store.dispatch(`analytics/${command}`, payload);
  }
};

export default function installAnalytics(
  vue: VueConstructor,
  options: AnalyticsConfig
) {
  const { store, router } = options;
  // Set up analytics package
  const analytics = Analytics(options);
  store.commit("analytics/setAnalytics", analytics);
  // Set up directives
  vue.directive("analytics-model", analyticsModelDirective);
  // Track page on page change
  router.onReady(() => {
    if ((router as Router).history.ready) {
      store.dispatch("analytics/page", {
        page: router.currentRoute.path,
        query: router.currentRoute.query
      });
    }
    router.afterEach((to, from) => {
      if (from.path === to.path) {
        return;
      }
      vue!.nextTick().then(() => {
        store.dispatch("analytics/page", {
          page: router.currentRoute.path,
          query: router.currentRoute.query
        });
      });
    });
  });
}

export function requireConsentPlugin({ store }) {
  const isConsentGiven = async store => {
    await store.state.consents.consentsPromise;
    return store.getters["consents/isConsentAccepted"]({
      type: "cookie",
      category: "statistics"
    });
  };

  return {
    name: "require-consent",
    config: { store },
    initializeStart: async ({ abort, config }) => {
      const consentGiven = await isConsentGiven(config.store);
      if (!consentGiven) {
        return abort(
          "Cancel initialize call because analytics cookie consent not given"
        );
      }
    },
    pageStart: async ({ abort, config }) => {
      const consentGiven = await isConsentGiven(config.store);
      if (!consentGiven) {
        return abort(
          "Cancel page call because analytics cookie consent not given"
        );
      }
    },
    identifyStart: async ({ abort, config }) => {
      const consentGiven = await isConsentGiven(config.store);
      if (!consentGiven) {
        return abort(
          "Cancel identify call because analytics cookie consent not given"
        );
      }
    },
    trackStart: async ({ abort, config }) => {
      const consentGiven = await isConsentGiven(config.store);
      if (!consentGiven) {
        return abort(
          "Cancel track call because analytics cookie consent not given"
        );
      }
    }
  };
}

export function disableAnalyticsPlugin({ store }) {
  const isAnalyticsEnabled = store => store.state.analytics.enableAnalytics;
  return {
    name: "disable-analytics",
    config: { store },
    initializeStart: ({ abort, config }) => {
      if (!isAnalyticsEnabled(config.store)) {
        return abort("Cancel initialize call because analytics is disabled");
      }
    },
    pageStart: ({ abort, config }) => {
      if (!isAnalyticsEnabled(config.store)) {
        return abort("Cancel page call because analytics is disabled");
      }
    },
    identifyStart: ({ abort, config }) => {
      if (!isAnalyticsEnabled(config.store)) {
        return abort("Cancel identify call because analytics is disabled");
      }
    },
    trackStart: ({ abort, config }) => {
      if (!isAnalyticsEnabled(config.store)) {
        return abort("Cancel track call because analytics is disabled");
      }
    }
  };
}

export function processPayloadPlugin(config, plugins) {
  const { store, router } = config;
  const pipelines: { [key: string]: Array<(o: any) => object> } = {
    track: [],
    page: [],
    identify: []
  };

  /**
   * Enrich analytics with common properties
   */
  const enrichPropertiesPipe = payload => {
    const { properties } = payload;
    return {
      ...payload,
      properties: enrichProperties(properties, store, router)
    };

    /**
     * Enrich analytics with common properties
     *
     * @param {Object} payload properties object
     * @param {Store} store Vuex store
     * @return {Object} Enriched properties object
     */
    function enrichProperties(properties, store, router) {
      const { id: projectId = null, name: projectName = null } =
        store.state.projects.activeProject || {};
      const path = router.currentRoute.fullPath;
      const getItem = store.state.analytics.analytics.storage.getItem;
      // Include info provided by originalSourcePlugin
      // originalSource contains info in format x=a|y=b|z=c|...
      const originalSource = (getItem("__user_original_source") || "")
        .split("|")
        .filter(Boolean)
        .reduce((agg, data) => {
          const [key, value] = data.split("=");
          agg[`original${capitalize(key)}`] = value;
          return agg;
        }, {});
      const originalLandingPage = getItem("__user_original_landing_page");
      return {
        ...properties,
        ...originalSource,
        originalLandingPage,
        projectId,
        projectName,
        path,
        url: window.location.href
      };
    }
  };
  pipelines.track.push(enrichPropertiesPipe);
  pipelines.page.push(enrichPropertiesPipe);

  /**
   * Remove properties with null or undefined values from properties/traits
   * objects
   */
  const omitNilPropertiesPipe = payload => {
    const { properties = {}, traits = {} } = payload;
    return {
      ...payload,
      properties: omitBy(properties, isNil),
      traits: omitBy(traits, isNil)
    };
  };
  pipelines.track.push(omitNilPropertiesPipe);
  pipelines.identify.push(omitNilPropertiesPipe);
  pipelines.page.push(omitNilPropertiesPipe);

  /**
   * Format property keys to snake_case
   */
  const snakeCasePropertiesPipe = payload => {
    const { properties = {}, traits = {} } = payload;
    return {
      ...payload,
      properties: snakeCasePropertyNames(properties),
      traits: snakeCasePropertyNames(traits)
    };
  };
  pipelines.track.push(snakeCasePropertiesPipe);
  pipelines.identify.push(snakeCasePropertiesPipe);
  pipelines.page.push(snakeCasePropertiesPipe);

  const processPayloadFactory = pipeline => ({ payload }) =>
    pipeline.reduce((newPayload, pipe) => pipe(newPayload), payload);

  const plugin = {
    name: "process-payload",
    config,
    track: processPayloadFactory(pipelines.track),
    identify: processPayloadFactory(pipelines.identify),
    page: processPayloadFactory(pipelines.page)
  };
  // Scope the enrichment pipeline to specific plugins
  if (plugins) {
    ["track", "identify", "page"].forEach(action => {
      plugins.forEach(pluginName => {
        plugin[`${action}:${pluginName}`] = plugin[action];
      });
      delete plugin[action];
    });
  }
  return plugin;
}
