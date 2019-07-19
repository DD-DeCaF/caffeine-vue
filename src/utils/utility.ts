import Vue from "vue";
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
        items = [...store.getters.designs.designs];
        break;
      case "models":
        items = [...store.getters.models.models];
        break;
      case "projects":
        items = [...store.getters.projects.projects];
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

export function sortBy<T>(
  array: T[],
  mapper: (item: T) => any,
  isDescending = false
): T[] {
  let newArray = array.slice();

  newArray.sort((a, b) => {
    const mappedA = mapper(a);
    const mappedB = mapper(b);
    if (mappedA < mappedB) {
      return -1;
    }
    if (mappedA > mappedB) {
      return 1;
    }
    return 0;
  });

  if (isDescending) {
    newArray.reverse();
  }
  return newArray;
}
