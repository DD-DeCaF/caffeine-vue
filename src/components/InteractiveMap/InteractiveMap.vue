<template>
  <div class="interactive-map fill-height">
    <v-progress-linear
      v-if="isLoadingMap"
      :indeterminate="true"
      class="my-0"
    ></v-progress-linear>
    <div class="escher-container fill-height">
      <v-container fluid fill-height v-if="isInitializingEscher">
        <v-layout align-center justify-center>
          <p class="display-1">
            <v-progress-circular
              indeterminate
              size="60"
              :width="2"
              class="mr-2"
            ></v-progress-circular>
            Initializing Escher, please wait...
          </p>
        </v-layout>
      </v-container>
      <div ref="escher" class="fill-height"></div>
    </div>
    <v-navigation-drawer permanent right absolute>
      <v-container class="py-1">
        <!-- TODO: Grouped maps -->
        <!-- TODO: Select default map -->
        <v-select
          label="Selected Map"
          :items="maps"
          item-text="name"
          item-value="id"
          v-model="currentMapId"
          :disabled="isLoadingMap"
          @change="changeMap"
        ></v-select>
      </v-container>
      <v-divider></v-divider>
      <v-container class="pa-0">
        <v-layout justify-space-around>
          <v-btn flat icon>
            <v-icon>add</v-icon>
          </v-btn>
          <v-btn flat icon>
            <v-icon>chevron_left</v-icon>
          </v-btn>
          <v-btn flat icon>
            <v-icon>play_arrow</v-icon>
          </v-btn>
          <v-btn flat icon>
            <v-icon>chevron_right</v-icon>
          </v-btn>
        </v-layout>
      </v-container>
      <v-divider></v-divider>
    </v-navigation-drawer>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
/// <reference path="@/types/escher.d.ts" />
import * as escher from "@dd-decaf/escher";
import settings from "@/settings";

export default Vue.extend({
  name: "InteractiveMap",
  data: () => ({
    escherBuilder: null,
    isInitializingEscher: true,
    currentMapId: null,
    isLoadingMap: false
  }),
  methods: {
    changeMap() {
      this.isLoadingMap = true;
      // TODO: Get map from maps state lazy loader
      axios
        .get(`${settings.apis.maps}/maps/${this.currentMapId}`)
        .then(response => {
          // Note that this will freeze the entire application, including
          // progress spinners.
          this.escherBuilder.load_map(response.data.map);
          this.isLoadingMap = false;
        });
    },
    reactionState(id: string, type?: string) {
      // TODO
    },
    handleKnockout(reactionId: string) {
      // TODO
    },
    handleKnockoutGenes(reactionId: string) {
      // TODO
    },
    handleSetAsObjective(reactionId: string) {
      // TODO
    },
    handleChangeBounds(reactionId: string, lower: string, upper: string) {
      // TODO
    },
    handleResetBounds(reactionId: string) {
      // TODO
    },
    handleObjectiveDirection(reactionId: string) {
      // TODO
    }
  },
  computed: {
    maps() {
      return this.$store.state.maps.maps;
    }
  },
  mounted() {
    this.escherBuilder = escher.Builder(null, null, null, this.$refs.escher, {
      menu: "zoom",
      scroll_behavior: "zoom",
      fill_screen: false,
      ignore_bootstrap: true,
      never_ask_before_quit: true,
      reaction_styles: ["color", "size", "text", "abs"],
      identifiers_on_map: "bigg_id",
      hide_all_labels: false,
      hide_secondary_metabolites: false,
      highlight_missing: true,
      reaction_scale: [
        { type: "min", color: "#A841D0", size: 20 },
        { type: "Q1", color: "#868BB2", size: 20 },
        { type: "Q3", color: "#6DBFB0", size: 20 },
        { type: "max", color: "#54B151", size: 20 }
      ],
      reaction_no_data_color: "#CBCBCB",
      reaction_no_data_size: 10,
      tooltip: "custom",
      enable_editing: false,
      enable_fva_opacity: true,
      show_gene_reaction_rules: true,
      zoom_extent_canvas: true,
      first_load_callback: () => {
        this.isInitializingEscher = false;
      },
      reaction_state: this.reactionState,
      tooltip_callbacks: {
        knockout: this.handleKnockout,
        knockoutGenes: this.handleKnockoutGenes,
        setAsObjective: this.handleSetAsObjective,
        changeBounds: this.handleChangeBounds,
        resetBounds: this.handleResetBounds,
        objectiveDirection: this.handleObjectiveDirection
      }
    });
  }
});
</script>
