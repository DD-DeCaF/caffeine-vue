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
        :custom-sort="customSort"
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
                'column sortable default-cursor',
                pagination.descending ? 'desc' : 'asc',
                'manipulations' === pagination.sortBy ? 'active' : ''
              ]"
            >
              <span @click="changeSort('manipulations')" class="pointer ml-3"
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
              :class="[
                'column sortable default-cursor',
                pagination.descending ? 'desc' : 'asc',
                'heterologous_reactions' === pagination.sortBy ? 'active' : ''
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
                @change="filters"
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
              :class="[
                'column sortable default-cursor',
                pagination.descending ? 'desc' : 'asc',
                'yield' === pagination.sortBy ? 'active' : ''
              ]"
            >
              <span @click="changeSort('yield')" class="pointer ml-3"
                >Yield <v-icon>arrow_upward</v-icon><br /><span class="caption"
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
              :class="[
                'column sortable default-cursor',
                pagination.descending ? 'desc' : 'asc',
                'biomass' === pagination.sortBy ? 'active' : ''
              ]"
            >
              <span @click="changeSort('biomass')" class="pointer ml-3"
                >Growth <v-icon>arrow_upward</v-icon><br /><span class="caption"
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
                v-model="search"
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
      rowsPerPage: 10
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
          ...pathway,
          fitness: +pathway.fitness.toFixed(2),
          yield: +pathway.yield.toFixed(2),
          product: +pathway.product.toFixed(2),
          biomass: +pathway.biomass.toFixed(2)
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

<style>
.default-cursor {
  cursor: default !important;
}
.pointer {
  cursor: pointer;
}
</style>
