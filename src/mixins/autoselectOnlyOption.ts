import Vue from "vue";
import VSelect from "vuetify/lib/components/VSelect/VSelect";

// Adds support for autoselectOnlyOption attribute to v-select.
export const autoselectOnlyOptionMixin: Vue.ComponentOptions<VSelect> = {
  props: {
    autoselectOnlyOption: Boolean
  },
  watch: {
    autoselectOnlyOption() {
      this.selectOnlyOption();
    },
    // Using vuetify internals: allItems
    allItems() {
      this.selectOnlyOption();
    }
  },
  mounted() {
    this.selectOnlyOption();
  },
  methods: {
    selectOnlyOption(): void {
      if (!this.autoselectOnlyOption) {
        return;
      }
      if (this.multiple) {
        throw new Error("autoselectOnlyOption does not support [multiple].");
      }
      const firstOption = this.allItems[0];
      const isSelectionEmpty = this.selectedItems.length === 0;
      const isOnlyOption = this.allItems.length === 1;

      if (isSelectionEmpty && isOnlyOption) {
        // Using vuetify internals: returnObject, setValue, getValue
        this.setValue(
          this.returnObject ? firstOption : this.getValue(firstOption)
        );
      }
    }
  }
};
