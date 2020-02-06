/**
 * Adapted from vue-analytics/src/helpers.js
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
