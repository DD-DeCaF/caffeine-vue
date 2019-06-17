<template>
  <v-card class="mb-2">
    <v-toolbar
      dense
      flat
      :color="titleColor"
      class="white--text"
      :class="{ clickable: !isSelected }"
      @click="selectCard"
    >
      <v-toolbar-title :class="{ 'body-2': 'true', 'font-italic': isSaveable }"
        >{{ card.name }}<span v-if="isSaveable">*</span></v-toolbar-title
      >
      <v-spacer></v-spacer>

      <v-btn flat icon @click.stop="isCardDialogVisible = true">
        <CardDialog
          v-model="isCardDialogVisible"
          :card="card"
          :model="model"
          :modifications="modifications"
          @simulate-card="simulateCard"
          @open-method-help-dialog="showMethodHelpDialog = true"
          @load-data-error="$emit('load-data-error')"
        />
        <v-icon color="white">edit</v-icon>
      </v-btn>
      <!-- Define the method help dialog here to avoid nested dialogs. -->
      <MethodHelpDialog
        :showMethodHelpDialog="showMethodHelpDialog"
        @close-dialog="showMethodHelpDialog = false"
      />

      <v-btn flat icon v-if="!isOnlyCard" @click="removeCard">
        <v-icon color="white">close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-card-title primary-title class="py-2" v-if="isSelected">
      <v-container fluid class="pa-0">
        <v-layout>
          <v-flex>Organism:</v-flex>
          <v-flex class="text-xs-right">
            <span v-if="card.organism">{{ card.organism.name }}</span>
            <span v-else>
              <em>Unknown</em>
            </span>
          </v-flex>
        </v-layout>
      </v-container>
      <v-container fluid class="pa-0">
        <v-layout>
          <v-flex>Model:</v-flex>
          <v-flex class="text-xs-right">
            <span v-if="model">{{ model.name }}</span>
            <span v-else>
              <em>Not selected</em>
            </span>
          </v-flex>
        </v-layout>
      </v-container>
      <v-container fluid class="pa-0">
        <v-layout>
          <v-flex>Method:</v-flex>
          <v-flex class="text-xs-right">{{ card.method }}</v-flex>
        </v-layout>
      </v-container>

      <!-- Design cards -->
      <v-container v-if="card.type == 'Design'" fluid class="pa-0">
        <v-layout>
          <v-flex>Objective:</v-flex>
          <v-flex class="text-xs-right">
            <span v-if="card.objective.reaction === null">Growth</span>
            <span v-else>{{ card.objective.reaction.id }}</span>
            <v-icon v-if="card.objective.maximize" size="16"
              >arrow_upward</v-icon
            >
            <v-icon v-else size="16">arrow_downward</v-icon>
          </v-flex>
        </v-layout>
      </v-container>
      <v-container v-if="card.type == 'Design'" fluid class="pa-0">
        <v-layout wrap>
          <v-flex>Modifications:</v-flex>
          <v-flex class="text-xs-right">{{ modifications.length }}</v-flex>
        </v-layout>
      </v-container>
      <v-container v-if="card.type == 'Design'" fluid class="pa-0">
        <v-layout wrap>
          <v-flex v-if="card.objective.reaction"
            >{{ card.objective.reaction.id }} flux:</v-flex
          >
          <v-flex class="text-xs-right" v-if="card.objective.reaction">
            <div v-if="!card.isSimulating">
              <span
                v-if="production != null"
                :class="{ dead: production === 0 }"
              >
                {{ production | round }}
                <em>mmol gDW<sup>-1</sup> h<sup>-1</sup></em>
              </span>
              <span v-else>N/A</span>
            </div>
            <div v-else>
              <v-progress-circular
                indeterminate
                size="12"
                :width="1"
              ></v-progress-circular>
            </div>
          </v-flex>
        </v-layout>
      </v-container>

      <!-- Data driven cards -->
      <v-container v-if="card.type == 'DataDriven'" fluid class="pa-0">
        <v-layout>
          <v-flex>Experiment:</v-flex>
          <v-flex class="text-xs-right">
            <span v-if="card.experiment === null"><em>Not selected</em></span>
            <span v-else>{{ card.experiment.name }}</span>
          </v-flex>
        </v-layout>
      </v-container>
      <v-container v-if="card.type == 'DataDriven'" fluid class="pa-0">
        <v-layout>
          <v-flex>Conditions:</v-flex>
          <v-flex class="text-xs-right">
            <span v-if="card.condition === null"><em>Not selected</em></span>
            <span v-else>{{ card.condition.name }}</span>
          </v-flex>
        </v-layout>
      </v-container>

      <!-- Shared -->
      <v-container fluid class="pa-0">
        <v-layout wrap>
          <v-flex>Growth rate:</v-flex>
          <v-flex class="text-xs-right">
            <div v-if="!card.isSimulating">
              <span
                v-if="card.growthRate !== null"
                :class="{ dead: card.growthRate === 0 }"
              >
                {{ card.growthRate | round }}
                <em>h<sup>-1</sup></em>
              </span>
              <span v-else>N/A</span>
            </div>
            <div v-else>
              <v-progress-circular
                indeterminate
                size="12"
                :width="1"
              ></v-progress-circular>
            </div>
          </v-flex>
        </v-layout>
      </v-container>

      <!-- DiffFVA -->
      <v-container v-if="card.type == 'DiffFVA'" fluid class="pa-0">
        <v-layout row>
          <v-flex>
            <v-tooltip bottom>
            <template v-slot:activator="{ on }">
            <v-switch
              color="primary"
              v-model="showDiffFVAScore"
            >
            <template v-slot:label>
              <div v-if="!showDiffFVAScore"> Show manipulation targets</div>
              <div v-else> <div style="color:black">Show manipulation targets</div></div>
            </template>
            
            </v-switch>
            </template>
            <span>
              Show either the flux distribution calculated from differential FVA or just the scores.
            </span>
            </v-tooltip>
          </v-flex>
        </v-layout>
      </v-container>

      <v-container fluid class="pa-0" v-if="isSaveable">
        <v-layout wrap justify-end>
          <v-tooltip bottom :disabled="!isSaveTooltipVisible">
            <template v-slot:activator="{ on }">
              <v-btn
                v-on="on"
                class="mr-0 primary"
                style="pointer-events: auto"
                @click="saveCard"
                :disabled="isSaveButtonDisabled"
              >
                <v-progress-circular
                  v-if="isSaving"
                  indeterminate
                  color="primary"
                  :width="2"
                  :size="15"
                  class="mr-2"
                ></v-progress-circular>
                Save</v-btn
              >
            </template>
            <span v-if="!isAuthenticated">
              {{ $store.state.commonTooltipMessages.unauthenticated }}
            </span>
            <span v-else-if="needsActiveProject">
              Please select an active project in the left-hand-side sidebar. The
              design will be saved in this project.
            </span>
            <span v-else-if="!card.modelId">
              Please select the metabolic model.
            </span>
          </v-tooltip>
        </v-layout>
      </v-container>
    </v-card-title>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { mapMutations } from "vuex";
import axios from "axios";
import * as settings from "@/utils/settings";
import CardDialog from "@/views/InteractiveMap/CardDialog.vue";
import MethodHelpDialog from "@/views/InteractiveMap/MethodHelpDialog.vue";

export default Vue.extend({
  name: "Card",
  components: {
    CardDialog,
    MethodHelpDialog
  },
  filters: {
    round(value) {
      return value.toFixed(3);
    }
  },
  props: ["card", "isOnlyCard", "isSelected"],
  data: () => ({
    isSaving: false,
    showMethodHelpDialog: false,
    isCardDialogVisible: false,
    showDiffFVAScore: false,
  }),
  computed: {
    titleColor() {
      if (this.isSelected) {
        if (this.card.hasSimulationError) {
          return "error";
        } else {
          return "primary";
        }
      } else {
        return "grey";
      }
    },
    production() {
      // If the objective is growth, ignore production.
      if (this.card.objective.reaction.id === null) {
        return null;
      }
      if (this.card.method === "fba" || this.card.method == "pfba") {
        return this.card.fluxes[this.card.objective.reaction.id];
      } else if (this.card.method === "fva" || this.card.method == "pfba-fva") {
        // For FVA fluxes, calculate the average
        const rxn = this.card.fluxes[this.card.objective.reaction.id];
        return (rxn.upper_bound + rxn.lower_bound) / 2;
      } else {
        throw new Error(`Unexpected simulation method ${this.card.method}`);
      }
    },
    modifications() {
      // Concatenate all modifications for a single table display, and add a
      // `type` key to distinguish the different modifications.
      const reactionAdditions = this.card.reactionAdditions.map(reaction => ({
        type: "added_reaction",
        ...reaction
      }));
      const reactionKnockouts = this.card.reactionKnockouts.map(reaction => ({
        type: "reaction_knockout",
        ...reaction
      }));
      const geneKnockouts = this.card.geneKnockouts.map(gene => ({
        type: "gene_knockout",
        ...gene
      }));
      const editedBounds = this.card.editedBounds.map(reaction => ({
        type: "edited_bounds",
        ...reaction
      }));
      return [
        ...reactionAdditions,
        ...reactionKnockouts,
        ...geneKnockouts,
        ...editedBounds
      ];
    },
    model() {
      // Returns the modified model (original model + added reactions) for this
      // card.
      // TODO: This is duplicated logic, a very similar computed property exists
      // in the Escher component.
      const selectedModel = this.$store.getters["models/getModelById"](
        this.card.modelId
      );

      if (!selectedModel || !selectedModel.model_serialized) {
        return selectedModel;
      }

      // Create a copy of the model object to avoid references to the object in
      // the store.
      const model = {
        ...selectedModel,
        model_serialized: {
          ...selectedModel.model_serialized
        }
      };
      this.card.reactionAdditions.forEach(reaction => {
        // Add the reaction to the model. (Take care to replace, not modify, the
        // original array.)
        model.model_serialized.reactions = [
          ...model.model_serialized.reactions,
          {
            id: reaction.id,
            name: reaction.name,
            lower_bound: reaction.lowerBound,
            upper_bound: reaction.upperBound,
            gene_reaction_rule: "",
            metabolites: Object.assign(
              {},
              ...reaction.metabolites.map(m => ({
                [`${m.id}_${m.compartment}`]: m.stoichiometry
              }))
            )
          }
        ];

        // Add any new metabolites from the reaction. (Take care to replace, not
        // modify, the original array.)
        const metabolites = reaction.metabolites
          // Add the compartment postfix to the metabolite id
          .map(metabolite => ({
            ...metabolite,
            id: `${metabolite.id}_${metabolite.compartment}`
          }))
          // Exclude metabolites that already exist in the model
          .filter(metabolite => {
            return !model.model_serialized.metabolites.some(
              m => m.id === metabolite.id
            );
          });
        model.model_serialized.metabolites = [
          ...model.model_serialized.metabolites,
          ...metabolites
        ];
      });
      return model;
    },
    isSaveable() {
      return this.card.type == "DataDriven" && this.card.modified;
    },
    isSaveTooltipVisible() {
      return (
        !this.isAuthenticated || this.needsActiveProject || !this.card.modelId
      );
    },
    isSaveButtonDisabled() {
      return this.isSaveTooltipVisible || this.isSaving;
    },
    needsActiveProject() {
      // Returns true if the design isn't previously saved, and there is no
      // active project selected. Used to prompt the user to select an active
      // project when attempting to save the card.
      return !this.card.designId && !this.activeProject;
    },
    isAuthenticated() {
      return this.$store.state.session.isAuthenticated;
    },
    activeProject() {
      return this.$store.state.projects.activeProject;
    }
  },
  watch: {
    "card.modelId": {
      immediate: true,
      handler() {
        // Make sure that the full model is always available. There might be a
        // delay before it arrives, but without triggering this, dependent code
        // (for example the Escher logic to load the map) might end up waiting
        // indefinitely for the full model.
        if (!this.card.modelId) {
          return;
        }
        this.$store.dispatch("models/withFullModel", this.card.modelId);
      }
    },
    showDiffFVAScore() {
      this.updateCard({
              uuid: this.card.uuid,
               props: { showDiffFVAScore: this.showDiffFVAScore }
            });
    },
  },
  mounted() {
    if (this.card.withDialog) {
      this.isCardDialogVisible = true;
    }
  },
  destroyed() {
    this.updateCard({
      uuid: this.card.uuid,
      props: {
        withDialog: false
      }
    });
  },
  methods: {
    selectCard() {
      this.$emit("select-card", this.card);
    },
    removeCard() {
      this.$emit("remove-card", this.card);
      this.$store.commit("interactiveMap/removeCard", this.card);
    },
    simulateCard() {
      this.$emit("simulate-card", this.card, this.model);
    },
    saveCard() {
      this.isSaving = true;

      // The project id depends on whether this is a new or existing design.
      let projectId;
      if (this.card.designId) {
        projectId = this.$store.getters["designs/getDesignById"](
          this.card.designId
        ).project_id;
      } else {
        projectId = this.activeProject.id;
      }

      // Create the payload, and map camelCase to snake_case for the API.
      const design = {
        id: null,
        project_id: projectId,
        method: "Manual", // TODO: This field is obsolete, remove it
        name: this.card.name,
        model_id: this.card.modelId,
        design: {
          reaction_knockins: this.card.reactionAdditions.map(r => ({
            ...r,
            lower_bound: r.lowerBound,
            upper_bound: r.upperBound,
            reaction_string: r.reactionString,
            metabolites: r.metabolites.map(m => ({
              ...m,
              compartment_id: m.compartment
            }))
          })),
          reaction_knockouts: this.card.reactionKnockouts.map(r => ({
            ...r,
            lower_bound: r.lowerBound,
            upper_bound: r.upperBound,
            reaction_string: r.reactionString,
            metabolites: r.metabolites.map(m => ({
              ...m,
              compartment_id: m.compartment
            }))
          })),
          gene_knockouts: this.card.geneKnockouts.map(g => ({
            ...g,
            reactions: g.reactions.map(r => ({
              ...r,
              gene_reaction_rule: r.geneReactionRule
            }))
          })),
          constraints: this.card.editedBounds.map(c => ({
            ...c,
            lower_bound: c.lowerBound,
            upper_bound: c.upperBound
          }))
        }
      };

      if (this.card.designId) {
        // Update existing design
        axios
          .put(
            `${settings.apis.designStorage}/designs/${this.card.designId}`,
            design
          )
          .then(response => {
            this.$store.dispatch("designs/fetchDesigns");
            this.setModified({
              uuid: this.card.uuid,
              modified: false
            });
            this.$emit("design-saved", design);
          })
          .catch(error => {
            this.$emit("design-save-error");
          })
          .then(() => {
            this.isSaving = false;
          });
      } else {
        // Create new design
        axios
          .post(`${settings.apis.designStorage}/designs`, design)
          .then(response => {
            this.$store.dispatch("designs/fetchDesigns");
            this.updateCard({
              uuid: this.card.uuid,
              props: { designId: response.data.id }
            });
            this.setModified({
              uuid: this.card.uuid,
              modified: false
            });
            this.$emit("design-saved", design);
          })
          .catch(error => {
            this.$emit("design-save-error");
          })
          .then(() => {
            this.isSaving = false;
          });
      }
    },
    ...mapMutations({
      updateCard: "interactiveMap/updateCard",
      setModified: "interactiveMap/setModified"
    })
  }
});
</script>

<style scoped>
.clickable {
  cursor: pointer;
}

.dead {
  color: red;
}
</style>
