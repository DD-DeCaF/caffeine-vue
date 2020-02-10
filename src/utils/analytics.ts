export function requireConsentPlugin({ store }) {
  return {
    name: "require-consent",
    config: { store },
    initializeStart: ({ abort, config }) => {
      if (!isConsentGiven(config.store)) {
        return abort(
          "Cancel initialize call because analytics cookie consent not given"
        );
      }
    },
    pageStart: ({ abort, config }) => {
      if (!isConsentGiven(config.store)) {
        return abort(
          "Cancel page call because analytics cookie consent not given"
        );
      }
    },
    identifyStart: ({ abort, config }) => {
      if (!isConsentGiven(config.store)) {
        return abort(
          "Cancel identify call because analytics cookie consent not given"
        );
      }
    },
    trackStart: ({ abort, config }) => {
      if (!isConsentGiven(config.store)) {
        return abort(
          "Cancel track call because analytics cookie consent not given"
        );
      }
    }
  };

  function isConsentGiven(store) {
    return store.getters["consents/isConsentAccepted"]({
      type: "cookie",
      category: "analytics"
    });
  }
}

export function disableAnalyticsPlugin({ store }) {
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

  function isAnalyticsEnabled(store) {
    return store.state.analytics.enableAnalytics;
  }
}

/**
 * Enrich data with common properties
 * @param {object} options
 * @param {Store} options.store
 * @param {Router} options.router
 */
export function enrichAnalyticsPlugin({ store, router }) {
  /**
   * Enrich analytics payload with common properties
   *
   * @param {Object} payload Payload object
   * @param {Store} store Vuex store
   * @return {Object} Enriched payload object
   */
  function enrichProperties(properties, store, router) {
    const { id: projectId = null, name: projectName = null } =
      store.state.projects.activeProject || {};
    const route = router.currentRoute;
    return {
      ...properties,
      projectId,
      projectName,
      url: window.location.href,
      path: route.fullPath
    };
  }

  const enrichAnalyticsFactory = makePayloadPropertyModifierFactory(
    "enrich-analytics",
    (obj, { config }) => enrichProperties(obj, config.store, config.router)
  );

  return {
    name: "enrich-analytics",
    config: { store, router },
    track: enrichAnalyticsFactory("properties"),
    page: enrichAnalyticsFactory("properties")
  };
}

export function chainPlugins(plugins: any[]) {
  if (!plugins) {
    throw TypeError("chainPlugin requires a list of plugins.");
  }
  const chainedPlugins = plugins
    .map((plugin, index, arr) => {
      const isLastPlugin = index === arr.length - 1;
      if (isLastPlugin) {
        return plugin;
      }
      const nextPlugin = arr[index + 1];
      return namespacePluginHooks(plugin, nextPlugin.name);
    })
    // Flatten results from namespacePluginHooks
    .reduce((acc, val) => acc.concat(val), []);
  return chainedPlugins;
}

function namespacePluginHooks(
  plugins: object | object[],
  namespaces: string | string[],
  hooks?: string | string[]
) {
  if (!plugins) {
    throw TypeError(
      "makeChainedPlugin requires a single or a list of plugins."
    );
  }
  const pluginsArr = Array.isArray(plugins) ? plugins : [plugins];
  if (!namespaces) {
    throw TypeError(
      "makeChainedPlugin requires a single string or a list of strings as " +
        "namespaces."
    );
  }
  const namespaceArr = Array.isArray(namespaces) ? namespaces : [namespaces];
  const hooks_ = hooks ? hooks : ["track", "identify", "page"];
  const hooksArr = Array.isArray(hooks_) ? hooks_ : [hooks_];
  // For each plugin, make a namespaced copy of each hook for each namespace
  // So for namespaces ["ga", "hubspot"], and hooks ["track", "page"],
  // assigns these namespaced hooks to the current plugin:
  // ["track:ga", "track:hubspot", "page:ga", "page:hubspot"]
  return pluginsArr.map(plugin => {
    const namespacedPlugin = namespaceArr.reduce((nsPluginOuter, namespace) => {
      return hooksArr.reduce((nsPluginInner, hook) => {
        const namespacedKey = `${hook}:${namespace}`;
        nsPluginInner[namespacedKey] = plugin[hook];
        return nsPluginInner;
      }, nsPluginOuter);
    }, {});
    return {
      ...plugin,
      ...namespacedPlugin
    };
  });
}

/**
 * Factory decorator for creating plugin hook functions that modify specific
 * only specific properties of the payload.
 * @param {Function} fn function that accepts value of a payload property and
 *                      context, and returns the modified part of the payload
 * @returns factory function that accepts payload key(s) (string or list
 *          of strings) and returns a plugin hook function that modifies only
 *          those properties on the payload object
 */
function makePayloadPropertyModifierFactory(
  name,
  fn: (value: any, ctx: object) => any
) {
  function payloadPropertyModifierFactory(payloadKeys: string | string[]) {
    if (!payloadKeys) {
      throw TypeError(
        "payloadPropertyModifierFactory requires a single string or a list " +
          "of strings."
      );
    }
    const keys = Array.isArray(payloadKeys) ? payloadKeys : [payloadKeys];
    function pluginHookWrapper({ payload = {}, plugins = {} }) {
      // TEMPFIX: In namespaced hooks, we don't have access to the own plugin's
      // config object, so we pass current plugin along to make up for that
      // see https://github.com/DavidWells/analytics/issues/25
      const plugin = plugins[name];
      const args = arguments;
      const modifiedPayload = keys.reduce((tempPayload, key) => {
        return {
          ...tempPayload,
          ...{ [key]: fn.call(null, tempPayload[key], plugin, ...args) }
        };
      }, payload);
      return modifiedPayload;
    }
    return pluginHookWrapper;
  }
  return payloadPropertyModifierFactory;
}
