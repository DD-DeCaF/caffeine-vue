<template>
  <div class="escher-container fill-height">
    <v-container fluid fill-height v-if="initializingEscher !== null">
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
    initializingEscher: null
  }),
  watch: {
    mapData(value) {
      const loadMap = () => {
        // Note that this will freeze the entire application, including
        // progress spinners.
        this.escherBuilder.load_map(value);
        this.$emit("map-loaded");
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
