/* eslint-disable prettier/prettier */
<template>
  <v-dialog v-model="showDialog" width="1200">
    <v-card class="pa-2">
      <v-tabs grow color="primary" dark>
        <v-tabs-slider color="white"></v-tabs-slider>
        <v-tab>
          Simulation Configuration
        </v-tab>
        <v-tab-item>
          <v-form>
            <v-container>
              <v-layout row wrap>
                <v-flex xs6>
                  <p class="headline">Modify data-driven simulation</p>
                </v-flex>
                <v-flex xs6>
                  <p class="text-xs-right subheading mb-0 mt-2 font-italic">
                    Simulation status:
                    <span>{{ simulationStatus.text }}</span>
                    <v-progress-circular
                      v-if="simulationStatus.loader"
                      indeterminate
                      size="12"
                      :width="1"
                    ></v-progress-circular>
                  </p>
                </v-flex>
              </v-layout>

              <v-progress-linear
                v-if="card.isSimulating"
                :indeterminate="true"
                class="my-0"
              ></v-progress-linear>
              <div v-else style="height: 7px"></div>

              <v-layout wrap>
                <v-flex xs12 md3>
                  <v-text-field
                    label="Card name"
                    v-model="cardName"
                    required
                  ></v-text-field>
                </v-flex>

                <v-flex xs12 md3>
                  <v-autocomplete-extended
                    label="Experiment"
                    :items="experiments"
                    v-model="cardExperiment"
                    autoselectOnlyOption
                    item-text="name"
                    item-value="id"
                    placeholder="Choose the experiment you wish to simulate..."
                    return-object
                  ></v-autocomplete-extended>
                </v-flex>

                <v-flex xs12 md3>
                  <v-autocomplete-extended
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
                </v-flex>

                <v-flex xs12 md3>
                  <v-autocomplete-extended
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
                </v-flex>
              </v-layout>

              <v-layout>
                <v-flex xs12 md6>
                  <v-select-extended
                    label="Model"
                    :items="modelsByOrganism"
                    v-model="cardModel"
                    autoselectOnlyOption
                    item-text="name"
                    item-value="id"
                    :hint="modelHint"
                    persistent-hint
                    return-object
                    @change="onModelChange"
                  ></v-select-extended>
                </v-flex>
                <v-flex xs12 md6>
                  <v-select-extended
                    label="Method"
                    :items="methods"
                    v-model="cardMethod"
                    autoselectOnlyOption
                    item-text="name"
                    item-value="id"
                    prepend-icon="help"
                    @click:prepend="$emit('open-method-help-dialog')"
                    @change="$emit('simulate-card')"
                  ></v-select-extended>
                </v-flex>
              </v-layout>

          <v-layout v-if="card.conditionData && card.sample" column>
            <v-flex mb-1>
              <v-card>
                <v-subheader
                  >Strain {{ card.conditionData.strain.name }}</v-subheader
                >
                <v-card-text v-if="card.conditionData.strain.genotype">
                  <code class="px-2">{{
                    card.conditionData.strain.genotype
                  }}</code>
                  <p class="mt-2">
                    The genotype above is described in
                    <a-extended href="https://gnomic.readthedocs.io"
                      >gnomic</a-extended
                    >syntax, a grammar to represent genotypes and phenotypes
                    developed at DTU Biosustain.
                  </p>
                </v-card-text>
                <v-card-text v-else>
                  There are no genotype modifications in this strain.
                </v-card-text>
              </v-card>
            </v-flex>
            <v-flex mb-1>
              <v-card>
                <v-subheader
                  >Medium {{ card.conditionData.medium.name }}</v-subheader
                >
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

            <v-flex mb-1 v-if="card.sample.proteomics.length > 0">
              <v-card>
                <v-subheader>Proteomics</v-subheader>
                <v-data-table
                  :headers="proteomicsHeaders"
                  :items="card.sample.proteomics"
                  class="elevation-1"
                >
                  <template v-slot:items="{ item: protein }">
                    <td>
                      <a-extended
                        :href="
                          `https://www.uniprot.org/uniprot/${protein.identifier}`
                        "
                        target="_blank"
                        >{{ protein.identifier }}</a-extended
                      >
                    </td>
                    <td>{{ protein.name }}</td>
                    <td>{{ protein.full_name }}</td>
                    <td>
                      {{ displayGeneIds(protein.gene) }}
                    </td>
                    <td>
                      {{ protein.measurement }}
                      <em>mmol gDW<sup>-1</sup></em>
                    </td>
                    <td>
                      <span v-if="protein.uncertainty">
                        {{ protein.uncertainty }}
                        <em>mmol gDW<sup>-1</sup></em>
                      </span>
                      <span v-else>
                        No uncertainty
                      </span>
                    </td>
                  </template>
                </v-data-table>
              </v-card>
            </v-flex>

                <v-flex
                  mb-1
                  v-if="card.sample.uptake_secretion_rates.length > 0"
                >
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
            </v-container>
          </v-form>
        </v-tab-item>
        <v-tab :disabled="modifications.length === 0">
          Model Modifications
        </v-tab>
        <v-tab-item>
          <v-container>
            <ModificationsTable
              v-if="modifications.length > 0"
              :modifications="modifications"
              :readonly="true"
            />
          </v-container>
        </v-tab-item>
        <v-tab
          :disabled="!(card.sampleErrors.length || card.sampleWarnings.length)"
        >
          <v-badge
            color="error"
            :value="card.sampleErrors.length + card.sampleWarnings.length"
            v-if="card.sampleErrors.length"
          >
            <template v-slot:badge
              >{{ card.sampleWarnings.length + card.sampleErrors.length }}
            </template>
            <span>Warnings and Errors</span>
          </v-badge>
          <v-badge
            color="warning"
            :value="card.sampleErrors.length + card.sampleWarnings.length"
            v-else
          >
            <template v-slot:badge
              >{{ card.sampleWarnings.length + card.sampleErrors.length }}
            </template>
            <span>Warnings and Errors</span>
          </v-badge>
        </v-tab>
        <v-tab-item>
          <v-container>
            <v-expansion-panel
              v-if="card.sampleWarnings.length || card.sampleErrors.length"
              class="mt-2"
            >
              <v-expansion-panel-content>
                <template v-slot:header>
                  <div>
                    <v-badge color="error" v-if="card.sampleErrors.length">
                      <template v-slot:badge
                        >{{
                          card.sampleWarnings.length + card.sampleErrors.length
                        }}
                      </template>
                      <span>Warnings and Errors</span>
                    </v-badge>
                    <v-badge color="warning" v-else>
                      <template v-slot:badge
                        >{{
                          card.sampleWarnings.length + card.sampleErrors.length
                        }}
                      </template>
                      <span>Warnings and Errors</span>
                    </v-badge>
                  </div>
                </template>
                <div
                  v-for="error in card.sampleErrors"
                  :key="error"
                  class="mt-2"
                >
                  <v-alert :value="true" type="error">
                    {{ error }}
                  </v-alert>
                </div>
                <div
                  v-for="warning in card.sampleWarnings"
                  :key="warning"
                  class="mt-2"
                >
                  <v-alert :value="true" type="warning">
                    {{ warning }}
                  </v-alert>
                </div>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-container>
        </v-tab-item>
      </v-tabs>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-progress-circular
          v-if="card.isSimulating"
          indeterminate
          size="12"
          :width="1"
        ></v-progress-circular>
        <span v-if="card.isSimulating" class="mx-2">
          <em>Simulating...</em>
        </span>
        <v-btn color="primary" @click="showDialog = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
import { ModelItem } from "@/store/modules/models";
import { flatten } from "lodash";

export default Vue.extend({
  name: "CardDialogDataDriven",
  components: {
    ModificationsTable,
    ReactionLink,
    CompoundLink
  },
  props: ["card", "model", "modifications", "value"],
  data: () => ({
    methods: [
      { id: "fba", name: "Flux Balance Analysis (FBA)" },
      { id: "pfba", name: "Parsimonious FBA" },
      { id: "fva", name: "Flux Variability Analysis (FVA)" },
      { id: "pfba-fva", name: "Parsimonious FVA" }
    ],
    conditions: [],
    selectedCondition: null,
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
    proteomicsHeaders: [
      { text: "Identifier", sortable: false },
      { text: "Name", sortable: false },
      { text: "Full name", sortable: false },
      { text: "Gene ids", sortable: false },
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
    modelsByOrganism() {
      if (!this.card.organism) {
        return [];
      }
      return this.$store.state.models.models.filter(model => {
        return model.organism_id === this.card.organism.id;
      });
    },
    modelHint() {
      if (!this.card.conditionData) {
        return "This list will be populated based on the strain used in the experiment.";
      } else {
        return `Available models for ${this.card.organism.name}.`;
      }
    },
    experiments() {
      return this.$store.state.experiments.experiments;
    },
    samples() {
      if (!this.card.conditionData) {
        return [];
      }
      return this.card.conditionData.samples;
    },
    cardName: {
      get() {
        return this.card.name;
      },
      set(name) {
        this.updateCard({
          uuid: this.card.uuid,
          props: { name: name }
        });
      }
    },
    cardModel: {
      get() {
        return this.model;
      },
      set(model: ModelItem) {
        this.updateCard({
          uuid: this.card.uuid,
          props: { modelId: model.id }
        });
      }
    },
    cardMethod: {
      get() {
        return this.card.method;
      },
      set(method) {
        this.updateCard({
          uuid: this.card.uuid,
          props: { method: method }
        });
      }
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
    },
    showDialog: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("input", value);
      }
    },
    simulationStatus() {
      const status = {
        text: "Unknown",
        loader: false
      };
      if (this.card.solverStatus) {
        if (this.card.solverStatus === "optimal") {
          status.text = "Successful";
        } else if (this.card.solverStatus === "infeasible") {
          status.text = "Infeasible";
        }
      } else if (this.card.sampleErrors.length > 0) {
        status.text = "Can not integrate data";
      } else if (this.card.hasSimulationError) {
        status.text = "Error during simulation";
      } else if (!this.model && !this.card.sample) {
        status.text = "Please select model and sample";
      } else if (!this.model) {
        status.text = "Please select model";
      } else if (!this.card.sample) {
        status.text = "Please select sample";
      } else if (this.isModifyingModel) {
        status.text = "Integrating data...";
        status.loader = true;
      } else if (this.card.isSimulating) {
        status.text = "Simulating...";
        status.loader = true;
      }
      return status;
    }
  },
  watch: {
    "card.experiment"() {
      // Experiment changed - reset related condition.
      this.conditions = [];
      this.selectedCondition = null;

      if (!this.card.experiment) {
        return;
      }

      // Load the conditions for the selected experiment.
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
      // Selected condition changed - reset related fields.
      this.updateCard({
        uuid: this.card.uuid,
        props: {
          conditionData: null,
          sample: null,
          organism: null
        }
      });

      if (!this.selectedCondition) {
        return;
      }

      // Load condition data
      this.isLoadingConditionData = true;
      axios
        .get(
          `${settings.apis.warehouse}/conditions/${this.selectedCondition.id}/data`
        )
        .then(response => {
          const organism = this.$store.getters["organisms/getOrganismById"](
            response.data.strain.organism_id
          );
          this.updateCard({
            uuid: this.card.uuid,
            props: { conditionData: response.data, organism: organism }
          });
        })
        .catch(error => {
          this.$emit("load-data-error");
        })
        .then(() => {
          this.isLoadingConditionData = false;
        });
    },
    "card.organism"() {
      // Organism has changed - reset the selected model.
      this.updateCard({
        uuid: this.card.uuid,
        props: { modelId: null }
      });
    },
    "card.sample"() {
      // Sample has changed - reset operations and simulation results.
      this.resetCardSimulation();
      this.resetCardModifications();
      if (!this.card.sample) {
        return;
      }

      // Re-run adapter and simulation to get new results.
      this.integrateData();
    }
  },
  methods: {
    onModelChange() {
      // Reset all modifications when the selected model changes.
      // Note: We cannot simply watch `model` with `immediate: true`, because
      // that would reset modifications when cards are added from other
      // components, i.e., when visualizing jobs or designs.
      this.resetCardSimulation();
      this.resetCardModifications();
      this.integrateData();
    },
    resetCardModifications() {
      this.updateCard({
        uuid: this.card.uuid,
        props: {
          // Reset the objective
          objective: {
            reaction: null,
            maximize: true
          },
          // Remove any previous operations from the card.
          reactionDeletions: [],
          reactionAdditions: [],
          reactionKnockouts: [],
          geneKnockouts: [],
          editedBounds: []
        }
      });
    },
    resetCardSimulation() {
      this.updateCard({
        uuid: this.card.uuid,
        props: {
          // Reset warnings and errors
          sampleWarnings: [],
          sampleErrors: [],
          hasSimulationError: false,
          solverStatus: null,
          // Reset simulation results
          fluxes: null,
          growthRate: null
        }
      });
    },
    integrateData() {
      // Post the selected sample data to the simulation adapter backend, and
      // recieve back a list of operations for the simulation. The operations
      // are stored on the card and a new simulation is triggered.

      // Callers don't need to check that we're in a valid state for this, so
      // check here.
      if (!this.card.modelId || !this.card.sample) {
        return;
      }

      // We'll be modifying the model before simulating, but just re-use the
      // loading flag for `isSimulating` to indicate that _something_ is going
      // on.
      this.updateCard({
        uuid: this.card.uuid,
        props: {
          isSimulating: true
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
      // TODO: Should proteomics be excluded if chosen model is not
      // enzyme-constrained? Currently, the backend will give a warning and
      // ignore the data if that happens.
      const proteomics = this.card.sample.proteomics.map(p => ({
        identifier: p.identifier,
        measurement: p.measurement,
        uncertainty: p.uncertainty
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
            proteomics: proteomics,
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
            props: {
              sampleWarnings: response.data.warnings
            }
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
              props: {
                sampleErrors: error.response.data.errors
              }
            });
          }
          this.$emit("simulation-error");
        })
        .then(() => {
          this.isModifyingModel = false;
        });
    },
    ...mapMutations({
      updateCard: "interactiveMap/updateCard"
    }),
    displayGeneIds(gene) {
      return flatten(Object.values(gene)).join(", ");
    }
  }
});
</script>
