/**
 * Adapted from vue-analytics/src/directives/ga.js
 */

import config from "./config";
import { DirectiveOptions } from "vue";

/**
 * Directive that calls a function from ./config.commands if element's value
 * changes to truthy
 */
export const analyticsModelDirective: DirectiveOptions = {
  update: function(el, binding, vnode, oldVnode) {
    const value = vnode.data.model.value;
    const oldValue = oldVnode.data.model.value;
    // Directive can have optional modifier "not" which negates the value
    const modifiedValue = binding.modifiers.not ? !value : value;
    if (!modifiedValue || value === oldValue) {
      return;
    }
    const { command, payload } = binding.value;
    let fn = config.commands && config.commands[command];
    if (!fn) {
      throw new Error(
        "[analytics] The value passed to v-analytics-model is not defined " +
          "in the commands list."
      );
    }
    fn.apply(vnode.context, payload);
  }
};
