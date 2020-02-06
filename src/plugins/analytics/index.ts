/**
 * Adapted from vue-analytics.src.index
 * and vue-analytics.src.bootstrap
 */
import Analytics from "analytics";
import { Store } from "vuex";
import { analyticsModelDirective } from "./directives";
import config, { TrackPageConfig, update } from "./config";
import { autoTracking } from "./trackPage";

interface AnalyticsConfig extends TrackPageConfig {
  store: Store<object>;
}

export default function install(Vue, options: AnalyticsConfig) {
  // Set up analytics package
  const analytics = Analytics(options);
  options.store.commit("analytics/setAnalytics", analytics);

  // Set up tracking and directives
  update({ ...options, $vue: Vue });

  Vue.directive("analytics-model", analyticsModelDirective);

  if (!Vue.prototype.$analytics) {
    Vue.prototype.$analytics = {};
  }
  Vue.prototype.$analytics.commands = config.commands;

  // Start auto tracking
  autoTracking();
}

export { config };
