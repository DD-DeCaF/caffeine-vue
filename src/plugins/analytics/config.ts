/**
 * Adapted from vue-analytics.src.config
 */
import Vue from "vue";
import VueRouter from "vue-router";
import { merge } from "./helpers";

export interface TrackPageConfig {
  $vue: Vue | null;
  router: VueRouter | null;
  ignoreRoutes?: string[];
  commands?: {
    [key: string]: Function;
  };
  autoTracking?: {
    shouldRouterUpdate?: Function | null;
    skipSamePath?: Boolean;
    page?: Boolean;
    transformQueryString?: Boolean;
    pageviewOnLoad?: Boolean;
    prependBase?: Boolean;
  };
}

const defaultConfig: TrackPageConfig = {
  $vue: null,
  router: null,
  ignoreRoutes: [],
  commands: {},

  autoTracking: {
    shouldRouterUpdate: null,
    skipSamePath: false,
    page: true,
    transformQueryString: true,
    pageviewOnLoad: true,
    prependBase: true
  }
};

let config = { ...defaultConfig };

export function update(params) {
  merge(config, params);
}

export function reset() {
  config = { ...defaultConfig };
}

export default config;
