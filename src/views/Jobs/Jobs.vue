<template>
  <v-container fluid>
    <v-layout justify-center>
      <v-flex md9>
        <h1 class="mb-2">Jobs</h1>
        <v-data-table
          :headers="headers"
          :items="jobs"
          :pagination.sync="pagination"
          :loading="isLoading"
          must-sort
          class="elevation-8"
        >
          <template v-slot:items="{ item: job }">
            <td>{{ job.product_name }}</td>
            <td>
              {{ organism(model(job.model_id).organism_id).name }}
            </td>
            <td>{{ model(job.model_id).name }}</td>
            <td>
              <span v-if="job.aerobic">Aerobic</span>
              <span v-else>Anaerobic</span>
            </td>
            <td>
              {{ job.status }}
              <v-progress-circular
                indeterminate
                color="primary"
                class="ml-2"
                :width="3"
                :size="25"
                v-if="job.status === 'STARTED' || job.status === 'PENDING'"
              ></v-progress-circular>
            </td>
            <td>{{ job.created | moment("D MMM YYYY, HH:mm") }}</td>
            <td>
              <router-link
                :to="{ name: 'jobDetails', params: { id: job.id } }"
                class="link"
                ><v-btn color="primary" flat>Details</v-btn></router-link
              >
            </td>
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
    isLoading: true,
    headers: [
      { text: "Product", value: "product_name", width: "15%" },
      { text: "Organism", value: "organism_id", width: "15%" },
      { text: "Model", value: "model_id", width: "15%" },
      { text: "Conditions", value: "aerobic", width: "10%" },
      { text: "State", value: "state", width: "20%" },
      { text: "Started", value: "created", width: "20%" },
      { value: "details", width: "5%" }
    ],
    pagination: {
      rowsPerPage: 10,
      sortBy: "created",
      descending: true
    },
    areAllJobsFinished: true,
    timerId: 0
  }),
  computed: {
    jobs() {
      return this.$store.state.jobs.jobs;
    },
    ...mapGetters({
      model: "models/getModelById",
      organism: "organisms/getOrganismById"
    })
  },
  created() {
    this.$store.state.jobs.jobsPromise.then(() => {
      this.isLoading = false;
    });
  }
});
</script>

<style scoped>
.link {
  text-decoration: none;
}
</style>
