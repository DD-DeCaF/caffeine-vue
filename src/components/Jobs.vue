<template>
  <v-container>
    <v-layout justify-center>
      <v-flex md9>
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
            <td>{{ props.item.created | moment("D MMM YYYY, HH:mm") }}</td>
            <td>
              <router-link
                :to="{ name: 'jobDetails', params: { id: props.item.id } }"
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

Vue.use(require("vue-moment"));

export default Vue.extend({
  name: "Jobs",
  data: () => ({
    headers: [
      { text: "Product", value: "product_name", width: "20%" },
      { text: "Organism", value: "organism_id", width: "20%" },
      { text: "Model", value: "model_id", width: "15%" },
      { text: "State", value: "state", width: "15%" },
      { text: "Started", value: "created", width: "25%" },
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
  methods: {
    fetchJobs() {
      this.areAllJobsFinished = true;
      this.$store.dispatch("jobs/fetchJobs");
      for (let i = 0; i < this.jobs.length; i++) {
        if (
          this.jobs[i].status === "STARTED" ||
          this.jobs[i].status === "PENDING"
        ) {
          this.areAllJobsFinished = false;
          break;
        }
      }
      if (this.areAllJobsFinished) {
        clearInterval(this.timerId);
      }
    }
  },
  computed: {
    jobs() {
      return this.$store.state.jobs.jobs;
    },
    ...mapGetters({
      model: "models/getModelById",
      organism: "organisms/getOrganismById"
    })
  },
  mounted() {
    this.timerId = setInterval(this.fetchJobs, 5000);
  }
});
</script>

<style scoped>
.link {
  text-decoration: none;
}
</style>
