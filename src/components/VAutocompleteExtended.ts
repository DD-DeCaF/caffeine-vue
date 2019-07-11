import Vue from "vue";
import VAutocomplete from "vuetify/lib/components/VAutocomplete/VAutocomplete";
import { autoselectOnlyOptionMixin } from "@/mixins/autoselectOnlyOption";

export default Vue.extend({
  name: "v-autocomplete-extended",
  extends: VAutocomplete,
  mixins: [autoselectOnlyOptionMixin]
});
