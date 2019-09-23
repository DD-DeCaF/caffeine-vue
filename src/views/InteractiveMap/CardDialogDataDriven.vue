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
        class="ml-2 mr-2"
        label="Conditions"
        :items="conditions"
        v-model="selectedCondition"
        autoselectOnlyOption
        :loading="isLoadingConditions"
        :disabled="conditions === []"
        item-text="name"
        item-value="id"
        placeholder="Choose the experimental conditions you wish to simulate..."
        return-object
      ></v-autocomplete-extended>

      <v-autocomplete-extended
        class="ml-2"
        label="Sample"
        :items="samples"
        v-model="cardSample"
        autoselectOnlyOption
        :loading="isLoadingConditionData"
        :disabled="samples === []"
        item-text="start_time"
        item-value="id"
        placeholder="Choose the sample you wish to simulate..."
        return-object
      ></v-autocomplete-extended>
    </v-layout>

    <span
      v-if="isModifyingModel"
      class="subheading font-weight-thin text-sm-center mb-2"
    >
      We are currently figuring out how to enrich the metabolic model with the
      experimental data. This takes a few seconds, so please sit tight.
      Meanwhile, feel free to inspect the data below.
    </span>
    <v-progress-linear
      :indeterminate="true"
      v-if="isModifyingModel"
    ></v-progress-linear>

    <div v-if="organismMismatch" class="mb-2">
      <v-alert :value="true" type="warning">
        You are applying experimental data for the strain
        <em>{{ conditionOrganism.name }}</em> to a model based on a different
        organism (<em>{{ card.organism.name }}</em
        >). Some data points may not apply succesfully.
      </v-alert>
    </div>

    <v-layout v-if="card.conditionData && card.sample" column>
      <v-flex mb-1>
        <v-card>
          <v-subheader>Strain {{ card.conditionData.strain.name }}</v-subheader>
          <v-card-text>
            <code class="px-2">{{ card.conditionData.strain.genotype }}</code>
            <p class="mt-2">
              The genotype above is described in
              <a href="https://gnomic.readthedocs.io">gnomic</a> syntax, a
              grammar to represent genotypes and phenotypes developed at DTU
              Biosustain.
            </p>
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex mb-1>
        <v-card>
          <v-subheader>Medium {{ card.conditionData.medium.name }}</v-subheader>
          <v-data-table
            :headers="mediumHeaders"
            :items="card.conditionData.medium.compounds"
            class="elevation-1"
          >
            <template v-slot:items="{ item: compound }">
              <td>{{ compound.compound_name }}</td>
              <td>
                <CompoundLink
                  :identifier="compound.compound_identifier"
                  :namespace="compound.compound_namespace"
                />
              </td>
              <td>
                <span v-if="compound.mass_concentration">
                  {{ compound.mass_concentration }} <em>mmol/l</em>
                </span>
                <span v-else>Unspecified</span>
              </td>
            </template>
          </v-data-table>
        </v-card>
      </v-flex>

      <v-flex mb-1 v-if="card.sample.fluxomics.length > 0">
        <v-card>
          <v-subheader>Fluxomics</v-subheader>
          <v-data-table
            :headers="fluxomicsHeaders"
            :items="card.sample.fluxomics"
            class="elevation-1"
          >
            <template v-slot:items="{ item: reaction }">
              <td>{{ reaction.reaction_name }}</td>
              <td>
                <ReactionLink
                  :identifier="reaction.reaction_identifier"
                  :namespace="reaction.reaction_namespace"
                />
              </td>
              <td>
                {{ reaction.measurement }}
                <em>mmol gDW<sup>-1</sup> h<sup>-1</sup></em>
              </td>
              <td>
                <span v-if="reaction.uncertainty">
                  {{ reaction.uncertainty }}
                  <em>mmol gDW<sup>-1</sup> h<sup>-1</sup></em>
                </span>
                <span v-else>
                  No uncertainty
                </span>
              </td>
            </template>
          </v-data-table>
        </v-card>
      </v-flex>

      <v-flex mb-1 v-if="card.sample.metabolomics.length > 0">
        <v-card>
          <v-subheader>Metabolomics</v-subheader>
          <v-data-table
            :headers="metabolomicsHeaders"
            :items="card.sample.metabolomics"
            class="elevation-1"
          >
            <template v-slot:items="{ item: metabolite }">
              <td>{{ metabolite.compound_name }}</td>
              <td>
                <CompoundLink
                  :identifier="metabolite.compound_identifier"
                  :namespace="metabolite.compound_namespace"
                />
              </td>
              <td>
                {{ metabolite.measurement }}
                <em>mmol/l</em>
              </td>
              <td>
                <span v-if="metabolite.uncertainty">
                  {{ metabolite.uncertainty }}
                  <em>mmol/l</em>
                </span>
                <span v-else>
                  No uncertainty
                </span>
              </td>
            </template>
          </v-data-table>
        </v-card>
      </v-flex>

      <v-flex mb-1 v-if="card.sample.uptake_secretion_rates.length > 0">
        <v-card>
          <v-subheader>Uptake secretion rates</v-subheader>
          <v-data-table
            :headers="uptakeSecretionRatesHeaders"
            :items="card.sample.uptake_secretion_rates"
            class="elevation-1"
          >
            <template v-slot:items="{ item: rate }">
              <td>{{ rate.compound_name }}</td>
              <td>
                <CompoundLink
                  :identifier="rate.compound_identifier"
                  :namespace="rate.compound_namespace"
                />
              </td>
              <td>
                {{ rate.measurement }}
                <em>mmol gDW<sup>-1</sup> h<sup>-1</sup></em>
              </td>
              <td>
                <span v-if="rate.uncertainty">
                  {{ rate.uncertainty }}
                  <em>mmol gDW<sup>-1</sup> h<sup>-1</sup></em>
                </span>
                <span v-else>
                  No uncertainty
                </span>
              </td>
            </template>
          </v-data-table>
        </v-card>
      </v-flex>

      <v-flex mb-1 v-if="card.sample.molar_yields.length > 0">
        <v-card>
          <v-subheader>Molar yields</v-subheader>
          <v-data-table
            :headers="molarYieldsHeaders"
            :items="card.sample.molar_yields"
            class="elevation-1"
          >
            <template v-slot:items="{ item: molarYield }">
              <td>{{ molarYield.product_name }}</td>
              <td>
                <CompoundLink
                  :identifier="molarYield.product_identifier"
                  :namespace="molarYield.product_namespace"
                />
              </td>
              <td>{{ molarYield.substrate_name }}</td>
              <td>
                <CompoundLink
                  :identifier="molarYield.substrate_identifier"
                  :namespace="molarYield.substrate_namespace"
                />
              </td>
              <td>
                {{ molarYield.measurement }}
                <em
                  >mmol-{{ molarYield.product_name }} / mmol-{{
                    molarYield.substrate_name
                  }}</em
                >
              </td>
              <td>
                <span v-if="molarYield.uncertainty">
                  {{ molarYield.uncertainty }}
                  <em
                    >mmol-{{ molarYield.product_name }} / mmol-{{
                      molarYield.substrate_name
                    }}</em
                  >
                </span>
                <span v-else>
                  No uncertainty
                </span>
              </td>
            </template>
          </v-data-table>
        </v-card>
      </v-flex>

      <v-flex mb-1 v-if="card.sample.growth_rate">
        <v-card>
          <v-subheader>Growth rate</v-subheader>
          <v-data-table
            :headers="growthRateHeaders"
            :items="[card.sample.growth_rate]"
            class="elevation-1"
          >
            <template v-slot:items="{ item: growthRate }">
              <td>
                {{ growthRate.measurement }}
                <em>h<sup>-1</sup></em>
              </td>
              <td>
                <span v-if="growthRate.uncertainty">
                  {{ growthRate.uncertainty }}
                  <em>h<sup>-1</sup></em>
                </span>
                <span v-else>
                  No uncertainty
                </span>
              </td>
            </template>
          </v-data-table>
        </v-card>
      </v-flex>
    </v-layout>

    <ModificationsTable
      v-if="modifications.length > 0"
      :modifications="modifications"
      :readonly="true"
    />

    <v-expansion-panel v-if="card.sampleWarnings.length" class="mt-2">
      <v-expansion-panel-content>
        <template v-slot:header>
          <div>
            <v-badge color="warning">
              <template v-slot:badge
                >{{ card.sampleWarnings.length }}
              </template>
              <span>Warnings</span>
            </v-badge>
          </div>
        </template>
        <div v-for="warning in card.sampleWarnings" :key="warning" class="mt-2">
          <v-alert :value="true" type="warning">
            {{ warning }}
          </v-alert>
        </div>
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel v-if="card.sampleErrors.length" class="mt-2">
      <v-expansion-panel-content>
        <template v-slot:header>
          <div>
            <v-badge color="error">
              <template v-slot:badge
                >{{ card.sampleErrors.length }}
              </template>
              <span>Errors</span>
            </v-badge>
          </div>
        </template>
        <div v-for="error in card.sampleErrors" :key="error" class="mt-2">
          <v-alert :value="true" type="error">
            {{ error }}
          </v-alert>
        </div>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapMutations } from "vuex";
import axios from "axios";
import * as settings from "@/utils/settings";
import ModificationsTable from "@/components/ModificationsTable.vue";
import ReactionLink from "@/components/ReactionLink.vue";
import CompoundLink from "@/components/CompoundLink.vue";
import { Metabolite } from "@/store/modules/interactiveMap";
import { buildReactionString } from "@/utils/reaction";

export default Vue.extend({
  name: "CardDialogDataDriven",
  components: {
    ModificationsTable,
    ReactionLink,
    CompoundLink
  },
  props: ["card", "modifications"],
  data: () => ({
    conditions: [],
    selectedCondition: null,
    conditionOrganism: null,
    isLoadingConditions: false,
    isLoadingConditionData: false,
    isModifyingModel: false,
    mediumHeaders: [
      { text: "Compound", sortable: false },
      { text: "Identifier", sortable: false },
      {
        text: "Mass concentration",
        sortable: false
      }
    ],
    fluxomicsHeaders: [
      { text: "Reaction", sortable: false },
      { text: "Identifier", sortable: false },
      { text: "Measurement", sortable: false },
      { text: "Uncertainty", sortable: false }
    ],
    metabolomicsHeaders: [
      { text: "Metabolite", sortable: false },
      { text: "Identifier", sortable: false },
      { text: "Measurement", sortable: false },
      { text: "Uncertainty", sortable: false }
    ],
    uptakeSecretionRatesHeaders: [
      { text: "Compound", sortable: false },
      { text: "Identifier", sortable: false },
      { text: "Measurement", sortable: false },
      { text: "Uncertainty", sortable: false }
    ],
    molarYieldsHeaders: [
      { text: "Product", sortable: false },
      { text: "Product Identifier", sortable: false },
      { text: "Substrate", sortable: false },
      { text: "Substrate Identifier", sortable: false },
      { text: "Measurement", sortable: false },
      { text: "Uncertainty", sortable: false }
    ],
    growthRateHeaders: [
      { text: "Measurement", sortable: false },
      { text: "Uncertainty", sortable: false }
    ]
  }),
  computed: {
    experiments() {
      return this.$store.state.experiments.experiments;
    },
    samples() {
      if (!this.card.conditionData) {
        return [];
      }
      return this.card.conditionData.samples;
    },
    organismMismatch() {
      if (!this.card.organism || !this.conditionOrganism) {
        return false;
      }
      return this.card.organism.id != this.conditionOrganism.id;
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
    cardSample: {
      get() {
        return this.card.sample;
      },
      set(sample) {
        this.updateCard({
          uuid: this.card.uuid,
          props: { sample: sample }
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
        .get(`${settings.apis.warehouse}/conditions`)
        .then(response => {
          this.conditions = response.data.filter(condition => {
            return condition.experiment_id === this.card.experiment.id;
          });
        })
        .catch(error => {
          this.$emit("load-data-error");
        })
        .then(() => {
          this.isLoadingConditions = false;
        });
    },
    selectedCondition() {
      this.conditionOrganism = null;
      this.updateCard({
        uuid: this.card.uuid,
        props: { conditionData: null, sample: null }
      });

      if (!this.selectedCondition) {
        return;
      }

      // Load condition data
      this.isLoadingConditionData = true;
      axios
        .get(
          `${settings.apis.warehouse}/conditions/${
            this.selectedCondition.id
          }/data`
        )
        .then(response => {
          this.updateCard({
            uuid: this.card.uuid,
            props: { conditionData: response.data }
          });
          this.conditionOrganism = this.$store.getters[
            "organisms/getOrganismById"
          ](response.data.strain.organism_id);
        })
        .catch(error => {
          this.$emit("load-data-error");
        })
        .then(() => {
          this.isLoadingConditionData = false;
        });
    },
    "card.sample"() {
      if (!this.card.modelId || !this.card.sample) {
        return;
      }

      this.updateCard({
        uuid: this.card.uuid,
        props: {
          // Reset warnings and errors
          sampleWarnings: [],
          sampleErrors: [],
          hasSimulationError: false,
          solverStatus: null,
          // We'll be modifying the model before simulating, but just re-use the
          // loading flag for `isSimulating` to indicate that _something_ is
          // going on.
          isSimulating: true,
          // Remove any previous operations from the card.
          reactionDeletions: [],
          reactionAdditions: [],
          reactionKnockouts: [],
          geneKnockouts: [],
          editedBounds: []
        }
      });

      // Map data to the expected payload for modification service
      const medium = this.card.conditionData.medium.compounds.map(c => ({
        name: c.compound_name,
        identifier: c.compound_identifier,
        namespace: c.compound_namespace,
        mass_concentration: c.mass_concentration
      }));
      const genotype = this.card.conditionData.strain.genotype;
      const fluxomics = this.card.sample.fluxomics.map(f => ({
        name: f.reaction_name,
        identifier: f.reaction_identifier,
        namespace: f.reaction_namespace,
        measurement: f.measurement,
        uncertainty: f.uncertainty
      }));
      const metabolomics = this.card.sample.metabolomics.map(m => ({
        name: m.compound_name,
        identifier: m.compound_identifier,
        namespace: m.compound_namespace,
        measurement: m.measurement,
        uncertainty: m.uncertainty
      }));
      const uptakeSecretionRates = this.card.sample.uptake_secretion_rates.map(
        u => ({
          name: u.compound_name,
          identifier: u.compound_identifier,
          namespace: u.compound_namespace,
          measurement: u.measurement,
          uncertainty: u.uncertainty
        })
      );
      const molarYields = this.card.sample.molar_yields.map(m => ({
        product_name: m.product_name,
        product_identifier: m.product_identifier,
        product_namespace: m.product_namespace,
        substrate_name: m.substrate_name,
        substrate_identifier: m.substrate_identifier,
        substrate_namespace: m.substrate_namespace,
        measurement: m.measurement,
        uncertainty: m.uncertainty
      }));
      const growthRate = this.card.sample.growth_rate
        ? {
            measurement: this.card.sample.growth_rate.measurement,
            uncertainty: this.card.sample.growth_rate.uncertainty
          }
        : null;

      this.isModifyingModel = true;
      axios
        .post(
          `${settings.apis.simulations}/models/${this.card.modelId}/modify`,
          {
            medium: medium,
            genotype: genotype,
            fluxomics: fluxomics,
            metabolomics: metabolomics,
            uptake_secretion_rates: uptakeSecretionRates,
            molar_yields: molarYields,
            growth_rate: growthRate
          }
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
                  compartment: metaboliteIdWithCompartment.substring(index + 1),
                  // TODO: get name and formula data
                  name: "N/A",
                  formula: "N/A"
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
            props: { sampleWarnings: response.data.warnings }
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
              props: { sampleErrors: error.response.data.errors }
            });
          }
          this.$emit("simulation-error");
        })
        .then(() => {
          this.isModifyingModel = false;
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
