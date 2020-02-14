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
        <h2 class="title">Methods on the Interactive Map component</h2>
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
        <v-divider></v-divider>
        <br />
        <h2 class="title">Methods on the Community Modeling component</h2>
        <br />
        <h3 class="title">SteadyCom</h3>
        <p>
          SteadyCom has been published by
          <a href="https://doi.org/10.1371/journal.pcbi.1005539">Chan et al.</a>
          and has been implemented in Python as part of the
          <a href="https://github.com/cdanielmachado/reframed"
            >ReFramed package.</a
          >
          by Daniel Machado. Community modeling on Caffeine uses ReFramed
          version 1.1.0, which itself uses
          <a href="https://www.ibm.com/analytics/cplex-optimizer">CPLEX</a>.
        </p>
        <p>
          SteadyCom predicts a steady-state microbiota composition by imposing a
          time-averaged constant growth rate on the entire community. Individual
          fluxes of each microbe model are scaled by the abundance of each
          organism. Moreover in a growing community, an organism can have
          non-zero fluxes if and only if both its total biomass and biomass
          production rate are non-zero. A non-growing organism in a growing
          community will quickly become extinct and therefore it will be unable
          to contribute to community metabolite exchange at a community
          steady-state. SteadyCom is initially non-linear but becomes linear if
          the community growth rate is fixed. The implementation in ReFramed
          therefore starts at a fixed, low initial growth rate and then
          iteratively checks if current value is feasible. If it is feasible it
          doubles the community growth rate, if it is infeasible it halves the
          community growth rate, and then checks again for feasibility until the
          highest feasible solution is found. Generally, less than ten
          iterations are required for an accuracy of 10<sup>−6</sup>.
        </p>
        <p><strong>Caveats</strong>:</p>
        <ul class="mb-3">
          <li>
            SteadyCom operates on the assumption that the studied microbial
            communities are stable and growing at a time-averaged constant
            growth rate.
          </li>
          <li>
            Physiologically relevant constraints on organism-specific uptake
            rates should be imposed whenever available. Unrestricted uptake of
            nutrients in individual members of the community may skew the
            resulting abundances.
          </li>
        </ul>
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
  props: ["showMethodHelpDialog"],
  data: () => ({
    showMethodHelpDialogLocal: false
  }),
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
