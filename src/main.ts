import Vue from "vue";
import "./plugins/vuetify";
import App from "./App.vue";
import router from "./router";
import store from "./store/index";
import "roboto-fontface/css/roboto/roboto-fontface.css";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import NewProject from "@/components/shared/NewProject.vue";
import NewOrganism from "@/components/shared/NewOrganism.vue";
import NewModel from "@/components/shared/NewModel.vue";
import NewMap from "@/components/shared/NewMap.vue";
import LoaderDialog from "@/components/shared/LoaderDialog.vue";
import DeletionDialog from "@/components/shared/DeletionDialog.vue";
import FileUpload from "@/components/shared/FileUpload.vue"

Vue.config.productionTip = false;

Vue.component("NewProject", NewProject);
Vue.component("NewOrganism", NewOrganism);
Vue.component("NewModel", NewModel);
Vue.component("NewMap", NewMap);
Vue.component("LoaderDialog", LoaderDialog);
Vue.component("DeletionDialog", DeletionDialog);
Vue.component("FileUpload", FileUpload);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
