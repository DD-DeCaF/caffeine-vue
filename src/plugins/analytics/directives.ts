/**
 * Adapted from vue-analytics/src/directives/ga.js
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
    fn.call(vnode.context, payload);
  }
};
