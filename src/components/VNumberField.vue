<template>
  <v-text-field
    v-bind="$attrs"
    v-on="listenersWithoutInput"

    type="number"
    :value="stringValue"
    @input="emitNumericInput"
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
 * `<v-number-field v-model="a" step="any" label="A">`
 */
export default Vue.extend({
  name: "v-number-field",
  inheritAttrs: false,
  props: ["value"],
  computed: {
    listenersWithoutInput() {
      const { input, ...other } = this.$listeners;
      return other;
    },
    stringValue(): string | null | undefined {
      if (this.value === null || this.value === undefined) {
        return this.value;
      }
      if (isMinusZero(this.value)) {
        return "-0";
      }
      return String(this.value);
    }
  },
  methods: {
    emitNumericInput($event: string | null | undefined): void {
      const number = parseFloat($event)
      const numberOrString = isNaN(number) ? $event : number;
      this.$emit('input', numberOrString);
    }
  }
});

// Needed to differentiate -0 from 0 (-0 === 0 would be true)
function isMinusZero(value) {
  return 1 / value === -Infinity;
}
</script>
