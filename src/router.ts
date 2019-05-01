import Vue from "vue";
import Router from "vue-router";

import sessionStore from "@/store/modules/session";
import Home from "./components/Home.vue";
import Designs from "./components/Designs.vue";
import InteractiveMap from "./components/InteractiveMap/InteractiveMap.vue";
import Jobs from "./components/Jobs.vue";
import JobDetails from "./components/JobDetails.vue";

Vue.use(Router);

const authGuard = (to, from, next) => {
  if (sessionStore.state.isAuthenticated) {
    next();
  } else {
    next(false);
  }
};

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
      path: "/designs",
      name: "designs",
      component: Designs,
      beforeEnter: authGuard
    },
    {
      path: "/interactiveMap",
      name: "interactiveMap",
      component: InteractiveMap
    },
    {
      path: "/jobs",
      name: "jobs",
      component: Jobs
    },
    {
      path: "/jobs/:id",
      name: "jobDetails",
      component: JobDetails
    }
  ]
});
