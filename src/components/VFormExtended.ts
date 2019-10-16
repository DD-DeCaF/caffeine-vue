import Vue from "vue";
import VForm from "vuetify/lib/components/VForm/VForm";

export default Vue.extend({
  name: "v-form-extended",
  extends: VForm,
  props: {
    immediatelyValidated: Boolean
  },
  watch: {
    inputs: {
      immediate: true,
      handler() {
        if (this.immediatelyValidated) {
          this.validate();
        }
      }
    }
  }
});
