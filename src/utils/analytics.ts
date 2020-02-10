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
