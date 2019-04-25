import Vue from "vue";
import "./plugins/vuetify";
import App from "./App.vue";
import router from "./router";
import store from "./store/index";
import "roboto-fontface/css/roboto/roboto-fontface.css";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import NewProject from "@/components/shared/NewProject.vue";
import NewOrganism from "@/components/shared/NewOrganism.vue";

Vue.config.productionTip = false;

Vue.component("NewProject", NewProject);
Vue.component("NewOrganism", NewOrganism);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
