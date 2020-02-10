/**
 * Adapted from vue-analytics/src/lib/page.js
 *
 * MIT License
 *
 * Copyright (c) 2016-2017 Matteo Gabriele
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
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
  const { page = null, pageviewOnLoad = null } = autoTracking || {};

  if (!page || !router) {
    return;
  }

  router.onReady(() => {
    if (pageviewOnLoad && router.history.ready) {
      trackRoute(router.currentRoute);
    }
    router.afterEach((to, from) => {
      const { skipSamePath = null, shouldRouterUpdate = null } =
        autoTracking || {};

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
  const { transformQueryString = null, prependBase = null } =
    autoTracking || {};

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
