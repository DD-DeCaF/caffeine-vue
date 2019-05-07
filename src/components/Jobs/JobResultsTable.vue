<template>
  <v-card>
    <div>
      <v-list class="table-buttons">
        <v-list-tile>
          <h3>Results</h3>
          <v-layout justify-end>
            <v-btn
              flat
              color="primary"
              :disabled="selected.length < 1"
              class="mt-3"
              ><v-icon>share</v-icon>VISUALIZE</v-btn
            >
          </v-layout>
        </v-list-tile>
      </v-list>
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="pathways"
        :expand="expand"
        :pagination.sync="pagination"
        select-all="primary"
      >
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
    expand: true,
    showAllReactionKnockins: false,
    showAllReactionKnockouts: false,
    showAllGeneKnockouts: false,
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
    }
  }),
  computed: {
    pathways() {
      return [
        ...this.prediction.result.cofactor_swap,
        ...this.prediction.result.diff_fva,
        ...this.prediction.result.opt_gene
      ].map((item, index) => ({
        id: index,
        ...item
      }));
    }
  }
});
</script>
