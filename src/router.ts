import Vue from "vue";
import Router from "vue-router";
import Home from "./components/Home.vue";
import InteractiveMap from "./components/InteractiveMap/InteractiveMap.vue";
import PrivacyPolicy from "./components/PrivacyPolicy.vue";
import TermsOfService from "./components/TermsOfService.vue";

Vue.use(Router);

export default new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    {
      path: "/",
      name: "home",
      component: Home
    },
    {
      path: "/interactiveMap",
      name: "interactiveMap",
      component: InteractiveMap
    },
    {
      path: "/privacy-policy",
      name: "PrivacyPolicy",
      component: PrivacyPolicy
    },
    {
      path: "/terms-of-service",
      name: "TermsOfService",
      component: TermsOfService
    }
  ]
});
