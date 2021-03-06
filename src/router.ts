import Vue from "vue";
import Router, { NavigationGuard, RawLocation } from "vue-router";
import store from "@/store";
import sessionStore from "@/store/modules/session";
import Home from "./views/Home.vue";
import CommunityModeling from "./views/CommunityModeling.vue";
import Design from "./views/Design.vue";
import Designs from "./views/Designs.vue";
import InteractiveMap from "./views/InteractiveMap/InteractiveMap.vue";
import Jobs from "./views/Jobs/Jobs.vue";
import JobDetails from "./views/Jobs/JobDetails.vue";
import Maps from "./views/Maps.vue";
import Media from "./views/Media.vue";
import Models from "./views/Models.vue";
import Projects from "./views/Projects.vue";
import ResetRequest from "./views/ResetRequest.vue";
import PasswordReset from "./views/PasswordReset.vue";
import Experiments from "./views/Experiments/Experiments.vue";
import PrivacyPolicy from "./views/PrivacyPolicy.vue";
import TermsOfService from "./views/TermsOfService.vue";
import NotFound from "./views/NotFound.vue";

Vue.use(Router);

const authGuard: NavigationGuard = (to, from, next) => {
  // We rely on the authentication having been handled from local storage
  // before the entire `App` was initialized. Thus we avoid having to watch
  // the session store and users can directly proceed to guarded routes when
  // they have a valid token in local storage.
  if (sessionStore.state.isAuthenticated) {
    next();
  } else {
    store.commit("setUnauthorizedError", to.path);
    next({ name: "home" });
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
      path: "/community-modeling",
      name: "community-modeling",
      component: CommunityModeling,
      beforeEnter: authGuard
    },
    {
      path: "/design",
      name: "design",
      component: Design,
      beforeEnter: authGuard
    },
    {
      path: "/designs",
      name: "designs",
      component: Designs,
      beforeEnter: authGuard
    },
    {
      path: "/interactive-map",
      name: "interactiveMap",
      component: InteractiveMap
    },
    {
      path: "/jobs",
      name: "jobs",
      component: Jobs,
      beforeEnter: authGuard
    },
    {
      path: "/jobs/:id",
      name: "jobDetails",
      component: JobDetails,
      beforeEnter: authGuard
    },
    {
      path: "/maps",
      name: "maps",
      component: Maps
    },
    {
      path: "/media",
      name: "media",
      component: Media
    },
    {
      path: "/models",
      name: "models",
      component: Models
    },
    {
      path: "/projects",
      name: "projects",
      component: Projects,
      beforeEnter: authGuard
    },
    {
      path: "/password-reset",
      name: "resetRequest",
      component: ResetRequest
    },
    {
      path: "/password-reset/:token",
      name: "passwordReset",
      component: PasswordReset
    },
    {
      path: "/experiments",
      name: "experiments",
      component: Experiments
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
    },
    {
      path: "*",
      component: NotFound
    }
  ]
});
