<template>
  <div>
    <v-layout>
      <v-autocomplete-extended
        class="mr-2"
        label="Experiment"
        :items="experiments"
        v-model="cardExperiment"
        autoselectOnlyOption
        item-text="name"
        item-value="id"
        placeholder="Choose the experiment you wish to simulate..."
        return-object
      ></v-autocomplete-extended>

      <v-autocomplete-extended
        class="ml-2"
        label="Conditions"
        :items="conditions"
        v-model="cardCondition"
        autoselectOnlyOption
        :loading="isLoadingConditions"
        :disabled="conditions === []"
        item-text="name"
        item-value="id"
        placeholder="Choose the conditions you wish to simulate"
        return-object
      ></v-autocomplete-extended>
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

    <v-layout v-if="card.conditionData">
      <v-flex class="mr-2" xs5>
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
      <v-flex xs4>
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
      <v-flex xs3>
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

    <div v-for="warning in card.conditionWarnings" :key="warning" class="mt-2">
      <v-alert :value="true" type="warning">
        {{ warning }}
      </v-alert>
    </div>

    <div v-for="error in card.conditionErrors" :key="error" class="mt-2">
      <v-alert :value="true" type="error">
        {{ error }}
      </v-alert>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapMutations } from "vuex";
import axios from "axios";
import * as settings from "@/utils/settings";
import { Metabolite } from "@/store/modules/interactiveMap";
import { buildReactionString } from "@/utils/reaction";

export default Vue.extend({
  name: "CardDialogDataDriven",
  props: ["card", "modifications"],
  data: () => ({
    conditions: [],
    conditionOrganism: null,
    isLoadingConditions: false,
    isLoadingConditionData: false
  }),
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
        this.updateCard({
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
        this.updateCard({
          uuid: this.card.uuid,
          props: { condition: condition }
        });
      }
    }
  },
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
      this.updateCard({
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
          this.updateCard({
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

      // Reset warnings and errors
      // We'll be modifying the model before simulating, but just re-use the
      // loading flag for `isSimulating` to indicate that _something_ is going
      // on.
      this.updateCard({
        uuid: this.card.uuid,
        props: {
          conditionWarnings: [],
          conditionErrors: [],
          isSimulating: true,
          hasSimulationError: false
        }
      });

      axios
        .post(
          `${settings.apis.simulations}/models/${this.card.modelId}/modify`,
          this.card.conditionData
        )
        .then(response => {
          // Save all modifications to the card
          const editedBounds: Object[] = [];
          response.data.operations.forEach(modification => {
            if (modification.operation === "remove") {
              this.$store.dispatch("interactiveMap/removeReaction", {
                uuid: this.card.uuid,
                reactionId: modification.id
              });
            } else if (modification.operation === "add") {
              const metabolites: Metabolite[] = [];
              const metabolitesFromResponse = modification.data.metabolites;
              for (const metaboliteIdWithCompartment in metabolitesFromResponse) {
                const index = metaboliteIdWithCompartment.lastIndexOf("_");
                const metabolite: Metabolite = {
                  stoichiometry:
                    metabolitesFromResponse[metaboliteIdWithCompartment],
                  id: metaboliteIdWithCompartment.substring(0, index),
                  compartment: metaboliteIdWithCompartment.substring(index + 1)
                };
                metabolites.push(metabolite);
              }
              const reactionString = buildReactionString(
                metabolites,
                modification.data.lower_bound,
                modification.data.upper_bound
              );
              this.$store.commit("interactiveMap/addReaction", {
                uuid: this.card.uuid,
                reaction: {
                  annotation: modification.data.annotation,
                  name: modification.data.name ? modification.data.name : "N/A",
                  id: modification.data.id,
                  reactionString: reactionString,
                  gene_reaction_rule: modification.data.gene_reaction_rule,
                  lowerBound: modification.data.lower_bound,
                  upperBound: modification.data.upper_bound,
                  metabolites: metabolites
                }
              });
            } else if (modification.operation === "modify") {
              editedBounds.push({
                id: modification.data.id,
                lowerBound: modification.data.lower_bound,
                upperBound: modification.data.upper_bound
              });
            } else if (modification.operation === "knockout") {
              if (modification.type === "reaction") {
                this.$store.dispatch("interactiveMap/knockoutReaction", {
                  uuid: this.card.uuid,
                  reactionId: modification.id
                });
              } else {
                this.$store.dispatch("interactiveMap/knockoutGene", {
                  uuid: this.card.uuid,
                  geneId: modification.id
                });
              }
            } else {
              throw new Error(
                `Unexpected simulation operation ${modification.operation}`
              );
            }
          });
          // TODO: dispatch editBounds action to display reaction name
          // on modifications table when simulations service returns
          // modifications that were actually applied to the reactions.
          // For now commit all collected editBounds modifications in a single mutation
          this.$store.commit("interactiveMap/editMultipleBounds", {
            uuid: this.card.uuid,
            reactions: editedBounds
          });
          // Note: Don't toggle `card.isSimulating`, because we're still
          // waiting for the actual simulation to finish.
          this.updateCard({
            uuid: this.card.uuid,
            props: { conditionWarnings: response.data.warnings }
          });
          this.$emit("simulate-card");
        })
        .catch(error => {
          this.updateCard({
            uuid: this.card.uuid,
            props: { isSimulating: false, hasSimulationError: true }
          });

          if (error.response && error.response.data.errors) {
            this.updateCard({
              uuid: this.card.uuid,
              props: { conditionErrors: error.response.data.errors }
            });
          }
          this.$emit("simulation-error");
        });
    }
  },
  methods: {
    ...mapMutations({
      updateCard: "interactiveMap/updateCard"
    })
  }
});
</script>
