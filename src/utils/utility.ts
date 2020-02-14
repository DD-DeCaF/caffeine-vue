import * as Sentry from "@sentry/browser";
import moment from "moment";
import { snakeCase, camelCase } from "lodash";
import store from "../store";

function validator(value: string) {
  return ["organisms", "maps", "models", "projects"].includes(value);
}

export function partitionedList(contentType, separatorType) {
  let idKey = "";
  let items: any[] = [];
  let getter = "";
  if (validator(contentType) && validator(separatorType)) {
    switch (contentType) {
      case "organisms":
        items = [...store.getters["organisms/getOrganisms"]];
        break;
      case "models":
        items = [...store.getters["models/getModels"]];
        break;
      case "projects":
        items = [...store.getters["projects/getProjects"]];
        break;
      case "maps":
        items = [...store.getters["maps/getMaps"]];
        break;
    }
    switch (separatorType) {
      case "organisms":
        idKey = "organism_id";
        getter = "organisms/getOrganismById";
        break;
      case "models":
        idKey = "model_id";
        getter = "models/getModelById";
        break;
      case "projects":
        idKey = "project_id";
        getter = "projects/getProjectById";
        break;
      case "maps":
        idKey = "map_id";
        getter = "maps/getMapById";
        break;
    }
  } else {
    throw "Either " + contentType + " or " + separatorType + " does not exist!";
  }

  // Sort items by separator name, then item name
  items.sort((item1, item2) => {
    if (item1[idKey] !== item2[idKey]) {
      const separator1 = store.getters[getter](item1[idKey]);
      const separator1Name = separator1
        ? separator1.name
        : "Unknown " + separatorType.slice(0, -1);
      const separator2 = store.getters[getter](item2[idKey]);
      const separator2Name = separator2
        ? separator2.name
        : "Unknown " + separatorType.slice(0, -1);
      return separator1Name.localeCompare(separator2Name);
    } else {
      return item1.name.localeCompare(item2.name);
    }
  });

  // Build a data structure for the v-select, grouping items by separators with
  // dividers and headers.
  const itemsWithHeaders: object[] = [];
  let previousSeparatorId = null;
  items.forEach(item => {
    if (item[idKey] !== previousSeparatorId) {
      if (itemsWithHeaders.length !== 0) {
        itemsWithHeaders.push({ divider: true });
      }
      const separator = store.getters[getter](item[idKey]);
      const separatorName = separator
        ? separator.name
        : "Unknown " + separatorType.slice(0, -1);
      itemsWithHeaders.push({ header: separatorName });
    }
    itemsWithHeaders.push(item);
    previousSeparatorId = item[idKey];
  });
  return itemsWithHeaders;
}

export function mapPropertyNames(obj, fn: Function) {
  return Object.keys(obj).reduce((agg, key) => {
    agg[fn(key)] = obj[key];
    return agg;
  }, {});
}

export function snakeCasePropertyNames(obj) {
  return mapPropertyNames(obj, snakeCase);
}

export function camelCasePropertyNames(obj) {
  return mapPropertyNames(obj, camelCase);
}

export function toISOFormat(datetime) {
  return moment(datetime).format("YYYY-MM-DDTHH:mm:ss.SSSSSZ");
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
