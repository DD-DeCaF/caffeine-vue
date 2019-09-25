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
          <v-autocomplete-extended
            name="organism"
            label="Organism"
            v-model="organism"
            :items="organismOptions"
            autoselectOnlyOption
            item-text="name"
            item-value="id"
            return-object
            :rules="organismRules"
            clearable
            placeholder="e.g., Escherichia coli"
            required
            ref="organismAutocomplete"
          >
            <template v-slot:prepend-item>
              <v-list-tile
                ripple
                @click="
                  isOrganismCreationDialogVisible = true;
                  $refs.organismAutocomplete.isMenuActive = false;
                "
              >
                <v-icon class="mr-3" color="primary">add_circle</v-icon>
                <v-list-tile-title>
                  New Organism
                </v-list-tile-title>
              </v-list-tile>
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
          </v-autocomplete-extended>
          <v-autocomplete-extended
            name="product"
            label="Product"
            v-model="product"
            :items="productOptions"
            autoselectOnlyOption
            item-text="name"
            item-value="id"
            return-object
            :rules="productRules"
            :loading="isLoadingProducts"
            clearable
            placeholder="e.g., ethanol"
            required
          >
          </v-autocomplete-extended>
          <v-autocomplete-extended
            name="project"
            label="Project"
            v-model="project"
            :items="projectOptions"
            autoselectOnlyOption
            item-text="name"
            item-value="id"
            return-object
            :rules="projectRules"
            clearable
            required
            ref="projectAutocomplete"
          >
            <template v-slot:prepend-item>
              <v-list-tile
                ripple
                @click="
                  isProjectCreationDialogVisible = true;
                  $refs.projectAutocomplete.isMenuActive = false;
                "
              >
                <v-icon class="mr-3" color="primary">add_circle</v-icon>
                <v-list-tile-title>
                  New Project
                </v-list-tile-title>
              </v-list-tile>
              <v-divider></v-divider>
            </template>
          </v-autocomplete-extended>
          <v-card>
            <v-card-actions
              @click="showAdvanced = !showAdvanced"
              class="clickable"
            >
              <v-card-title>Advanced</v-card-title>
              <v-spacer></v-spacer>
              <v-btn icon>
                <v-icon>{{
                  showAdvanced ? "expand_less" : "expand_more"
                }}</v-icon>
              </v-btn>
            </v-card-actions>
            <v-slide-y-transition>
              <v-card-text v-show="showAdvanced">
                <v-layout column>
                  <v-radio-group
                    v-model="conditions"
                    label="Conditions:"
                    class="mt-0"
                  >
                    <v-radio
                      label="Aerobic"
                      value="aerobic"
                      color="primary"
                    ></v-radio>
                    <v-radio
                      label="Anaerobic"
                      value="anaerobic"
                      color="primary"
                    ></v-radio>
                    <v-radio
                      label="Both"
                      value="both"
                      color="primary"
                    ></v-radio>
                  </v-radio-group>
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
                <v-autocomplete-extended
                  label="Model"
                  v-model="model"
                  :items="modelOptions"
                  autoselectOnlyOption
                  item-text="name"
                  item-value="id"
                  return-object
                  :rules="modelRules"
                  :hint="modelHint"
                  persistent-hint
                  required
                  ref="modelAutocomplete"
                >
                  <template v-slot:prepend-item>
                    <v-list-tile
                      ripple
                      @click="
                        isModelCreationDialogVisible = true;
                        $refs.modelAutocomplete.isMenuActive = false;
                      "
                    >
                      <v-icon class="mr-3" color="primary">add_circle</v-icon>
                      <v-list-tile-title>
                        New Model
                      </v-list-tile-title>
                    </v-list-tile>
                    <v-divider></v-divider>
                  </template>
                </v-autocomplete-extended>
                <v-text-field
                  label="Maximum number of pathway predictions"
                  v-model.number="maxPredictions"
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
import { ColoredProjectItem } from "@/store/modules/projects";
import { ModelItem, organism2ModelMapping } from "@/store/modules/models";
import NewProject from "@/components/NewProject.vue";
import NewOrganism from "@/components/NewOrganism.vue";
import NewModel from "@/components/NewModel.vue";
import { RuleHandler, RuleOutcome } from "@/types/forms";

interface ProductItem {
  name: string;
}

interface DesignState {
  isValid: boolean;
  project?: ColoredProjectItem;
  projectRules: ReadonlyArray<RuleHandler>;
  isProjectCreationDialogVisible: boolean;
  organism?: OrganismItem;
  organismRules: ReadonlyArray<RuleHandler>;
  isOrganismCreationDialogVisible: boolean;
  product?: ProductItem;
  productRules: ReadonlyArray<RuleHandler>;
  productOptions: ProductItem[];
  isLoadingProducts: boolean;
  conditions: string;
  showAdvanced: boolean;
  bigg: boolean;
  rhea: boolean;
  model?: ModelItem;
  modelRules: ReadonlyArray<RuleHandler>;
  isModelCreationDialogVisible: boolean;
  maxPredictions: number;
  predictionRules: ReadonlyArray<RuleHandler>;
  isSubmitted: boolean;
  hasSubmissionError: boolean;
}

export default Vue.extend({
  name: "Design",
  components: {
    NewProject,
    NewOrganism,
    NewModel
  },
  data(): DesignState {
    return {
      isValid: false,
      project: undefined,
      projectRules: [v => !!v || "Project is required"],
      isProjectCreationDialogVisible: false,
      organism: undefined,
      organismRules: [v => !!v || "Organism is required"],
      isOrganismCreationDialogVisible: false,
      product: undefined,
      productRules: [v => !!v || "Product is required"],
      productOptions: [],
      isLoadingProducts: true,
      conditions: "both",
      showAdvanced: false,
      bigg: true,
      rhea: true,
      model: undefined,
      modelRules: [v => !!v || "Model is required"],
      isModelCreationDialogVisible: false,
      maxPredictions: 3,
      predictionRules: [
        (v: number) => (v > 0 && v <= 10) || "Must be between 1 and 10"
      ],
      isSubmitted: false,
      hasSubmissionError: false
    };
  },
  computed: {
    projectOptions(): ColoredProjectItem[] {
      return this.$store.state.projects.projects;
    },
    // TODO (Moritz Beber): Selection of organism in future should depend on the
    //  selected project, i.e., you can only select public organisms and
    //  organisms within that project.
    // See https://github.com/DD-DeCaF/caffeine-vue/issues/42
    organismOptions(): OrganismItem[] {
      return this.$store.state.organisms.organisms;
    },
    allModels(): ModelItem[] {
      return this.$store.state.models.models;
    },
    modelHint() {
      if (this.modelOkay) {
        return "";
      } else {
        return "Please first select a project and organism";
      }
    },
    modelOkay() {
      return !!this.project && !!this.organism;
    },
    modelOptions(): ModelItem[] {
      if (this.modelOkay) {
        return this.allModels.filter(
          (model: ModelItem) =>
            model.organism_id === this.organism.id &&
            (model.project_id == null || model.project_id === this.project.id)
        );
      } else {
        return [];
      }
    },
    hasEdits(): boolean {
      return (
        !!this.project || !!this.organism || !!this.product || !!this.model
      );
    },
    aerobicConditions() {
      if (this.conditions === "aerobic") {
        return [true];
      } else if (this.conditions === "anaerobic") {
        return [false];
      } else {
        return [true, false];
      }
    }
  },
  watch: {
    modelOkay(isOkay: boolean): void {
      if (isOkay) {
        this.model = this.$store.getters["models/getModelById"](
          organism2ModelMapping[this.organism.id]
        );
      } else {
        this.model = undefined;
      }
    }
  },
  created() {
    this.fetchProducts();
  },
  methods: {
    onNewProject(project: ColoredProjectItem): void {
      this.project = project;
    },
    onNewOrganism(organism: OrganismItem): void {
      this.organism = organism;
    },
    onNewModel(model: ModelItem): void {
      this.model = model;
    },
    modelOkayRule(): RuleOutcome {
      if (this.modelOkay) {
        return true;
      } else {
        return "Please first select a project and organism";
      }
    },
    fetchProducts(): void {
      axios
        .get(`${settings.apis.metabolicNinja}/products`)
        .then((response: AxiosResponse<ProductItem[]>) => {
          this.productOptions = response.data;
        })
        .catch((error: Error) => {
          this.$store.dispatch("setFetchError", error, { root: true });
        })
        .then(() => {
          this.isLoadingProducts = false;
        });
    },
    onSubmit(): void {
      this.isSubmitted = true;
      axios
        .all(
          this.aerobicConditions.map(aerobic =>
            axios.post(
              `${settings.apis.metabolicNinja}/predictions`,
              this.getRequestBody(aerobic)
            )
          )
        )
        .then(response => {
          this.$store.dispatch("jobs/fetchJobs");
          this.$router.push({ name: "jobs" });
        })
        .catch((error: Error) => {
          this.hasSubmissionError = true;
        });
    },
    getRequestBody(aerobic) {
      return {
        aerobic: aerobic,
        bigg: this.bigg,
        max_predictions: this.maxPredictions,
        model_id: this.model.id,
        organism_id: this.organism.id,
        product_name: this.product.name,
        project_id: this.project.id,
        rhea: this.rhea
      };
    }
  },
  beforeRouteLeave(to: Route, from: Route, next) {
    if (!this.isSubmitted && this.hasEdits) {
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
