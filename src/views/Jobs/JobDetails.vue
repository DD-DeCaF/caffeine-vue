<template>
  <div>
    <template v-if="job">
      <v-container fluid>
        <v-layout column>
          <v-flex>
            <v-card>
              <v-layout align-center justify-end row wrap>
                <h2 class="ma-3">
                  <router-link to="/jobs" class="link">Jobs</router-link> / #{{
                    jobId
                  }}
                </h2>
                <v-spacer></v-spacer>
                <v-list-tile class="ma-3">
                  <v-icon class="mr-2">bug_report</v-icon>
                  <div class="body-1">
                    Organism:<br /><strong v-if="organism">{{
                      organism.name
                    }}</strong>
                    <v-progress-circular
                      v-else
                      indeterminate
                      color="primary"
                      :width="2"
                      :size="15"
                    ></v-progress-circular>
                  </div>
                </v-list-tile>
                <v-list-tile class="ma-3">
                  <v-icon class="mr-2">rounded_corner</v-icon>
                  <div class="body-1">
                    Model:<br /><strong v-if="model">{{ model.name }}</strong>
                    <v-progress-circular
                      v-else
                      indeterminate
                      color="primary"
                      :width="2"
                      :size="15"
                    ></v-progress-circular>
                  </div>
                </v-list-tile>
                <v-list-tile class="ma-3">
                  <v-icon class="mr-2">cached</v-icon>
                  <div class="body-1">
                    Conditions:<br /><strong v-if="prediction">{{
                      prediction.aerobic ? "Aerobic" : "Anaerobic"
                    }}</strong>
                    <v-progress-circular
                      v-else
                      indeterminate
                      color="primary"
                      :width="2"
                      :size="15"
                    ></v-progress-circular>
                  </div>
                </v-list-tile>
                <v-list-tile class="ma-3">
                  <v-icon class="mr-2">attach_money</v-icon>
                  <div class="body-1">
                    Product:<br /><strong>{{ job.product_name }}</strong>
                  </div>
                </v-list-tile>
                <v-list-tile class="ma-3">
                  <v-icon class="mr-2">timelapse</v-icon>
                  <div class="body-1">
                    Started:<br /><strong>{{
                      job.created | moment("D MMM YYYY, HH:mm")
                    }}</strong>
                  </div>
                </v-list-tile>
                <v-list-tile class="ma-3">
                  <v-icon class="mr-2">timelapse</v-icon>
                  <div class="body-1">
                    Completed:<br /><strong v-if="job.status === 'FAILURE'"
                      >Failed</strong
                    >
                    <strong
                      v-else-if="
                        job.status !== 'STARTED' && job.status !== 'PENDING'
                      "
                      >{{ job.updated | moment("D MMM YYYY, HH:mm") }}</strong
                    >
                    <strong v-else>Still running</strong>
                  </div>
                </v-list-tile>
              </v-layout>
            </v-card>

            <v-card class="mt-1 pa-3">
              <div v-if="job.status === 'STARTED' || job.status === 'PENDING'">
                <span>The job is still running</span>
                <v-progress-circular
                  indeterminate
                  color="primary"
                  class="ml-2"
                  :width="3"
                  :size="25"
                ></v-progress-circular>
              </div>
              <div v-if="job.status === 'FAILURE'">
                <span class="red--text"
                  >The job was unable to complete successfully.</span
                >
              </div>
              <div v-if="job.status === 'SUCCESS' && prediction">
                <JobResultsTable :prediction="prediction" />
              </div>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </template>

    <template v-else>
      <v-progress-linear :indeterminate="true" class="my-0"></v-progress-linear>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapGetters } from "vuex";
import { JobItem } from "@/store/modules/jobs";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import JobResultsTable from "@/views/Jobs/JobResultsTable.vue";

export interface PathwayPredictionResponse extends JobItem {
  result: {
    diff_fva: PathwayPredictionMethod[];
    cofactor_swap: PathwayPredictionMethod[];
    opt_gene: PathwayPredictionMethod[];
    reactions: { [id: string]: Reaction };
    metabolites: { [id: string]: Object };
  };
}

export interface PathwayPredictionMethod {
  biomass: number;
  exotic_cofactors: string[];
  fitness: number;
  heterologous_reactions: string[];
  knockouts: string[];
  manipulations: {
    from: string;
    id: string;
    to: string;
  }[];
  method: string;
  product: number;
  synthetic_reactions: string[];
  yield: number;
}

export interface Reaction {
  annotation: {
    Description: string;
    EC: string;
  };
  gene_reaction_rule: string;
  id: string;
  lower_bound: number;
  metabolites: { [id: string]: number };
  name: string;
  upper_bound: number;
}

export default Vue.extend({
  name: "JobDetails",
  components: {
    JobResultsTable
  },
  data: () => ({
    jobId: null,
    prediction: null
  }),
  computed: {
    job() {
      return this.$store.getters["jobs/getJobById"](this.jobId);
    },
    model() {
      return this.$store.getters["models/getModelById"](this.job.model_id);
    },
    organism() {
      return this.$store.getters["organisms/getOrganismById"](
        this.job.organism_id
      );
    }
  },
  watch: {
    "job.status": {
      handler: function(newValue, oldValue) {
        if (newValue === "SUCCESS") {
          this.getPathwayPredictions();
        }
      },
      immediate: true
    }
  },
  created() {
    this.jobId = parseInt(this.$route.params.id);
  },
  methods: {
    getPathwayPredictions() {
      axios
        .get(`${settings.apis.metabolicNinja}/predictions/${this.jobId}`)
        .then((response: AxiosResponse<PathwayPredictionResponse>) => {
          this.prediction = response.data;
        })
        .catch(error => {
          this.$store.dispatch("setFetchError", error);
        });
    }
  }
});
</script>

<style scoped>
.link {
  text-decoration: none;
}
</style>
