<template>
  <v-dialog v-model="showMethodHelpDialogLocal" width="1200">
    <v-card>
      <v-card-title class="headline primary white--text" primary-title>
        Constraint-based modeling
      </v-card-title>

      <v-card-text>
        <p>
          The following simulation methods predict metabolic fluxes that
          optimize certain biological objectives, for example, growth yield.
          They operate under the assumption that the organism’s metabolism is in
          a dynamic equilibrium (pseudo steady-state): internal metabolite
          concentrations are constant and production and consumption fluxes
          perfectly balance each other.<br />
          This is a reasonable assumption when the environment is constant (e.g.
          in a <a href="https://en.wikipedia.org/wiki/Chemostat">chemostat</a>)
          or there is nutrient excess (e.g. a microbial culture growing in
          <a href="https://en.wikipedia.org/wiki/Bacterial_growth#Phases"
            >exponential phase</a
          >).
        </p>
        <p>
          Physiological data (uptake and secretion rates, yields, growth rates,
          C13 fluxes etc.) can all be readily integrated in the form of reaction
          rate constraints. In the future, the integration of additional types
          of omics data will be added.
        </p>
        <p>
          You can find a comprehensive overview of constraint-based modeling and
          its applications
          <a
            href="http://www.sciencedirect.com/science/article/pii/S0092867415005681?via%3Dihub"
            >here</a
          >.
        </p>
        <h3 class="title">Flux Balance Analysis (FBA)</h3>
        <p>
          Flux balance analysis optimizes a biological objective to predict a
          distribution of metabolic fluxes. The default objective is the
          maximization of growth rate.
        </p>
        <p><strong>Caveats</strong>:</p>
        <ul class="mb-3">
          <li>
            In general, flux distributions predicted through FBA are not unique.
            Uncertainties in the predicted fluxes can be assessed through
            <a href="http://cobramethods.wikidot.com/flux-variability-analysis"
              >Flux Variability Analysis</a
            >
            (see also below).
          </li>
          <li>
            Biomass composition is assumed to be constant and growth-rate
            independent.
          </li>
          <li>
            The objective is optimization of growth yield and not growth rate.
          </li>
        </ul>
        <h3 class="title">Parsimonious FBA (recommended)</h3>
        <p>
          In addition to maximizing growth yield (see FVA below),
          <a href="http://cobramethods.wikidot.com/pfba"
            >Parsimonious Flux Balance Analysis</a
          >
          (pFBA) will simultaneously minimize the sum of all fluxes which is a
          proxy for minimizing enzyme expression.
        </p>
        <p><strong>Caveats</strong>:</p>
        <ul class="mb-3">
          <li>
            Flux minimization is only a proxy for the minimization of protein
            expression cost. For more accurate modeling approaches to proteome
            allocation, please refer to the
            <a
              href="http://onlinelibrary.wiley.com/doi/10.15252/msb.20167411/abstract"
              >GECKO</a
            >
            method (already supported for <em>S. cerevisae</em>) and
            <a href="http://msb.embopress.org/content/9/1/693">ME</a> models
            (which will be made available soon).
          </li>
        </ul>
        <h3 class="title">Flux Variability Analysis (FVA)</h3>
        <p>
          In general, constraint-based modeling solutions will have many
          alternative optima.
          <a href="http://cobramethods.wikidot.com/flux-variability-analysis"
            >Flux Variability Analysis</a
          >
          (FVA) allows the estimation of the uncertainty in flux predictions
          computed by FBA. Uncertain reaction rates are highlighted using
          transparency.
        </p>
        <h3 class="title">Parsimonious FVA</h3>
        <p>
          Similar to FVA, parsimonious FVA will estimate the uncertainty of flux
          predictions computed by pFBA.
        </p>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" flat @click="$emit('close-dialog')">
          I see, thanks!
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "MethodHelpDialog",
  data: () => ({
    showMethodHelpDialogLocal: false
  }),
  props: ["showMethodHelpDialog"],
  watch: {
    showMethodHelpDialog(value) {
      this.showMethodHelpDialogLocal = value;
    },
    showMethodHelpDialogLocal(value) {
      if (!value) {
        this.$emit("close-dialog");
      }
    }
  }
});
</script>
