<template>
  <div>
    <template v-if="pathways.length === 0">
      <span class="red--text"
        >There are no pathways to
        <strong>{{ prediction.product_name }}</strong> in
        <strong v-if="organism">{{ organism.name }}</strong>
        <v-progress-circular
          v-else
          indeterminate
          color="primary"
          :width="2"
          :size="15"
        ></v-progress-circular
        >.</span
      >
    </template>
    <template v-else>
      <v-card>
        <div>
          <v-list class="mb-3">
            <v-list-tile>
              <h3>Results</h3>
              <v-spacer></v-spacer>
              <v-btn
                flat
                color="primary"
                :disabled="selected.length < 1"
                class="mt-3"
                @click="visualize()"
                ><v-icon>share</v-icon>VISUALIZE</v-btn
              >
            </v-list-tile>
          </v-list>
          <v-data-table
            v-model="selected"
            :items="filteredPathways"
            :expand="expand"
            :pagination.sync="pagination"
            :custom-sort="customSort"
            select-all
            :headers-length="9"
          >
            <template v-slot:headers="props">
              <tr>
                <th width="5%">
                  <v-checkbox
                    :input-value="props.all"
                    :indeterminate="props.indeterminate"
                    color="primary"
                    hide-details
                    @click.stop="toggleAll"
                  ></v-checkbox>
                </th>

                <th
                  width="12%"
                  :class="[
                    'column sortable default-cursor',
                    pagination.descending ? 'desc' : 'asc',
                    'manipulations' === pagination.sortBy ? 'active' : ''
                  ]"
                >
                  <span
                    @click="changeSort('manipulations')"
                    class="pointer ml-3"
                    >Manipulations <v-icon>arrow_upward</v-icon><br /><br
                  /></span>
                  <v-range-slider
                    @click.stop
                    v-model="filters.manipulations"
                    :min="range.manipulations[0]"
                    :max="range.manipulations[1]"
                    :disabled="
                      range.manipulations[1] - range.manipulations[0] === 0
                    "
                    step="1"
                    thumb-label
                    always-dirty
                    thumb-size="24"
                    color="primary"
                    class="mt-4"
                  ></v-range-slider>
                </th>

                <th
                  width="12%"
                  :class="[
                    'column sortable default-cursor',
                    pagination.descending ? 'desc' : 'asc',
                    'heterologous_reactions' === pagination.sortBy
                      ? 'active'
                      : ''
                  ]"
                >
                  <span
                    @click="changeSort('heterologous_reactions')"
                    class="pointer ml-3"
                    >Heterologous <v-icon>arrow_upward</v-icon><br /><span
                      >reactions</span
                    ></span
                  >

                  <v-range-slider
                    @click.stop
                    v-model="filters.heterologous_reactions"
                    :min="range.heterologous_reactions[0]"
                    :max="range.heterologous_reactions[1]"
                    :disabled="
                      range.heterologous_reactions[1] -
                        range.heterologous_reactions[0] ===
                        0
                    "
                    step="1"
                    thumb-label
                    thumb-size="24"
                    always-dirty
                    color="primary"
                    class="mt-4"
                  ></v-range-slider>
                </th>

                <th
                  width="12%"
                  :class="[
                    'column sortable default-cursor',
                    pagination.descending ? 'desc' : 'asc',
                    'knockouts' === pagination.sortBy ? 'active' : ''
                  ]"
                >
                  <span @click="changeSort('knockouts')" class="pointer ml-3"
                    >Knockouts <v-icon>arrow_upward</v-icon> <br /><br
                  /></span>

                  <v-range-slider
                    @click.stop
                    v-model="filters.knockouts"
                    :min="range.knockouts[0]"
                    :max="range.knockouts[1]"
                    :disabled="range.knockouts[1] - range.knockouts[0] === 0"
                    step="1"
                    thumb-label
                    thumb-size="24"
                    always-dirty
                    color="primary"
                    class="mt-4"
                  ></v-range-slider>
                </th>

                <th
                  width="12%"
                  :class="[
                    'column sortable default-cursor',
                    pagination.descending ? 'desc' : 'asc',
                    'fitness' === pagination.sortBy ? 'active' : ''
                  ]"
                >
                  <span @click="changeSort('fitness')" class="pointer ml-3"
                    >Fitness <v-icon>arrow_upward</v-icon><br /><span
                      class="caption"
                      ><span
                        >[Production * Growth / <br />
                        Carbon uptake]</span
                      ></span
                    ></span
                  >
                  <v-range-slider
                    @click.stop
                    v-model="filters.fitness"
                    :min="range.fitness[0]"
                    :max="range.fitness[1]"
                    :disabled="range.fitness[1] - range.fitness[0] === 0"
                    step="0.01"
                    thumb-label
                    thumb-size="28"
                    always-dirty
                    color="primary"
                    class="mt-2"
                  ></v-range-slider>
                </th>

                <th
                  width="10%"
                  :class="[
                    'column sortable default-cursor',
                    pagination.descending ? 'desc' : 'asc',
                    'yield' === pagination.sortBy ? 'active' : ''
                  ]"
                >
                  <span @click="changeSort('yield')" class="pointer ml-3"
                    >Yield <v-icon>arrow_upward</v-icon><br /><span
                      class="caption"
                      >[C-mol / C-mol]</span
                    ></span
                  >
                  <v-range-slider
                    @click.stop
                    v-model="filters.yield"
                    :min="range.yield[0]"
                    :max="range.yield[1]"
                    :disabled="range.yield[1] - range.yield[0] === 0"
                    step="0.01"
                    thumb-label
                    thumb-size="28"
                    always-dirty
                    color="primary"
                    class="mt-4"
                  ></v-range-slider>
                </th>

                <th
                  width="10%"
                  :class="[
                    'column sortable default-cursor',
                    pagination.descending ? 'desc' : 'asc',
                    'product' === pagination.sortBy ? 'active' : ''
                  ]"
                >
                  <span @click="changeSort('product')" class="pointer ml-3"
                    >Production <v-icon>arrow_upward</v-icon><br /><span
                      class="caption"
                      >[mmol gDW <sup>-1</sup> h <sup>-1</sup>]</span
                    ></span
                  >
                  <v-range-slider
                    @click.stop
                    v-model="filters.product"
                    :min="range.product[0]"
                    :max="range.product[1]"
                    :disabled="range.product[1] - range.product[0] === 0"
                    step="0.01"
                    thumb-label
                    thumb-size="28"
                    always-dirty
                    color="primary"
                    class="mt-4"
                  ></v-range-slider>
                </th>

                <th
                  width="10%"
                  :class="[
                    'column sortable default-cursor',
                    pagination.descending ? 'desc' : 'asc',
                    'biomass' === pagination.sortBy ? 'active' : ''
                  ]"
                >
                  <span @click="changeSort('biomass')" class="pointer ml-3"
                    >Growth <v-icon>arrow_upward</v-icon><br /><span
                      class="caption"
                      >[h <sup>-1</sup>]</span
                    ></span
                  >
                  <v-range-slider
                    @click.stop
                    v-model="filters.biomass"
                    :min="range.biomass[0]"
                    :max="range.biomass[1]"
                    :disabled="range.biomass[1] - range.biomass[0] === 0"
                    step="0.01"
                    thumb-label
                    thumb-size="28"
                    always-dirty
                    color="primary"
                    class="mt-4"
                  ></v-range-slider>
                </th>

                <th
                  width="17%"
                  :class="[
                    'column sortable default-cursor',
                    pagination.descending ? 'desc' : 'asc',
                    'method' === pagination.sortBy ? 'active' : ''
                  ]"
                >
                  <span @click="changeSort('method')" class="pointer ml-3"
                    >Method <v-icon>arrow_upward</v-icon> <br /><br
                  /></span>
                  <v-text-field
                    v-model="filters.method"
                    class="mb-4"
                    single-line
                    hide-details
                  ></v-text-field>
                </th>
              </tr>
            </template>
            <template v-slot:items="props">
              <tr
                @click="props.expanded = !props.expanded"
                class="expandable-row"
                :key="props.item.id"
              >
                <td @click.stop>
                  <v-checkbox
                    v-model="props.selected"
                    color="primary"
                    hide-details
                    @change="onCheckboxChange(props.item.method)"
                  ></v-checkbox>
                </td>
                <td>{{ props.item.manipulations.length }}</td>
                <td>{{ props.item.heterologous_reactions.length }}</td>
                <td>{{ props.item.knockouts.length }}</td>
                <td>{{ props.item.fitness | round }}</td>
                <td>{{ props.item.yield | round }}</td>
                <td>{{ props.item.product | round }}</td>
                <td>{{ props.item.biomass | round }}</td>
                <td>{{ props.item.method }}</td>
              </tr>
            </template>
            <template v-slot:no-data>
              <tr>
                <td colspan="100%" class="text-xs-center">
                  No data available
                </td>
              </tr>
            </template>
            <template v-slot:expand="{ item: jobPrediction }">
              <v-data-table
                :items="[jobPrediction]"
                :expand="expand"
                hide-actions
                hide-headers
              >
                <template v-slot:items="props">
                  <td width="5%"></td>
                  <td width="12%" class="expanded-cell">
                    <div class="link-list mt-2 mb-3">
                      <div
                        v-for="(manipulation, index) in sort(
                          jobPrediction.manipulations,
                          'value'
                        )"
                        :key="index"
                      >
                        <div v-if="index < 10">
                          <v-tooltip bottom>
                            <template v-slot:activator="{ on }">
                              <a
                                v-if="
                                  jobPrediction.method ===
                                    'PathwayPredictor+DifferentialFVA'
                                "
                                :href="
                                  `http://bigg.ucsd.edu/search?query=${
                                    manipulation.id
                                  }`
                                "
                                class="link"
                                target="_blank"
                                v-on="on"
                              >
                                {{
                                  `${indicators[manipulation.direction]} ${
                                    manipulation.id
                                  }`
                                }}
                              </a>
                            </template>
                            <span
                              >Score: {{ manipulation.value.toFixed(2) }}</span
                            >
                          </v-tooltip>
                        </div>
                        <div v-if="index >= 10" :hidden="!showAllManipulations">
                          <v-tooltip bottom>
                            <template v-slot:activator="{ on }">
                              <a
                                v-if="
                                  jobPrediction.method ===
                                    'PathwayPredictor+DifferentialFVA'
                                "
                                :href="
                                  `http://bigg.ucsd.edu/search?query=${
                                    manipulation.id
                                  }`
                                "
                                class="link"
                                target="_blank"
                                v-on="on"
                              >
                                {{
                                  `${indicators[manipulation.direction]} ${
                                    manipulation.id
                                  }`
                                }}
                              </a>
                            </template>
                            <span
                              >Score: {{ manipulation.value.toFixed(2) }}</span
                            >
                          </v-tooltip>
                        </div>
                      </div>
                      <div v-if="jobPrediction.manipulations.length > 10">
                        <a
                          @click="showAllManipulations = true"
                          :hidden="showAllManipulations"
                        >
                          ...
                        </a>
                      </div>
                      <div v-if="jobPrediction.manipulations.length > 0">
                        <span class="caption grey--text"
                          >↑ up-regulation<br />↓ down-regulation</span
                        >
                      </div>
                    </div>
                  </td>

                  <td width="12%" class="expanded-cell">
                    <div class="link-list mt-2 mb-3">
                      <div
                        v-for="(reactionId,
                        index) in jobPrediction.heterologous_reactions"
                        :key="index"
                      >
                        <v-menu offset-y max-width="200px" content-class="menu">
                          <template v-slot:activator="{ on }">
                            <a
                              :hidden="reactionId.startsWith('DM')"
                              class="link"
                              v-on="on"
                            >
                              {{
                                prediction.result.reactions[reactionId].name
                                  ? prediction.result.reactions[reactionId].name
                                  : reactionId
                              }}
                            </a>
                          </template>
                          <div class="text-xs-center caption ma-2">
                            {{
                              prediction.result.reactions[
                                reactionId
                              ].annotation.Description.split("`").join("")
                            }}
                          </div>
                          <v-divider></v-divider>
                          <v-container class="pa-2 ml-2">
                            <v-layout>
                              <v-flex>
                                <a
                                  class="link caption"
                                  :href="
                                    `https://www.metanetx.org/equa_info/${reactionId}`
                                  "
                                  target="_blank"
                                  >MetaNetX</a
                                >
                              </v-flex>
                              <v-flex>
                                <a
                                  v-if="
                                    prediction.result.reactions[reactionId]
                                      .annotation.EC
                                  "
                                  class="link caption"
                                  :href="
                                    `https://www.uniprot.org/uniprot/?query=${
                                      prediction.result.reactions[reactionId]
                                        .annotation.EC
                                    }`
                                  "
                                  target="_blank"
                                  >UniProt</a
                                >
                              </v-flex>
                              <v-flex>
                                <a
                                  v-if="
                                    prediction.result.reactions[reactionId]
                                      .annotation.EC
                                  "
                                  class="link caption"
                                  :href="
                                    `http://gmgc.embl.de/search/${
                                      prediction.result.reactions[reactionId]
                                        .annotation.EC
                                    }`
                                  "
                                  target="_blank"
                                  >GMGC</a
                                >
                              </v-flex>
                            </v-layout>
                          </v-container>
                        </v-menu>
                      </div>
                    </div>
                  </td>

                  <td width="12%" class="expanded-cell">
                    <div class="link-list mt-2 mb-3">
                      <div
                        v-for="(knockout, index) in jobPrediction.knockouts"
                        :key="index"
                      >
                        <div v-if="index < 10">
                          <a
                            :href="
                              `http://bigg.ucsd.edu/search?query=${knockout}`
                            "
                            class="link"
                            target="_blank"
                          >
                            {{ knockout }}
                          </a>
                        </div>
                        <div v-if="index >= 10" :hidden="!showAllKnockouts">
                          <a
                            :href="
                              `http://bigg.ucsd.edu/search?query=${knockout}`
                            "
                            class="link"
                            target="_blank"
                          >
                            {{ knockout }}
                          </a>
                        </div>
                      </div>
                      <div v-if="jobPrediction.knockouts.length > 10">
                        <a
                          @click="showAllKnockouts = true"
                          :hidden="showAllKnockouts"
                        >
                          ...
                        </a>
                      </div>
                    </div>
                  </td>
                  <td width="59%"></td>
                </template>
              </v-data-table>
            </template>
          </v-data-table>
        </div>
      </v-card>
    </template>
    <v-container fluid fill-height class="overlay" v-if="isVisualizing">
      <v-layout align-center justify-center>
        <v-progress-circular
          indeterminate
          size="40"
          :width="2"
          class="mr-2"
          color="white"
        ></v-progress-circular>
        <p class="display-1 white--text mb-0">Visualizing...</p>
      </v-layout>
    </v-container>
    <v-snackbar
      color="warning"
      v-model="isDiffFvaChecked"
      :timeout="12000"
      auto-height
    >
      Visualizing DifferentialFVA designs is not completely supported yet.
      Proceed with caution if you want to inspect the predicted pathways and
      knockouts on the interactive map.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapGetters } from "vuex";
import { PathwayPredictionResponse } from "@/views/Jobs/JobDetails.vue";
import { Prop } from "vue/types/options";
import axios from "axios";
import { AxiosResponse } from "axios";
import uuidv4 from "uuid/v4";
import * as settings from "@/utils/settings";
import { Card } from "@/store/modules/interactiveMap";

export default Vue.extend({
  name: "JobResultsTable",
  filters: {
    round: value => {
      return value >= 0.005 || value === 0
        ? +value.toFixed(2)
        : value.toExponential(1);
    }
  },
  props: {
    prediction: Object as Prop<PathwayPredictionResponse>
  },
  data: () => ({
    selected: [],
    expand: true,
    pagination: {
      rowsPerPage: 10
    },
    range: null,
    filters: null,
    indicators: {
      delta: "Δ",
      up: "↑",
      down: "↓"
    },
    showAllManipulations: false,
    showAllKnockouts: false,
    isVisualizing: false,
    isDiffFvaChecked: false
  }),
  computed: {
    pathways() {
      return [
        ...this.prediction.result.cofactor_swap,
        ...this.prediction.result.diff_fva,
        ...this.prediction.result.opt_gene
      ]
        .filter(pathway => pathway.biomass > 0)
        .map((pathway, index) => ({
          id: index,
          ...pathway
        }));
    },
    filteredPathways() {
      return this.pathways.filter(pathway => {
        return Object.keys(this.filters).every(filter => {
          if (
            filter === "manipulations" ||
            filter === "heterologous_reactions" ||
            filter === "knockouts"
          ) {
            return (
              pathway[filter].length >= this.filters[filter][0] &&
              pathway[filter].length <= this.filters[filter][1]
            );
          } else if (filter === "method") {
            return (
              pathway[filter]
                .toLowerCase()
                .indexOf(this.filters[filter].toLowerCase()) >= 0
            );
          }
          return (
            pathway[filter] >= this.filters[filter][0] &&
            pathway[filter] <= this.filters[filter][1]
          );
        });
      });
    },
    organism() {
      return this.$store.getters["organisms/getOrganismById"](
        this.prediction.organism_id
      );
    },
    model() {
      return this.$store.getters["models/getModelById"](
        this.prediction.model_id
      );
    }
  },
  created() {
    if (this.pathways.length > 0) {
      this.range = this.getRange();
      this.filters = this.getFilters();
    }
  },
  methods: {
    getRange() {
      return {
        manipulations: [
          this.pathways.reduce(
            (min, pathway) =>
              pathway.manipulations.length < min
                ? pathway.manipulations.length
                : min,
            this.pathways[0].manipulations.length
          ),
          this.pathways.reduce(
            (max, pathway) =>
              pathway.manipulations.length > max
                ? pathway.manipulations.length
                : max,
            this.pathways[0].manipulations.length
          )
        ],
        heterologous_reactions: [
          this.pathways.reduce(
            (min, pathway) =>
              pathway.heterologous_reactions.length < min
                ? pathway.heterologous_reactions.length
                : min,
            this.pathways[0].heterologous_reactions.length
          ),
          this.pathways.reduce(
            (max, pathway) =>
              pathway.heterologous_reactions.length > max
                ? pathway.heterologous_reactions.length
                : max,
            this.pathways[0].heterologous_reactions.length
          )
        ],
        knockouts: [
          this.pathways.reduce(
            (min, pathway) =>
              pathway.knockouts.length < min ? pathway.knockouts.length : min,
            this.pathways[0].knockouts.length
          ),
          this.pathways.reduce(
            (max, pathway) =>
              pathway.knockouts.length > max ? pathway.knockouts.length : max,
            this.pathways[0].knockouts.length
          )
        ],
        fitness: [
          Math.floor(
            this.pathways.reduce(
              (min, pathway) => (pathway.fitness < min ? pathway.fitness : min),
              this.pathways[0].fitness
            ) * 100
          ) / 100,
          Math.ceil(
            this.pathways.reduce(
              (max, pathway) => (pathway.fitness > max ? pathway.fitness : max),
              this.pathways[0].fitness
            ) * 100
          ) / 100
        ],
        yield: [
          Math.floor(
            this.pathways.reduce(
              (min, pathway) => (pathway.yield < min ? pathway.yield : min),
              this.pathways[0].yield
            ) * 100
          ) / 100,
          Math.ceil(
            this.pathways.reduce(
              (max, pathway) => (pathway.yield > max ? pathway.yield : max),
              this.pathways[0].yield
            ) * 100
          ) / 100
        ],
        product: [
          Math.floor(
            this.pathways.reduce(
              (min, pathway) => (pathway.product < min ? pathway.product : min),
              this.pathways[0].product
            ) * 100
          ) / 100,
          Math.ceil(
            this.pathways.reduce(
              (max, pathway) => (pathway.product > max ? pathway.product : max),
              this.pathways[0].product
            ) * 100
          ) / 100
        ],
        biomass: [
          Math.floor(
            this.pathways.reduce(
              (min, pathway) => (pathway.biomass < min ? pathway.biomass : min),
              this.pathways[0].biomass
            ) * 100
          ) / 100,
          Math.ceil(
            (this.pathways.reduce(
              (max, pathway) => (pathway.biomass > max ? pathway.biomass : max),
              this.pathways[0].biomass
            ) *
              100) /
              100
          )
        ]
      };
    },
    getFilters() {
      return {
        manipulations: [
          this.range.manipulations[0],
          this.range.manipulations[1]
        ],
        heterologous_reactions: [
          this.range.heterologous_reactions[0],
          this.range.heterologous_reactions[1]
        ],
        knockouts: [this.range.knockouts[0], this.range.knockouts[1]],
        fitness: [this.range.fitness[0], this.range.fitness[1]],
        yield: [this.range.yield[0], this.range.yield[1]],
        product: [this.range.product[0], this.range.product[1]],
        biomass: [this.range.biomass[0], this.range.biomass[1]],
        method: ""
      };
    },
    customSort(items, index, isDesc) {
      items.sort((a, b) => {
        if (
          index === "manipulations" ||
          index === "heterologous_reactions" ||
          index === "knockouts"
        ) {
          if (!isDesc) {
            return a[index].length - b[index].length;
          }
          return b[index].length - a[index].length;
        }
        if (!isDesc) {
          return a[index] < b[index] ? -1 : 1;
        }
        return b[index] < a[index] ? -1 : 1;
      });
      return items;
    },
    toggleAll() {
      if (this.selected.length) {
        this.selected = [];
      } else {
        this.selected = [...this.filteredPathways];
        if (
          this.selected.some(
            jobPrediction =>
              jobPrediction.method === "PathwayPredictor+DifferentialFVA"
          )
        ) {
          this.isDiffFvaChecked = true;
        }
      }
    },
    changeSort(column) {
      if (this.pagination.sortBy === column) {
        this.pagination.descending = !this.pagination.descending;
      } else {
        this.pagination.sortBy = column;
        this.pagination.descending = false;
      }
    },
    visualize() {
      this.isVisualizing = true;
      const predictions = this.selected.map(jobPrediction => {
        const addedReactionIds = [
          ...jobPrediction.heterologous_reactions,
          ...jobPrediction.synthetic_reactions
        ];
        const promises = this.getAddedReactions(addedReactionIds);
        Promise.all(promises).then((addedReactions: any[]) => {
          const card: Card = {
            uuid: uuidv4(),
            name: `Job #${this.prediction.id}`,
            designId: null,
            organism: this.organism,
            modelId: this.model.id,
            method: "pfba",
            modified: true,
            dataDriven: false,
            // Design card fields
            objective: {
              reaction: null,
              maximize: true
            },
            reactionAdditions: addedReactions,
            reactionKnockouts: [],
            geneKnockouts: [],
            editedBounds: [],
            // Data-driven card fields
            experiment: null,
            condition: null,
            conditionData: null,
            conditionWarnings: [],
            conditionErrors: [],
            // General simulation fields
            isSimulating: false,
            hasSimulationError: false,
            growthRate: null,
            fluxes: null
          };
          // Make sure the full model is available before adding the card.
          this.$store
            .dispatch("models/withFullModel", this.model.id)
            .then(() => {
              // Knockout genes or reactions depending on method
              this.$store.commit("interactiveMap/addCard", card);
              if (jobPrediction.method === "PathwayPredictor+OptGene") {
                jobPrediction.knockouts.forEach(geneId => {
                  this.$store.dispatch("interactiveMap/knockoutGene", {
                    uuid: card.uuid,
                    geneId: geneId
                  });
                  this.$store.commit("interactiveMap/updateKnockoutReaction", {
                    uuid: card.uuid,
                    gene: {
                      id: geneId,
                      name: geneId,
                      reactions: []
                    }
                  });
                });
              } else if (
                jobPrediction.method === "PathwayPredictor+DifferentialFVA" ||
                jobPrediction.method === "PathwayPredictor+CofactorSwap"
              ) {
                jobPrediction.knockouts.forEach(reactionId => {
                  this.$store.dispatch("interactiveMap/knockoutReaction", {
                    uuid: card.uuid,
                    reactionId: reactionId
                  });
                  this.$store.commit("interactiveMap/updateKnockoutReaction", {
                    uuid: card.uuid,
                    reaction: {
                      id: reactionId,
                      name: reactionId,
                      reactionString: "N/A"
                    }
                  });
                });
              } else {
                throw new Error(
                  `Method ${jobPrediction.method} is not recognized.`
                );
              }
              this.$router.push({ name: "interactiveMap" });
              this.isVisualizing = false;
            });
        });
      });
    },
    getAddedReactions(addedReactionIds) {
      return addedReactionIds.map(reactionId => {
        const mnxMetabolitesInReaction = this.prediction.result.reactions[
          reactionId
        ].metabolites;
        const mnxMetabolites = this.prediction.result.metabolites;
        const mnxMetaboliteIds = Object.keys(mnxMetabolitesInReaction);
        const reactions = this.prediction.result.reactions;

        const body = {
          ids: mnxMetaboliteIds,
          db_from: "mnx",
          db_to: "bigg",
          type: "Metabolite"
        };
        return axios
          .post(`${settings.apis.idMapper}`, body)
          .then((response: AxiosResponse<Object>) => {
            const biggIds = response.data["ids"];
            const metabolites: Object[] = [];
            for (const mnxId of mnxMetaboliteIds) {
              const { id, name, compartment } = mnxMetabolites[mnxId];
              const stoichiometry = mnxMetabolitesInReaction[mnxId];
              const metabolite = { id, name, compartment, stoichiometry };
              if (biggIds.hasOwnProperty(mnxId)) {
                metabolite.id = biggIds[mnxId][0];
                metabolite.compartment = "c";
              }
              metabolites.push(metabolite);
            }
            return {
              id: reactions[reactionId].id,
              name: reactions[reactionId].name,
              reactionString:
                reactions[reactionId].annotation &&
                reactions[reactionId].annotation.Description
                  ? reactions[reactionId].annotation.Description
                  : "N/A",
              lowerBound: reactions[reactionId].lower_bound,
              upperBound: reactions[reactionId].upper_bound,
              metabolites
            };
          })
          .catch(error => {
            this.$store.commit("setFetchError", error);
          });
      });
    },
    sort(items, value) {
      return items
        .slice()
        .sort((a, b) => (Math.abs(a[value]) < Math.abs(b[value]) ? 1 : -1));
    },
    onCheckboxChange(method) {
      if (method === "PathwayPredictor+DifferentialFVA") {
        this.isDiffFvaChecked = true;
      }
    }
  }
});
</script>

<style scoped>
.default-cursor {
  cursor: default !important;
}
.pointer {
  cursor: pointer;
}
.link {
  text-decoration: none;
}
.link-list {
  max-height: 250px;
  overflow-y: auto;
}
.menu {
  background: #fdfcfc;
  border-radius: 5px;
}
.expanded-cell {
  vertical-align: top;
}
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.15);
}
</style>
