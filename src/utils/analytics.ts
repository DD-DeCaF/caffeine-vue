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
