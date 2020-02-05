/**
 * Adapted from vue-analytics.src.lib.page
 */
import store from "@/store";
import config from "./config";
import {
  getQueryString,
  isRouteIgnored,
  isRoute,
  isRouter,
  getBasePath
} from "./helpers";
import { Route } from "vue-router";

export function autoTracking() {
  const { router, autoTracking, $vue } = config;
  const { page, pageviewOnLoad } = autoTracking || {};

  if (!page || !router) {
    return;
  }

  router.onReady(() => {
    if (pageviewOnLoad && router.history.ready) {
      trackRoute(router.currentRoute);
    }
    router.afterEach((to, from) => {
      const { skipSamePath, shouldRouterUpdate } = autoTracking || {};

      // Default behaviour of the router when the `skipSamePath` is turned on.
      // Skip router change when current and previous route have the same path
      // https://github.com/MatteoGabriele/vue-analytics/issues/73
      if (skipSamePath && to.path === from.path) {
        return;
      }
      // Adds a custom way to define when the router should track
      if (
        typeof shouldRouterUpdate === "function" &&
        !shouldRouterUpdate(to, from)
      ) {
        return;
      }
      // see https://github.com/nuxt-community/analytics-module/issues/8
      $vue.nextTick().then(() => {
        trackRoute(router.currentRoute);
      });
    });
  });
}

export function trackRoute(route: Route) {
  if (isRouteIgnored(route)) {
    return;
  }
  const { router, autoTracking } = config;
  const { transformQueryString, prependBase } = autoTracking || {};

  // Get path from route
  const queryString = getQueryString(route.query);
  const base = router && router.options.base;
  const needsBase = prependBase && base;

  let path = route.path + (transformQueryString ? queryString : "");
  path = needsBase ? getBasePath(base, path) : path;

  trackPage(path);
}

export function trackPage(pageOrRouteOrRouter) {
  if (!pageOrRouteOrRouter) {
    return;
  }

  let route;
  if (isRouter(pageOrRouteOrRouter)) {
    route = pageOrRouteOrRouter.currentRoute;
  } else if (isRoute(pageOrRouteOrRouter)) {
    route = pageOrRouteOrRouter;
  }
  if (route) {
    return trackRoute(route);
  }
  // Accept page as a path string `trackPage("/my/path")`
  let page =
    typeof pageOrRouteOrRouter === "object"
      ? pageOrRouteOrRouter.page
      : pageOrRouteOrRouter;

  store.dispatch("analytics/page", { page });
}
