<template>
  <v-container>
    <NewProject
      v-model="isProjectCreationDialogVisible"
      @return-object="onNewProject"
    />
    <NewOrganism
      v-model="isOrganismCreationDialogVisible"
      @return-object="onNewOrganism"
    />
    <NewModel
      v-model="isModelCreationDialogVisible"
      @return-object="onNewModel"
    />
    <v-card>
      <v-card-title></v-card-title>
      <v-card-text>
        <v-form v-model="isValid">
          <v-autocomplete
            name="project"
            label="Project"
            v-model="project"
            :items="projectOptions"
            item-text="name"
            item-value="id"
            return-object
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
            name="organism"
            label="Organism"
            v-model="organism"
            :items="organismOptions"
            item-text="name"
            item-value="id"
            return-object
            :rules="organismRules"
            clearable
            placeholder="e.g., Escherichia coli"
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
            <template v-slot:selection="{ item: organism }">
              <span v-text="organism.name" class="font-italic"></span>
            </template>
            <template v-slot:item="{ item: organism }">
              <v-list-tile-content
                v-text="organism.name"
                class="font-italic"
              ></v-list-tile-content>
            </template>
          </v-autocomplete>
          <v-autocomplete
            name="product"
            label="Product"
            v-model="product"
            :items="productOptions"
            item-text="name"
            item-value="id"
            return-object
            :rules="productRules"
            :loading="isLoadingProducts"
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
                  return-object
                  :rules="modelRules()"
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
          <v-btn class="primary" :disabled="!isValid" @click="onSubmit"
            >Submit
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
    <v-snackbar color="error" v-model="hasSubmissionError" :timeout="8000">
      Sorry, submitting your design job failed. Please try again in a few
      seconds or contact us if the problem persists.
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Route } from "vue-router";
import axios, { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import { OrganismItem } from "@/store/modules/organisms";
import { ProjectItem } from "@/store/modules/projects";
import { ModelItem, organism2ModelMapping } from "@/store/modules/models";
import NewProject from "@/components/NewProject.vue";
import NewOrganism from "@/components/NewOrganism.vue";
import NewModel from "@/components/NewModel.vue";
import { Nullable, RuleHandler, NextHandler } from "@/types/general";

interface ProductItem {
  name: string;
}

export default Vue.extend({
  name: "Design",
  components: {
    NewProject,
    NewOrganism,
    NewModel
  },
  data() {
    return {
      isValid: false,
      project: null as Nullable<ProjectItem>,
      projectRules: [v => !!v || "Project is required"] as ReadonlyArray<
        RuleHandler
      >,
      isProjectCreationDialogVisible: false,
      organism: null as Nullable<OrganismItem>,
      organismRules: [v => !!v || "Organism is required"] as ReadonlyArray<
        RuleHandler
      >,
      isOrganismCreationDialogVisible: false,
      product: null as Nullable<ProductItem>,
      productRules: [v => !!v || "Product is required"] as ReadonlyArray<
        RuleHandler
      >,
      productOptions: [] as ProductItem[],
      isLoadingProducts: true,
      isAerobic: false,
      showAdvanced: false,
      bigg: false,
      rhea: true,
      model: null as Nullable<ModelItem>,
      modelOptions: [] as ModelItem[],
      isModelCreationDialogVisible: false,
      maxPredictions: 3,
      predictionRules: [
        (v: number) => (v > 0 && v <= 10) || "Must be between 1 and 10."
      ],
      isSubmitted: false,
      hasSubmissionError: false
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
    allModels(): ModelItem[] {
      return this.$store.state.models.models;
    }
  },
  watch: {
    project(project: ProjectItem): void {
      this.selectModels(project, this.organism);
    },
    organism(organism: OrganismItem): void {
      this.selectModels(this.project, organism);
    }
  },
  methods: {
    onNewProject(project: ProjectItem): void {
      this.project = project;
    },
    onNewOrganism(organism: OrganismItem): void {
      this.organism = organism;
    },
    fetchProducts(): void {
      axios
        .get(`${settings.apis.metabolicNinja}/products`)
        .then((response: AxiosResponse<ProductItem[]>) => {
          this.productOptions = response.data;
        })
        .catch((error: Error) => {
          this.$store.commit("setFetchError", error, { root: true });
        })
        .finally(() => {
          this.isLoadingProducts = false;
        });
    },
    selectModels(project: ProjectItem, organism: OrganismItem): void {
      if (project == null || organism == null) {
        this.modelOptions = [];
        return;
      }
      this.modelOptions = this.allModels.filter(
        (model: ModelItem) =>
          model.organism_id === this.organism.id &&
          (model.project_id === null || model.project_id === this.project.id)
      );
      this.model = organism2ModelMapping[this.organism.id];
    },
    modelRules(): RuleHandler[] {
      const rules: RuleHandler[] = [];
      rules.push(
        () =>
          (this.project != null && this.organism != null) ||
          "Please first select a project and organism"
      );
      rules.push(v => !!v || "Model is required");
      return rules;
    },
    onNewModel(model: ModelItem): void {
      this.model = model;
    },
    onSubmit(): void {
      this.isSubmitted = true;
      axios
        .post(`${settings.apis.metabolicNinja}/predictions`, {
          aerobic: this.isAerobic,
          bigg: this.bigg,
          max_predictions: this.maxPredictions,
          model_id: this.model.id,
          organism_id: this.organism.id,
          product_name: this.product.name,
          project_id: this.project.id,
          rhea: this.rhea
        })
        .then((response: AxiosResponse) => {
          this.$store.dispatch("jobs/fetchJobs");
          this.$router.push({ name: "jobs" });
        })
        .catch((error: Error) => {
          this.hasSubmissionError = true;
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
    } else {
      next();
    }
  }
});
</script>

<style scoped>
.clickable {
  cursor: pointer;
}
</style>
