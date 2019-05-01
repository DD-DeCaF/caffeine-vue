<template>
  <div class="escher-container fill-height">
    <v-container
      fluid
      fill-height
      class="overlay"
      v-if="initializingEscher !== null || isLoadingMap"
    >
      <v-layout align-center justify-center>
        <v-progress-circular
          indeterminate
          size="40"
          :width="2"
          class="mr-2"
          color="white"
        ></v-progress-circular>
        <p
          class="display-1 white--text mb-0"
          v-if="initializingEscher !== null"
        >
          Initializing Escher...
        </p>
        <p class="display-1 white--text mb-0" v-if="isLoadingMap">
          Loading map...
        </p>
      </v-layout>
    </v-container>
    <div ref="escher" class="fill-height"></div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
/// <reference path="@/types/escher.d.ts" />
import * as escher from "@dd-decaf/escher";

export default Vue.extend({
  name: "Escher",
  props: ["mapData", "fluxDistribution"],
  data: () => ({
    escherBuilder: null,
    initializingEscher: null,
    isLoadingMap: false
  }),
  watch: {
    mapData(value) {
      const loadMap = () => {
        this.isLoadingMap = true;
        // Delay the actual loading of the map to give Vue time to update the
        // interface (after setting isLoadingMap to true). Otherwise, Escher
        // would freeze execution until it's complete and the user would never
        // actually see the loading message.
        setTimeout(() => {
          this.escherBuilder.load_map(value);
          this.isLoadingMap = false;
        }, 10);
      };

      // Wait for escher to initialize before loading the map.
      if (this.initializingEscher !== null) {
        this.initializingEscher.then(loadMap);
      } else {
        loadMap();
      }
    },
    fluxDistribution(value) {
      this.escherBuilder.set_reaction_data(value);
      this.escherBuilder._update_data(true, true);
    }
  },
  methods: {
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
  mounted() {
    this.initializingEscher = new Promise((resolve, reject) => {
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
          resolve();
          this.initializingEscher = null;
          this.$emit("escher-loaded");
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
    });
  }
});
</script>

<style>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.15);
}
</style>
