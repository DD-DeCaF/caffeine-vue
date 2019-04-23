import Vue from "vue";
import Vuetify from "vuetify/lib";
import "vuetify/src/stylus/app.styl";
import colors from "vuetify/es5/util/colors";
import MapIcon from "../assets/MapIcon.vue";

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
    }
  }
});
