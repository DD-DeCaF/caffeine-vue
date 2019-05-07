<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
  <v-container>
    <v-card>
      <v-card-title></v-card-title>
      <v-card-text>
        <v-form v-model="isValid">
          <v-autocomplete
            label="Project"
            v-model="project"
            :items="projectOptions"
            item-text="name"
            item-value="id"
            :rules="projectRules"
            clearable
          >
            <template v-slot:prepend-item>
              <v-btn
                depressed
                @click.stop="isProjectCreationDialogVisible = true"
              >
                <v-icon class="mr-4">add_circle</v-icon>
                New project
              </v-btn>
              <v-divider></v-divider>
            </template>
          </v-autocomplete>
          <v-autocomplete
            label="Organism"
            v-model="organism"
            :items="organismOptions"
            item-text="name"
            item-value="id"
            :rules="organismRules"
            clearable
            placeholder="e.g., Escherichia coli"
            class="font-italic"
          >
            <template v-slot:prepend-item>
              <v-btn
                depressed
                @click.stop="isOrganismCreationDialogVisible = true"
              >
                <v-icon class="mr-4">add_circle</v-icon>
                New organism
              </v-btn>
              <v-divider></v-divider>
            </template>
            <template v-slot:item="data">
              <v-list-tile-content
                v-text="data.item.name"
                class="font-italic"
              ></v-list-tile-content>
            </template>
          </v-autocomplete>
          <v-autocomplete
            label="Product"
            v-model="product"
            :items="productOptions"
            item-text="name"
            item-value="id"
            :rules="productRules"
            clearable
            placeholder="e.g., ethanol"
          >
          </v-autocomplete>
          <v-switch
            v-model="isAerobic"
            label="Aerobic conditions"
            color="primary"
            inverse-label
          >
          </v-switch>
          <v-card>
            <v-card-actions
              @click="showAdvanced = !showAdvanced"
              class="clickable"
            >
              <v-card-title>Advanced</v-card-title>
              <v-spacer></v-spacer>
              <v-btn icon>
                <v-icon>{{
                  showAdvanced ? "keyboard_arrow_down" : "keyboard_arrow_up"
                }}</v-icon>
              </v-btn>
            </v-card-actions>
            <v-slide-y-transition>
              <v-card-text v-show="showAdvanced">
                <v-layout column>
                  <v-flex xs4>Select a reaction source database</v-flex>
                  <v-checkbox
                    v-model="bigg"
                    label="BiGG"
                    color="primary"
                  ></v-checkbox>
                  <v-checkbox
                    v-model="rhea"
                    label="Rhea"
                    color="primary"
                  ></v-checkbox>
                </v-layout>
                <v-autocomplete
                  label="Model"
                  v-model="model"
                  :items="modelOptions"
                  item-text="name"
                  item-value="id"
                  :rules="modelRules"
                  clearable
                >
                  <template v-slot:prepend-item>
                    <v-btn
                      depressed
                      @click.stop="isModelCreationDialogVisible = true"
                    >
                      <v-icon class="mr-4">add_circle</v-icon>
                      New model
                    </v-btn>
                    <v-divider></v-divider>
                  </template>
                </v-autocomplete>
                <v-text-field
                  label="Maximum number of pathway predictions"
                  v-model="maxPredictions"
                  class="mt-0"
                  :rules="predictionRules"
                  type="number"
                ></v-text-field>
              </v-card-text>
            </v-slide-y-transition>
          </v-card>
          <v-btn class="primary" :disabled="!isValid">Submit</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Route, RawLocation } from "vue-router";
import axios, { AxiosResponse } from "axios";
import * as settings from "@/settings";
import { OrganismItem } from "@/store/modules/organisms";
import { ProjectItem } from "@/store/modules/projects";
import { ModelItem } from "@/store/modules/models";

interface Product {
  name: string;
}

type Nullable<T> = T | null;
type RuleOutcome = string | true;
type RuleHandler = (any) => RuleOutcome;
type NextHandler = (to?: RawLocation | false | Function | void) => void;

export default Vue.extend({
  name: "Design",
  data() {
    return {
      isValid: false,
      organism: null as Nullable<OrganismItem>,
      organismRules: [v => !!v || "Organism is required"] as ReadonlyArray<
        RuleHandler
      >,
      product: null as Nullable<Product>,
      productRules: [v => !!v || "Product is required"] as ReadonlyArray<
        RuleHandler
      >,
      productOptions: [] as Product[],
      project: null as Nullable<ProjectItem>,
      projectRules: [v => !!v || "Project is required"] as ReadonlyArray<
        RuleHandler
      >,
      bigg: false,
      rhea: true,
      model: null as Nullable<ModelItem>,
      modelOptions: [] as ModelItem[],
      maxPredictions: 3,
      isAerobic: false,
      isSubmitted: false,
      showAdvanced: false
    };
  },
  computed: {
    projectOptions(): ProjectItem[] {
      return this.$store.state.projects.projects;
    },
    // TODO (Moritz Beber): Selection of organism in future should depend on the
    //  selected project, i.e., you can only select public organisms and
    //  organisms within that project.
    organismOptions(): OrganismItem[] {
      return this.$store.state.organisms.organisms;
    },
    modelRules(): RuleHandler[] {
      const rules: RuleHandler[] = [];
      rules.push(
        () =>
          (this.project && this.organism) ||
          "Please first select a project and organism"
      );
      rules.push(v => !!v || "Model is required");
      return rules;
    },
    predictionRules(): RuleHandler[] {
      const rules: RuleHandler[] = [];
      rules.push((v: number) => {
        return (
          (v > 0 && v <= process.env.VUE_APP_MAX_PREDICTIONS) ||
          `Must be between 0 and ${process.env.VUE_APP_MAX_PREDICTIONS}.`
        );
      });
      return rules;
    }
  },
  methods: {
    onSubmit(): void {
      this.isSubmitted = true;
      this.$store.dispatch("jobs/fetchJobs");
      this.$router.push({ name: "jobs" });
    },
    fetchProducts(): void {
      axios
        .get(`${settings.apis.metabolicNinja}/products`)
        .then((response: AxiosResponse<Product[]>) => {
          this.productOptions = response.data;
        })
        .catch((error: Error) => {
          this.$store.commit("setFetchError", error, { root: true });
        });
    }
  },
  created() {
    this.fetchProducts();
  },
  beforeRouteLeave(to: Route, from: Route, next: NextHandler) {
    if (!this.isSubmitted) {
      const answer = window.confirm(
        "Do you really want to leave? You have pending changes."
      );
      if (answer) {
        next();
      } else {
        next(false);
      }
    }
  }
});
</script>

<style scoped>
.clickable {
  cursor: pointer;
}
</style>
