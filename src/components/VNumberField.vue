<template>
  <v-text-field
    v-bind="$attrs"
    :value="stringValue"
    v-on="$listeners"
    type="number"
  ></v-text-field>
</template>

<script lang="ts">
import Vue from "vue";

/**
 * Numeric input to replace `<v-text-field type="number" v-model.number="a">`.
 * v-text-field converts "-0" into "0", so typing "-0.1" doesn't work.
 *
 * TODO: remove if https://github.com/vuetifyjs/vuetify/issues/9368 fixed
 *
 * Usage:
 * `<v-number-field v-model.number="a" step="any" label="A">`
 */
export default Vue.extend({
  name: "v-number-field",
  inheritAttrs: false,
  props: ["value"],
  computed: {
    stringValue(): string | null | undefined {
      if (this.value === null || this.value === undefined) {
        return this.value;
      }
      if (isMinusZero(this.value)) {
        return "-0";
      }
      return String(this.value);
    }
  }
});

// Needed to differentiate -0 from 0 (-0 === 0 would be true)
function isMinusZero(value) {
  return 1 / value === -Infinity;
}
</script>
