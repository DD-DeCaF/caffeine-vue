import { capitalize, omitBy, isNil } from "lodash";
import { snakeCasePropertyNames } from "./utility";

export function requireConsentPlugin({ store }) {
  async function isConsentGiven(store) {
    await store.state.consents.consentsPromise;
    return store.getters["consents/isConsentAccepted"]({
      type: "cookie",
      category: "statistics"
    });
  }

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
    const path = router.currentRoute.fullPath;
    const getItem = store.state.analytics.analytics.storage.getItem;
    // originalSource contains info in format x=a|y=b|z=c|...
    const originalSource = getItem("__user_original_source")
      .split("|")
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

  const enrichAnalyticsFactory = makePayloadPropertyMutatorFactory({
    name: "enrich-analytics",
    mutator: (obj, config) => enrichProperties(obj, config.store, config.router)
  });

  return {
    name: "enrich-analytics",
    config: { store, router },
    track: enrichAnalyticsFactory("properties"),
    page: enrichAnalyticsFactory("properties")
  };
}

/**
 * Remove properties with null or undefined values from properties/traits
 * objects
 */
export function dropNoValuePropertiesPlugin() {
  const omitNilPropertiesFactory = makePayloadPropertyMutatorFactory({
    mutator: obj => omitBy(obj, isNil)
  });

  return {
    name: "drop-no-value-properties",
    track: omitNilPropertiesFactory("properties"),
    identify: omitNilPropertiesFactory("traits"),
    page: omitNilPropertiesFactory("properties")
  };
}

/**
 * Format property keys to snakecase
 */
export function snakecasePropertiesPlugin() {
  const snakeCasePayloadFactory = makePayloadPropertyMutatorFactory({
    mutator: obj => snakeCasePropertyNames(obj)
  });
  return {
    name: "snakecase-properties",
    track: snakeCasePayloadFactory("properties"),
    identify: snakeCasePayloadFactory("traits"),
    page: snakeCasePayloadFactory("properties")
  };
}

/**
 * Print out payload for debugging
 */
export function printPayloadPlugin() {
  function printPayload({ payload }) {
    console.log(payload);
    return payload;
  }
  return {
    name: "print-payload",
    track: printPayload,
    identify: printPayload,
    page: printPayload
  };
}

export function namespacePluginHooks(
  plugins: object | object[],
  namespaces: string | string[],
  hooks?: string | string[]
) {
  if (!plugins) {
    throw TypeError(
      "namespacePluginHooks requires a single or a list of plugins."
    );
  }
  const pluginsArr = Array.isArray(plugins) ? plugins : [plugins];
  if (!namespaces) {
    throw TypeError(
      "namespacePluginHooks requires a single string or a list of strings as " +
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
 * Compose multiple plugins into a single plugin object
 * whose hooks call underlying plugins' respective hooks sequentially,
 * compounding the modifications to the payload object.
 * @param {object} options Options object
 * @param {string} options.name Name of the newly-composed plugin.
 * @param {object[]} options.plugins List of plugin objects that should be
 *                                   combined together.
 */
export function composePlugins(options: { name: string; plugins: any[] }) {
  const { name, plugins } = options;
  if (!plugins) {
    throw TypeError("composePlugin requires a list of plugins.");
  }
  // Chain plugin hooks from inside out, so that the outer (upstream) hook
  // first processes the payload, and then passes the augmented value to the
  // inner (downstream) hook
  const compositePlugin = [...plugins]
    .reverse()
    .reduce((aggPlugin, upstreamPlugin) => {
      Object.keys(upstreamPlugin)
        .filter(key => key !== "name" && key !== "config")
        .forEach(key => {
          if (!aggPlugin[key]) {
            aggPlugin[key] = ({ payload }) => payload;
          }
          aggPlugin[key] = chainHooks(
            upstreamPlugin[key],
            aggPlugin[key],
            upstreamPlugin.config
          );
        });
      return aggPlugin;
    }, {});
  compositePlugin.name = name;
  return compositePlugin;
}

/**
 * Given two analytics plugin hook functions, returns a function which wraps
 * them such that the arguments are first passed to the first function, which
 * returns the updated payload, and the arguments along with the updated
 * payload are passed to the second function.
 * @param {Function} upstreamFn Hook that will be called first
 * @param {Function} downstreamFn Hook that will be called with payload
 *                                property updated from upstreamFn
 * @param {Object} config Config that should be passed to the upstream hook.
 *                        Defaults to the config of the plugin that was first
 *                        triggered by the event.
 */
function chainHooks(upstreamFn, downstreamFn, config = null) {
  function fnInner(eventCtx, ...args) {
    const currEventCtx = {
      ...eventCtx,
      config: config || eventCtx.config
    };
    const updatedEventCtx = {
      ...eventCtx,
      payload: upstreamFn.call(null, currEventCtx, ...args)
    };
    return downstreamFn.call(null, updatedEventCtx, ...args);
  }
  return fnInner;
}

/**
 * Factory decorator for creating plugin hook functions that modify only
 * specific properties of the payload.
 * @param {object} options Options object
 * @param {Function} options.fn function that accepts value of a payload property and
 *                      context, and returns the modified part of the payload
 * @param {string} options.name Name of the plugin the generated functions
 *                              relate to. Optional. Required to access
 *                              original plugin's config in namescaped hooks.
 * @returns factory function that accepts payload key(s) (string or list
 *          of strings) and returns a plugin hook function that modifies only
 *          those properties on the payload object
 */
function makePayloadPropertyMutatorFactory(options: {
  name?: string;
  mutator: (value: any, ctx: { [key: string]: any }, ...args) => any;
}) {
  const { name = "", mutator } = options;
  function payloadPropertyMutatorFactory(payloadKeys: string | string[]) {
    if (!payloadKeys) {
      throw TypeError(
        "payloadPropertyMutatorFactory requires a single string or a list " +
          "of strings."
      );
    }
    const keys = Array.isArray(payloadKeys) ? payloadKeys : [payloadKeys];
    async function pluginHookWrapper(hookContext, ...args) {
      const { config = {}, payload = {}, plugins = {} } = hookContext || {};
      // TEMPFIX: In namespaced hooks, we don't have access to the own plugin's
      // config object, so we pass current plugin along to make up for that
      // see https://github.com/DavidWells/analytics/issues/25
      const args_ = [hookContext, ...args];
      const modifiedPayload = await keys.reduce(async (tempPayload, key) => {
        const currConfig = key.includes(":") ? plugins[name].config : config;
        return {
          ...tempPayload,
          [key]: await mutator(tempPayload[key], currConfig, ...args_)
        };
      }, await payload);
      return modifiedPayload;
    }
    return pluginHookWrapper;
  }
  return payloadPropertyMutatorFactory;
}

/**
 * Hash message into a fixed-size output - based on the given SHA algorithm -
 * transformed to a hex string.
 *
 * For further details, see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#Examples
 *
 * @param {string} message String message
 *
 * @param {string} algorithm Algorithm used to digest the message.
 *      For full list of supported algorithms, see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#Supported_algorithms.
 *
 * @returns {string} Hashed hex string of the original message
 *
 * @example
 * await hashMessage("hello world") // "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
 */
export async function hashMessage(message, algorithm) {
  // encode as (utf-8) Uint8Array
  const msgUint8 = new TextEncoder().encode(message);
  // hash the message
  const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8);
  // convert buffer to byte array
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // convert bytes to hex string
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
