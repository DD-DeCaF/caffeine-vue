/**
 * Adapted from vue-analytics/src/bootstrap.js and vue-analytics/src/index.js
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

import Analytics from "analytics";
import { Store } from "vuex";
import { analyticsModelDirective } from "./directives";
import config, { TrackPageConfig, update } from "./config";
import { autoTracking } from "./trackPage";

interface AnalyticsPackageConfig {
  app?: string;
  debug?: boolean;
  reducers?: object;
  version?: string;
}

type AnalyticsConfig = TrackPageConfig &
  AnalyticsPackageConfig & {
    store: Store<object>;
  };

export default function install(Vue, options: AnalyticsConfig) {
  // Set up analytics package
  const analytics = Analytics(options);
  options.store.commit("analytics/setAnalytics", analytics);

  // Set up tracking and directives
  update({ ...options, $vue: Vue });

  Vue.directive("analytics-model", analyticsModelDirective);

  // Start auto tracking
  autoTracking();
}

export { config };
