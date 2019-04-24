import Vue from "vue";
import Vuetify from "vuetify/lib";
import "vuetify/src/stylus/app.styl";
import colors from "vuetify/es5/util/colors";
import MapIcon from "../assets/MapIcon.vue";
import GoogleIcon from "../assets/GoogleIcon.vue";
import TwitterIcon from "../assets/TwitterIcon.vue";
import GithubIcon from "../assets/GithubIcon.vue";

Vue.use(Vuetify, {
  theme: {
    primary: colors.blue,
    secondary: colors.blue.darken2,
    accent: colors.grey,
    error: "#FF5252",
    info: "#2196F3",
    success: "#4CAF50",
    warning: "#FFC107"
  },
  iconfont: "md",
  icons: {
    interactive_map: {
      component: MapIcon,
      props: {
        role: "icon"
      }
    },
    google_plus: {
      component: GoogleIcon,
      props: {
        role: "icon"
      }
    },
    twitter: {
      component: TwitterIcon,
      props: {
        role: "icon"
      }
    },
    github: {
      component: GithubIcon,
      props: {
        role: "icon"
      }
    }
  }
});
