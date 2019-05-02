import Vue from "vue";
import Router from "vue-router";
import Home from "./components/Home.vue";
import Designs from "./components/Designs.vue";
import InteractiveMap from "./components/InteractiveMap/InteractiveMap.vue";
import Jobs from "./components/Jobs/Jobs.vue";
import JobDetails from "./components/Jobs/JobDetails.vue";

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
      path: "/designs",
      name: "designs",
      component: Designs
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
