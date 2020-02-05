/**
 * Adapted from vue-analytics.src.helpers
 */
import config from "./config";
import { Route } from "vue-router";

export function getBasePath(base: string, path: string) {
  const pathAsArray = path.split("/");
  const baseAsArray = base.split("/");
  if (pathAsArray[0] === "" && base[base.length - 1] === "/") {
    pathAsArray.shift();
  }
  return baseAsArray.join("/") + pathAsArray.join("/");
}

export function merge(obj: object, src: object) {
  Object.keys(src).forEach(key => {
    const type = obj[key] && Object.prototype.toString.call(obj[key]);

    if (type === "[object Object]" || type === "[object Array]") {
      merge(obj[key], src[key]);
      return;
    }
    obj[key] = src[key];
  });
  return obj;
}

export function getQueryString(queryMap: {
  [key: string]: string | (string | null)[];
}) {
  const queryString = Object.keys(queryMap).reduce(
    (string, key, index, keys) => {
      const isLastKey = index === keys.length - 1;
      const value = queryMap[key];
      if (value == null) {
        return string;
      }
      string += `${key}=${value}${isLastKey ? "" : "&"}`;
      return string;
    },
    ""
  );
  return queryString !== "" ? `?${queryString}` : "";
}

export function isRouteIgnored({ name, path }: Route) {
  if (!config.ignoreRoutes) {
    return false;
  }
  return [name, path]
    .filter(Boolean)
    .find(value => config.ignoreRoutes!.includes(value as string));
}

export function isRoute(data: any) {
  return data.query && data.params;
}

export function isRouter(data: any) {
  return data.currentRoute;
}
