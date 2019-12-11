<template>
  <div class="legend">
    <v-card>
      <v-toolbar dense color="primary" class="white--text">
        <v-toolbar-title class="body-2">Legend</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn flat icon @click="isExpanded = !isExpanded">
          <v-icon color="white" v-if="isExpanded">expand_more</v-icon>
          <v-icon color="white" v-else>expand_less</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text v-if="isExpanded">
        <div v-if="!showScoreLegend">
          <p class="mb-0">Flux</p>
          <div class="flux-gradient"></div>
          <p>
            min
            <span style="float: right;">max</span>
          </p>
        </div>
        <div v-else>
          <p class="mb-0">Change expression</p>
          <div class="score-gradient"></div>
          <p>
            down
            <span style="float: right;">up</span>
          </p>
        </div>
        <v-layout align-center class="mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 50 50"
            version="1.1"
          >
            <path
              class="segment"
              d="M0.0,20.0 L100.0,20.0"
              stroke-dasharray="10, 10"
              style="opacity: 0.75; stroke: rgb(165, 165, 165); stroke-width: 5;"
            ></path>
          </svg>
          <p class="mb-0 ml-3">
            No flux
          </p>
        </v-layout>
        <v-layout v-if="!ecModel" align-center class="mb-4">
          <div class="not-in-model"></div>
          <p class="mb-0 ml-3">
            Not in the model
          </p>
        </v-layout>
        <v-layout align-center v-show="!showScoreLegend && !showEnzymeUsage">
          <div class="measured-flux"></div>
          <p class="mb-0 ml-3">
            Measured flux
          </p>
        </v-layout>
        <v-layout align-center v-show="showEnzymeUsage">
          <div class="measured-flux"></div>
          <p class="mb-0 ml-3">
            Reaction with enzyme usage greater than or equal to threshold
          </p>
        </v-layout>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "Legend",
  props: ["card", "ecModel"],
  data: () => ({
    isExpanded: true
  }),
  computed: {
    showScoreLegend() {
      return this.card ? this.card.showDiffFVAScore : false;
    },
    showEnzymeUsage() {
      return (
        this.card &&
        this.ecModel &&
        this.card.type === "DataDriven" &&
        this.card.sample &&
        this.card.sample.proteomics.length > 0
      );
    }
  }
});
</script>

<style lang="scss" scoped>
.legend {
  position: absolute;
  left: 20px;
  bottom: 20px;
  min-width: 200px;
  z-index: 10;
}

.flux-gradient {
  background: linear-gradient(90deg, #a841d0, #868bb2, #6dbfb0, #54b151);
  height: 30px;
  width: 100%;
}

.score-gradient {
  background: linear-gradient(90deg, #a841d0, #f7f7f7, #54b151);
  height: 30px;
  width: 100%;
}

.not-in-model {
  height: 20px;
  width: 20px;
  background-color: red;
}

.measured-flux {
  height: 20px;
  width: 20px;
  background-color: purple;
  box-shadow: 0 0 20px 0 purple;
  border-radius: 30%;
}
</style>
