<template>
  <v-card>
    <div>
      <v-list>
        <v-list-tile>
          <h3>Results</h3>
          <v-spacer></v-spacer>
          <v-btn
            flat
            color="primary"
            :disabled="selected.length < 1"
            class="mt-3"
            ><v-icon>share</v-icon>VISUALIZE</v-btn
          >
        </v-list-tile>
      </v-list>
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="filteredPathways"
        :expand="expand"
        :pagination.sync="pagination"
        :search="search"
        select-all
      >
        <template v-slot:headers="props">
          <tr>
            <th>
              <v-checkbox
                :input-value="props.all"
                :indeterminate="props.indeterminate"
                color="primary"
                hide-details
                @click.stop="toggleAll"
              ></v-checkbox>
            </th>

            <th
              :class="[
                'column sortable',
                pagination.descending ? 'desc' : 'asc',
                'manipulation' === pagination.sortBy ? 'active' : ''
              ]"
              @click="changeSort('manipulation')"
            >
              <v-icon>arrow_upward</v-icon>
              Manipulations
              <v-range-slider
                @click.stop
                v-model="filters.manipulations"
                :min="range.manipulations[0]"
                :max="range.manipulations[1]"
                step="0"
                thumb-label
                always-dirty
                thumb-size="24"
                color="primary"
                class="mt-4"
              ></v-range-slider>
            </th>

            <th
              :class="[
                'column sortable',
                pagination.descending ? 'desc' : 'asc',
                'heterologous_reactions' === pagination.sortBy ? 'active' : ''
              ]"
              @click="changeSort('heterologous_reactions')"
            >
              <v-icon>arrow_upward</v-icon>
              Heterologous reactions
              <v-range-slider
                @click.stop
                v-model="filters.heterologous_reactions"
                :min="range.heterologous_reactions[0]"
                :max="range.heterologous_reactions[1]"
                step="0"
                thumb-label
                thumb-size="24"
                always-dirty
                color="primary"
                class="mt-4"
              ></v-range-slider>
            </th>

            <th
              :class="[
                'column sortable',
                pagination.descending ? 'desc' : 'asc',
                'knockouts' === pagination.sortBy ? 'active' : ''
              ]"
              @click="changeSort('knockouts')"
            >
              <v-icon>arrow_upward</v-icon>
              Knockouts
              <v-range-slider
                @click.stop
                @change="filters"
                v-model="filters.knockouts"
                :min="range.knockouts[0]"
                :max="range.knockouts[1]"
                step="0"
                thumb-label
                thumb-size="24"
                always-dirty
                color="primary"
                class="mt-4"
              ></v-range-slider>
            </th>

            <th
              :class="[
                'column sortable',
                pagination.descending ? 'desc' : 'asc',
                'fitness' === pagination.sortBy ? 'active' : ''
              ]"
              @click="changeSort('fitness')"
            >
              <v-icon>arrow_upward</v-icon>
              Fitness
              <v-range-slider
                @click.stop
                v-model="filters.fitness"
                :min="range.fitness[0]"
                :max="range.fitness[1]"
                step="0"
                thumb-label
                thumb-size="24"
                always-dirty
                color="primary"
                class="mt-4"
              ></v-range-slider>
            </th>

            <th
              :class="[
                'column sortable',
                pagination.descending ? 'desc' : 'asc',
                'yield' === pagination.sortBy ? 'active' : ''
              ]"
              @click="changeSort('yield')"
            >
              <v-icon>arrow_upward</v-icon>
              Yield
              <v-range-slider
                @click.stop
                v-model="filters.yield"
                :min="range.yield[0]"
                :max="range.yield[1]"
                step="0"
                thumb-label
                thumb-size="24"
                always-dirty
                color="primary"
                class="mt-4"
              ></v-range-slider>
            </th>

            <th
              :class="[
                'column sortable',
                pagination.descending ? 'desc' : 'asc',
                'product' === pagination.sortBy ? 'active' : ''
              ]"
              @click="changeSort('product')"
            >
              <v-icon>arrow_upward</v-icon>
              Production
              <v-range-slider
                @click.stop
                v-model="filters.product"
                :min="range.product[0]"
                :max="range.product[1]"
                step="0"
                thumb-label
                thumb-size="24"
                always-dirty
                color="primary"
                class="mt-4"
              ></v-range-slider>
            </th>

            <th
              :class="[
                'column sortable',
                pagination.descending ? 'desc' : 'asc',
                'biomass' === pagination.sortBy ? 'active' : ''
              ]"
              @click="changeSort('biomass')"
            >
              <v-icon>arrow_upward</v-icon>
              Biomass
              <v-range-slider
                @click.stop
                v-model="filters.biomass"
                :min="range.biomass[0]"
                :max="range.biomass[1]"
                step="0"
                thumb-label
                thumb-size="24"
                always-dirty
                color="primary"
                class="mt-4"
              ></v-range-slider>
            </th>

            <th
              :class="[
                'column sortable',
                pagination.descending ? 'desc' : 'asc',
                'method' === pagination.sortBy ? 'active' : ''
              ]"
              @click="changeSort('method')"
            >
              <v-icon>arrow_upward</v-icon>
              Method
              <v-text-field
                v-model="search"
                append-icon="search"
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
              ></v-checkbox>
            </td>
            <td>{{ props.item.manipulations.length }}</td>
            <td>{{ props.item.heterologous_reactions.length }}</td>
            <td>{{ props.item.knockouts.length }}</td>
            <td>{{ props.item.fitness }}</td>
            <td>{{ props.item.yield }}</td>
            <td>{{ props.item.product }}</td>
            <td>{{ props.item.biomass }}</td>
            <td>{{ props.item.method }}</td>
          </tr>
        </template>
        <template v-slot:expand="props">
          <tr>
            Expanded
          </tr>
        </template>
      </v-data-table>
    </div>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { PathwayPredictionResponse } from "@/components/Jobs/JobDetails.vue";
import { Prop } from "vue/types/options";

export default Vue.extend({
  name: "JobResultsTable",
  props: {
    prediction: Object as Prop<PathwayPredictionResponse>
  },
  data: () => ({
    selected: [],
    search: "",
    expand: true,
    headers: [
      { text: "Manipulations", value: "manipulations" },
      { text: "Heterologous reactions", value: "heterologous_reactions" },
      { text: "Knockouts", value: "knockouts" },
      { text: "Fitness", value: "fitness" },
      { text: "Yield", value: "yield" },
      { text: "Production", value: "product" },
      { text: "Growth", value: "biomass" },
      { text: "Method", value: "method" }
    ],
    pagination: {
      rowsPerPage: 25
    },
    range: null,
    filters: null
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
          }
          return (
            pathway[filter] >= this.filters[filter][0] &&
            pathway[filter] <= this.filters[filter][1]
          );
        });
      });
    },
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
          this.pathways.reduce(
            (min, pathway) => (pathway.fitness < min ? pathway.fitness : min),
            this.pathways[0].fitness
          ),
          this.pathways.reduce(
            (max, pathway) => (pathway.fitness > max ? pathway.fitness : max),
            this.pathways[0].fitness
          )
        ],
        yield: [
          this.pathways.reduce(
            (min, pathway) => (pathway.yield < min ? pathway.yield : min),
            this.pathways[0].yield
          ),
          this.pathways.reduce(
            (max, pathway) => (pathway.yield > max ? pathway.yield : max),
            this.pathways[0].yield
          )
        ],
        product: [
          this.pathways.reduce(
            (min, pathway) => (pathway.product < min ? pathway.product : min),
            this.pathways[0].product
          ),
          this.pathways.reduce(
            (max, pathway) => (pathway.product > max ? pathway.product : max),
            this.pathways[0].product
          )
        ],
        biomass: [
          this.pathways.reduce(
            (min, pathway) => (pathway.biomass < min ? pathway.biomass : min),
            this.pathways[0].biomass
          ),
          this.pathways.reduce(
            (max, pathway) => (pathway.biomass > max ? pathway.biomass : max),
            this.pathways[0].biomass
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
        biomass: [this.range.biomass[0], this.range.biomass[1]]
      };
    },
    toggleAll() {
      if (this.selected.length) {
        this.selected = [];
      } else {
        this.selected = [...this.pathways];
      }
    },
    changeSort(column) {
      if (this.pagination.sortBy === column) {
        this.pagination.descending = !this.pagination.descending;
      } else {
        this.pagination.sortBy = column;
        this.pagination.descending = false;
      }
    }
  },
  created() {
    this.range = this.getRange();
    this.filters = this.getFilters();
  }
});
</script>
