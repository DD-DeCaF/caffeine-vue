import Vue from "vue";
import "./plugins/vuetify";
import App from "./App.vue";
import router from "./router";
import { sentryDSN } from "./utils/settings";
import store from "./store/index";
import "roboto-fontface/css/roboto/roboto-fontface.css";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import NewProject from "@/components/NewProject.vue";
import NewOrganism from "@/components/NewOrganism.vue";
import NewModel from "@/components/NewModel.vue";
import NewMap from "@/components/NewMap.vue";
import LoaderDialog from "@/components/LoaderDialog.vue";
import DeletionDialog from "@/components/DeletionDialog.vue";
import FileUpload from "@/components/FileUpload.vue";
import { initFromStorage } from "@/utils/startup";
import * as Sentry from "@sentry/browser";
import * as Integrations from "@sentry/integrations";

Sentry.init({
  dsn: sentryDSN,
  integrations: [
    new Integrations.Vue({
      Vue,
      attachProps: true
    })
  ]
});

Vue.use(require("vue-moment"));

Vue.config.productionTip = false;

Vue.component("NewProject", NewProject);
Vue.component("NewOrganism", NewOrganism);
Vue.component("NewModel", NewModel);
Vue.component("NewMap", NewMap);
Vue.component("LoaderDialog", LoaderDialog);
Vue.component("DeletionDialog", DeletionDialog);
Vue.component("FileUpload", FileUpload);

// Synchronously initialize values from local storage before the main Vue
// instance is created.
initFromStorage();

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
