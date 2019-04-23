<template>
  <div id="app">
    <v-app>
      <v-toolbar app clipped-left color="primary" dark>
        <v-toolbar-side-icon
          @click.stop="drawer = !drawer"
        ></v-toolbar-side-icon>
        <v-toolbar-title>Caffeine</v-toolbar-title>
      </v-toolbar>

      <v-navigation-drawer v-model="drawer" app clipped>
        <v-list>
          <v-list-tile to="/">
            <v-list-tile-action>
              <v-icon>home</v-icon>
            </v-list-tile-action>

            <v-list-tile-content>
              <v-list-tile-title>Home</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>

          <v-list-tile to="/interactiveMap">
            <v-list-tile-action>
              <v-icon v-text="icon">$vuetify.icons.interactive_map</v-icon>
            </v-list-tile-action>

            <v-list-tile-content>
              <v-list-tile-title>Interactive Map</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>

          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <div v-on="on">
                <v-list-tile to="/design" disabled>
                  <v-list-tile-action>
                    <v-icon>edit</v-icon>
                  </v-list-tile-action>

                  <v-list-tile-content>
                    <v-list-tile-title>Design</v-list-tile-title>
                  </v-list-tile-content>
                </v-list-tile>
              </div>
            </template>
            <span>Please log in or register to use this functionality!</span>
          </v-tooltip>

          <v-list-tile to="/jobs">
            <v-list-tile-action>
              <v-icon>hourglass_empty</v-icon>
            </v-list-tile-action>

            <v-list-tile-content>
              <v-list-tile-title>Jobs</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>

          <v-list-tile to="/designs">
            <v-list-tile-action>
              <v-icon>device_hub</v-icon>
            </v-list-tile-action>

            <v-list-tile-content>
              <v-list-tile-title>Designs</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>

          <v-list-tile to="/projects">
            <v-list-tile-action>
              <v-icon>subject</v-icon>
            </v-list-tile-action>

            <v-list-tile-content>
              <v-list-tile-title>Projects</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>

          <v-list-tile to="/maps">
            <v-list-tile-action>
              <v-icon>map</v-icon>
            </v-list-tile-action>

            <v-list-tile-content>
              <v-list-tile-title>Maps</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>

          <v-list-tile to="/models">
            <v-list-tile-action>
              <v-icon>rounded_corner</v-icon>
            </v-list-tile-action>

            <v-list-tile-content>
              <v-list-tile-title>Models</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-navigation-drawer>

      <v-content>
        <v-container fluid>
          <router-view />
        </v-container>
      </v-content>
      <v-footer app></v-footer>
    </v-app>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  data: () => ({
    drawer: true
  })
});
</script>
