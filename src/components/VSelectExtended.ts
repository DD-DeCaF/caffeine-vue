import Vue from "vue";
import VSelect from "vuetify/lib/components/VSelect/VSelect";
import { autoselectOnlyOptionMixin } from "@/mixins/autoselectOnlyOption";

export default Vue.extend({
  name: "v-select-extended",
  extends: VSelect,
  mixins: [autoselectOnlyOptionMixin]
});
