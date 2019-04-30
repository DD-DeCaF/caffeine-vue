<template>
  <v-container>
    <v-layout justify-center>
      <v-flex md8>
        <h1 class="mb-2">Jobs</h1>
          <v-data-table
            :headers="headers"
            :items="jobs"
            :pagination.sync="pagination"
            must-sort
            class="elevation-8"
          >
            <template v-slot:items="props">
                <td>{{ props.item.product_name }}</td>
                <td>
                  {{ organism(model(props.item.model_id).organism_id).name }}
                </td>
                <td>{{ model(props.item.model_id).name }}</td>
                <td>{{ props.item.status }}</td>
                <td>{{ props.item.created }}</td>
            </template>
          </v-data-table>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { mapGetters } from "vuex";

export default Vue.extend({
  name: "Jobs",
  data: () => ({
    headers: [
      { text: "Product", value: "product_name" },
      { text: "Organism", value: "organism_id"},
      { text: "Model", value: "model_id" },
      { text: "State", value: "state"},
      { text: "Started", value: "created" }
    ],
    pagination: {
      rowsPerPage: 10
    }
  }),
  methods: {},
  computed: {
    jobs() {
      return this.$store.state.jobs.jobs;
    },
    ...mapGetters({
      model: "models/getModelById",
      organism: "organisms/getOrganismById"
    })
  }
});
</script>