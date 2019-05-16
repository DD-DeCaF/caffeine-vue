<template>
  <div>
    <v-layout>
      <v-autocomplete
        class="mr-2"
        label="Experiment"
        :items="experiments"
        v-model="cardExperiment"
        item-text="name"
        placeholder="Choose the experiment you wish to simulate..."
        return-object
      ></v-autocomplete>

      <v-autocomplete
        class="ml-2"
        label="Conditions"
        :items="conditions"
        v-model="cardCondition"
        :loading="isLoadingConditions"
        :disabled="conditions === []"
        item-text="name"
        placeholder="Choose the conditions you wish to simulate"
        return-object
      ></v-autocomplete>
    </v-layout>

    <v-progress-linear
      :indeterminate="true"
      v-if="isLoadingConditionData"
    ></v-progress-linear>

    <div v-if="organismMismatch" class="mb-2">
      <v-alert :value="true" type="warning">
        You are applying experimental data for the strain
        <em>{{ conditionOrganism.name }}</em> to a model based on a different
        organism (<em>{{ card.organism.name }}</em
        >). Some data points may not apply succesfully.
      </v-alert>
    </div>

    <div v-for="warning in card.conditionWarnings" :key="warning" class="mb-2">
      <v-alert :value="true" type="warning">
        {{ warning }}
      </v-alert>
    </div>

    <div v-for="error in card.conditionErrors" :key="error" class="mb-2">
      <v-alert :value="true" type="error">
        {{ error }}
      </v-alert>
    </div>

    <v-layout v-if="card.conditionData">
      <v-flex class="mr-2">
        <v-card>
          <v-subheader>Genotype changes</v-subheader>
          <v-list>
            <v-list-tile v-for="gene in genotypes" :key="gene">
              <v-list-tile-content>
                <v-list-tile-title v-text="gene"></v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-flex>
      <v-flex>
        <v-card class="mx-2">
          <v-subheader>Measurements</v-subheader>
          <v-list>
            <!-- TODO: Handle non-bigg namespaces -->
            <!-- See: https://github.com/DD-DeCaF/caffeine-vue/issues/46 -->
            <v-list-tile
              v-for="measurement in card.conditionData.measurements"
              :key="measurement.id"
              :href="`http://bigg.ucsd.edu/search?query=${measurement.id}`"
              target="_blank"
            >
              <v-list-tile-content>
                <v-list-tile-title>
                  {{ measurement.id }}: {{ measurement.measurements }} mmol
                  g<sup>-1</sup> h<sup>-1</sup>
                </v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-flex>
      <v-flex>
        <v-card class="ml-2">
          <v-subheader>Medium</v-subheader>
          <v-list>
            <!-- TODO: Handle non-chebi namespaces -->
            <!-- See: https://github.com/DD-DeCaF/caffeine-vue/issues/46 -->
            <v-list-tile
              v-for="medium in card.conditionData.medium"
              :key="medium.id"
              :href="
                `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${medium.id}`
              "
              target="_blank"
            >
              <v-list-tile-content>
                <v-list-tile-title>{{ medium.id }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-flex>
    </v-layout>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import * as settings from "@/utils/settings";

export default Vue.extend({
  name: "CardDialogDataDriven",
  data: () => ({
    conditions: [],
    conditionOrganism: null,
    isLoadingConditions: false,
    isLoadingConditionData: false
  }),
  props: ["card", "modifications"],
  watch: {
    "card.experiment"() {
      if (!this.card.experiment) {
        this.conditions = [];
        return;
      }
      this.conditions = [];
      this.isLoadingConditions = true;
      axios
        .get(
          `${settings.apis.warehouse}/experiments/${
            this.card.experiment.id
          }/conditions`
        )
        .then(response => {
          this.conditions = response.data;
        })
        .catch(error => {
          this.$emit("load-data-error");
        })
        .then(() => {
          this.isLoadingConditions = false;
        });
    },
    "card.condition"() {
      this.conditionOrganism = null;
      this.$store.commit("interactiveMap/updateCard", {
        uuid: this.card.uuid,
        props: { conditionData: null }
      });

      if (!this.card.condition) {
        return;
      }

      // Load the organism based on conditions strain
      this.$emit("is-loading-organism", true);
      axios
        .get(
          `${settings.apis.warehouse}/strains/${this.card.condition.strain_id}`
        )
        .then(response => {
          this.conditionOrganism = this.$store.getters[
            "organisms/getOrganismById"
          ](response.data.organism_id);
        })
        .catch(error => {
          this.$emit("load-data-error");
        })
        .then(() => {
          this.$emit("is-loading-organism", false);
        });

      // Load condition data
      this.isLoadingConditionData = true;
      axios
        .get(
          `${settings.apis.warehouse}/conditions/${this.card.condition.id}/data`
        )
        .then(response => {
          this.$store.commit("interactiveMap/updateCard", {
            uuid: this.card.uuid,
            props: { conditionData: response.data }
          });
        })
        .catch(error => {
          this.$emit("load-data-error");
        })
        .then(() => {
          this.isLoadingConditionData = false;
        });
    },
    "card.conditionData"() {
      if (!this.card.conditionData) {
        return;
      }
      this.$emit("simulate-card");
    }
  },
  computed: {
    experiments() {
      return this.$store.state.experiments.experiments;
    },
    organismMismatch() {
      if (!this.card.organism || !this.conditionOrganism) {
        return false;
      }
      return this.card.organism.id != this.conditionOrganism.id;
    },
    genotypes() {
      if (!this.card.conditionData) {
        return [];
      }
      const genesFlattened: object[] = [];
      this.card.conditionData.genotype.forEach(geneString => {
        geneString.split(",").forEach(gene => genesFlattened.push(gene));
      });
      return genesFlattened;
    },
    cardExperiment: {
      get() {
        return this.card.experiment;
      },
      set(experiment) {
        this.$store.commit("interactiveMap/updateCard", {
          uuid: this.card.uuid,
          props: { experiment: experiment }
        });
      }
    },
    cardCondition: {
      get() {
        return this.card.condition;
      },
      set(condition) {
        this.$store.commit("interactiveMap/updateCard", {
          uuid: this.card.uuid,
          props: { condition: condition }
        });
      }
    }
  }
});
</script>
