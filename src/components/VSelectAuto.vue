<template>
  <v-select v-bind="$attrs" v-on="$listeners" ref="vselect"></v-select>
</template>

<script lang="ts">
import Vue from "vue";
import VSelect from "vuetify/lib/components/VSelect/VSelect";

// v-select-auto is a wrapper around v-select that autoselects the only
// option. Bindings and listeners are forwarded to v-select.
export default Vue.extend({
  name: "VSelectAuto",
  inheritAttrs: false,
  mounted() {
    const vselect: VSelect = this.$refs.vselect;
    this.autoselectOnlyOption(vselect);

    this.$watch("$refs.vselect.allItems", () => {
      this.autoselectOnlyOption(vselect);
    });
  },
  methods: {
    autoselectOnlyOption(vselect: VSelect) {
      if (vselect.multiple) {
        throw new Error("v-select-auto does not support multiple selections.");
      }
      const firstOption = vselect.allItems[0];
      const isSelectionEmpty = vselect.selectedItems.length === 0;
      const isOnlyOption = vselect.allItems.length === 1;

      if (isSelectionEmpty && isOnlyOption) {
        vselect.setValue(
          vselect.returnObject ? firstOption : vselect.getValue(firstOption)
        );
      }
    }
  }
});
</script>
