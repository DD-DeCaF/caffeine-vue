import Vue from "vue";
import analytics from "./plugins/analytics";
import googleAnalyticsPlugin from "analytics-plugin-ga";
import "./plugins/vuetify";
import App from "./App.vue";
import router from "./router";
import { gaTrackingID, sentryDSN } from "./utils/settings";
import store from "./store/index";
import "roboto-fontface/css/roboto/roboto-fontface.css";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import NewProject from "@/components/NewProject.vue";
import NewOrganism from "@/components/NewOrganism.vue";
import NewModel from "@/components/NewModel.vue";
import NewMap from "@/components/NewMap.vue";
import NewStrain from "@/components/NewStrain.vue";
import NewMedium from "@/components/NewMedium.vue";
import LoaderDialog from "@/components/LoaderDialog.vue";
import DeletionDialog from "@/components/DeletionDialog.vue";
import FileUpload from "@/components/FileUpload.vue";
import CookieConsent from "@/components/CookieConsent.vue";
import VSelectExtended from "@/components/VSelectExtended";
import VAutocompleteExtended from "@/components/VAutocompleteExtended";
import VFormExtended from "@/components/VFormExtended";
import AutocompleteMnxReaction from "@/components/AutocompleteMnxReaction.vue";
import AutocompleteMnxMetabolite from "@/components/AutocompleteMnxMetabolite.vue";
import VNumberField from "@/components/VNumberField.vue";
import AExtended from "@/components/AExtended.vue";
import { initFromStorage } from "@/utils/startup";
import promisedDialog from "@/utils/promisedDialog";
import * as Sentry from "@sentry/browser";
import * as Integrations from "@sentry/integrations";

// Temporarily remove old service workers until we re-introduce them.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const reg of registrations) {
      reg.unregister();
    }
  });
}

if (sentryDSN) {
  Sentry.init({
    dsn: sentryDSN,
    integrations: [
      new Integrations.Vue({
        Vue,
        attachProps: true
      })
    ]
  });
}

Vue.use(require("vue-moment"));
Vue.use(promisedDialog);

Vue.use(analytics, {
  // Own options
  store,
  // Analytics options (https://github.com/DavidWells/analytics)
  plugins: [
    // TODO: Make sure the app doesn't error if there's no gaTrackingID
    googleAnalyticsPlugin({
      trackingId: gaTrackingID,
      autoTrack: true
    })
  ],
  // Vue analytics options (https://github.com/MatteoGabriele/vue-analytics)
  router
});

Vue.config.productionTip = false;

Vue.component("NewProject", NewProject);
Vue.component("NewOrganism", NewOrganism);
Vue.component("NewModel", NewModel);
Vue.component("NewMap", NewMap);
Vue.component("NewStrain", NewStrain);
Vue.component("NewMedium", NewMedium);
Vue.component("LoaderDialog", LoaderDialog);
Vue.component("DeletionDialog", DeletionDialog);
Vue.component("FileUpload", FileUpload);
Vue.component("CookieConsent", CookieConsent);
Vue.component("AutocompleteMnxReaction", AutocompleteMnxReaction);
Vue.component("AutocompleteMnxMetabolite", AutocompleteMnxMetabolite);
Vue.component("a-extended", AExtended);
Vue.component("v-select-extended", VSelectExtended);
Vue.component("v-autocomplete-extended", VAutocompleteExtended);
Vue.component("v-form-extended", VFormExtended);
Vue.component("v-number-field", VNumberField);
Vue.component("Var", {
  render() {
    return this.$scopedSlots.default(this.$attrs);
  }
});

// Synchronously initialize values from local storage before the main Vue
// instance is created.
initFromStorage();

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
