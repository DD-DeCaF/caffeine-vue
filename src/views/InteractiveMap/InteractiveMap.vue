<template>
  <div class="interactive-map fill-height">
    <v-progress-linear
      v-if="selectedCard && selectedCard.isSimulating"
      color="primary"
      :indeterminate="true"
      class="my-0"
    ></v-progress-linear>
    <Escher
      @simulate-card="simulate"
      @click="isSidepanelOpen = false"
      :card="selectedCard"
      :mapData="mapData"
    />
    <v-btn
      color="primary"
      small
      fab
      top
      right
      class="sidepanel-toggle"
      @click="isSidepanelOpen = true"
    >
      <v-icon>apps</v-icon>
    </v-btn>
    <v-navigation-drawer
      v-model="isSidepanelOpen"
      right
      absolute
      hide-overlay
      class="elevation-6"
    >
      <v-container class="py-1">
        <v-select-extended
          label="Selected Map"
          :items="maps"
          item-text="name"
          item-value="id"
          v-model="currentMapId"
          @change="changeMap"
        ></v-select-extended>
      </v-container>
      <v-divider></v-divider>
      <v-container class="pa-0">
        <v-menu offset-y>
          <template v-slot:activator="{ on }">
            <v-layout justify-space-around>
              <v-btn flat icon v-on="on">
                <v-icon>add</v-icon>
              </v-btn>
              <v-btn flat icon @click="selectPreviousCard">
                <v-icon>chevron_left</v-icon>
              </v-btn>
              <v-btn flat icon @click="togglePlay">
                <v-icon v-if="!playing">play_arrow</v-icon>
                <v-icon v-else>pause</v-icon>
              </v-btn>
              <v-btn flat icon @click="selectNextCard">
                <v-icon>chevron_right</v-icon>
              </v-btn>
            </v-layout>
          </template>
          <v-list>
            <v-tooltip left>
              <template v-slot:activator="{ on }">
                <v-list-tile @click="addDefaultCard('Design', true)">
                  <v-list-tile-title v-on="on">Design</v-list-tile-title>
                </v-list-tile>
              </template>
              <span>Manipulate and simulate models.</span>
            </v-tooltip>
            <v-tooltip left>
              <template v-slot:activator="{ on }">
                <v-list-tile @click="addDefaultCard('DataDriven', true)">
                  <v-list-tile-title v-on="on">Data driven</v-list-tile-title>
                </v-list-tile>
              </template>
              <span>Integrate experimental data with models.</span>
            </v-tooltip>
          </v-list>
        </v-menu>
      </v-container>
      <v-divider></v-divider>
      <v-container>
        <Card
          v-for="card in cards"
          :key="card.uuid"
          :card="card"
          :isSelected="card === selectedCard"
          :isOnlyCard="cards.length === 1"
          @select-card="selectCard"
          @remove-card="removeCard"
          @simulate-card="simulate"
          @simulation-error="hasSimulationError = true"
          @load-data-error="hasLoadDataError = true"
          @design-saved="designSaved"
          @design-save-error="hasSaveDesignError = true"
        />
      </v-container>
    </v-navigation-drawer>
    <v-snackbar color="error" v-model="hasSimulationError" :timeout="8000">
      Sorry, we were not able to complete the simulation successfully. Please
      try again in a few seconds, or contact us if the problem persists.
    </v-snackbar>
    <v-snackbar color="error" v-model="hasLoadMapError" :timeout="6000">
      The map could not be loaded. Please try again in a few moments.
    </v-snackbar>
    <v-snackbar color="error" v-model="hasLoadDataError" :timeout="6000">
      Experimental data could not be loaded. Please try again in a few moments,
      or contact us if the problem persists.
    </v-snackbar>
    <v-snackbar color="success" v-model="hasSaveDesignSuccess" :timeout="6000">
      Saved design {{ savedDesignName }}.
    </v-snackbar>
    <v-snackbar color="error" v-model="hasSaveDesignError" :timeout="6000">
      Sorry, we were not able to save the design. Please try again in a few
      moments.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapMutations } from "vuex";
import axios from "axios";
import uuidv4 from "uuid/v4";
import * as settings from "@/utils/settings";
import Escher from "@/views/InteractiveMap/Escher.vue";
import Card from "@/views/InteractiveMap/Card.vue";
import { Card as CardType } from "@/store/modules/interactiveMap";
import { partitionedList } from "@/utils/utility";

export default Vue.extend({
  name: "InteractiveMap",
  components: {
    Escher,
    Card
  },
  data: () => ({
    isSidepanelOpen: true,
    escherBuilder: null,
    mapData: null,
    selectedCardId: null,
    playingInterval: null,
    hasSimulationError: false,
    hasLoadMapError: false,
    hasLoadDataError: false,
    hasSaveDesignError: false,
    hasSaveDesignSuccess: false,
    savedDesignName: null
  }),
  computed: {
    currentMapId: {
      get() {
        return this.$store.state.interactiveMap.currentMapId;
      },
      set(currentMapId) {
        this.$store.commit("interactiveMap/setCurrentMapId", currentMapId);
      }
    },
    cards() {
      return this.$store.state.interactiveMap.cards;
    },
    selectedCard() {
      if (!this.selectedCardId) {
        return null;
      }
      return this.cards.find(c => c.uuid === this.selectedCardId);
    },
    maps() {
      return partitionedList("maps", "models");
    },
    playing() {
      return this.playingInterval !== null;
    }
  },
  mounted() {
    // Set the preferred default map.
    if (this.currentMapId) {
      // The user has already chosen a map - just make sure it's loaded.
      this.changeMap();
    } else {
      // Wait for a potential fetch request (important if the user navigates
      // directly to this view).
      this.$store.state.maps.mapsPromise.then(() => {
        this.$store.state.maps.maps.forEach(map => {
          if (map.model_id === 15 && map.name === "Core metabolism") {
            this.currentMapId = map.id;
            this.changeMap();
          }
        });
      });
    }

    if (this.$store.state.interactiveMap.cards.length > 0) {
      // There are already cards in the store - ensure they are all simulated
      // (cards added from other components won't initially be simulated)
      this.$store.state.interactiveMap.cards.forEach(card => {
        const model = this.$store.getters["models/getModelById"](card.modelId);
        this.simulate(card, model);
      });
      // Select the last card in the list by default.
      this.selectedCardId = this.$store.state.interactiveMap.cards[
        this.$store.state.interactiveMap.cards.length - 1
      ].uuid;
    } else {
      // No cards are added at this point, so add a default card to provide
      // the user with some initial data. Chain promises to ensure that data
      // is available.
      this.$store.state.models.modelsPromise.then(() => {
        this.$store.state.organisms.organismsPromise.then(() => {
          this.addDefaultCard("Design", false);
        });
      });
    }
  },
  methods: {
    changeMap() {
      this.hasLoadMapError = false;
      axios
        .get(`${settings.apis.maps}/maps/${this.currentMapId}`)
        .then(response => {
          this.mapData = response.data.map;
        })
        .catch(error => {
          this.mapData = null;
          this.hasLoadMapError = true;
        });
    },
    addDefaultCard(cardType, withDialog) {
      let name = "";
      switch (cardType) {
        case "Design":
          name = "Design";
          break;
        case "DataDriven":
          name = "Data driven";
          break;
        case "DiffFVA":
          name = "Differential FVA";
          break;
      }
      // Select the default preferred organism and related model.
      // Note: Expecting organisms and models to be already loaded into state.
      // TODO: Use hardcoded list of preferred models for organisms
      const organism = this.$store.state.organisms.organisms.find(organism => {
        return organism.id === 2 && organism.name === "Escherichia coli";
      });
      const model = this.$store.state.models.models.find(model => {
        return model.id === 15 && model.name === "e_coli_core";
      });

      if (!organism || !model || cardType == "DataDriven" || withDialog) {
        this.addCard(name, null, null, "pfba", cardType, withDialog);
      } else {
        this.addCard(name, organism, model, "pfba", cardType, withDialog);
      }
    },
    addCard(name, organism, model, method, cardType, withDialog) {
      const card: CardType = {
        uuid: uuidv4(),
        name: name,
        designId: null,
        organism: organism,
        modelId: model ? model.id : null,
        method: method,
        modified: false,
        type: cardType,
        objective: {
          reaction: null,
          maximize: true
        },
        reactionAdditions: [],
        reactionKnockouts: [],
        reactionDeletions: [],
        geneKnockouts: [],
        editedBounds: [],
        // Data-driven card fields
        experiment: null,
        condition: null,
        conditionData: null,
        conditionWarnings: [],
        conditionErrors: [],
        // General simulation fields
        isSimulating: false,
        hasSimulationError: false,
        solverStatus: null,
        growthRate: null,
        fluxes: null,
        withDialog: withDialog,
        // Specific fields for design prediction methods
        manipulations: null,
        productionGrowthRate: null,
        showDiffFVAScore: false
      };
      this.$store.commit("interactiveMap/addCard", card);
      this.selectedCardId = card.uuid;
      this.simulate(card, model);
    },
    removeCard(card) {
      if (card === this.selectedCard) {
        // Removing the current card - be sure to unset the reference.
        this.selectedCardId = null;
      }
    },
    selectCard(card) {
      this.selectedCardId = card.uuid;
    },
    selectPreviousCard() {
      const index = this.cards.indexOf(this.selectedCard);
      if (index === 0) {
        this.selectCard(this.cards[this.cards.length - 1]);
      } else {
        this.selectCard(this.cards[index - 1]);
      }
    },
    selectNextCard() {
      const index = this.cards.indexOf(this.selectedCard);
      if (index === this.cards.length - 1) {
        this.selectCard(this.cards[0]);
      } else {
        this.selectCard(this.cards[index + 1]);
      }
    },
    togglePlay() {
      if (this.playing) {
        clearInterval(this.playingInterval);
        this.playingInterval = null;
      } else {
        // Trigger an instant call in addition to starting the interval timer.
        this.selectNextCard();
        this.playingInterval = setInterval(this.selectNextCard, 1000);
      }
    },
    simulate(card, model) {
      // Note that the card and model objects are passed instead of using
      // `selectedCard`, as the selected card could have
      // been changed by the time this is called.
      if (!model) {
        // Cards are not guaranteed to have the model set (e.g. if the preferred
        // default model doesn't exist - that could be the case for local
        // installations of the platform).
        return;
      }
      this.postSimulation(card, model, this.cardModifications(card));
    },
    cardModifications(card) {
      // Collect card operations from modifications
      const reactionDeletions = card.reactionDeletions.map(reaction => ({
        operation: "remove",
        type: "reaction",
        id: reaction.id
      }));
      const reactionAdditions = card.reactionAdditions.map(reaction => ({
        operation: "add",
        type: "reaction",
        id: reaction.id,
        data: {
          id: reaction.id,
          name: reaction.name,
          lower_bound: reaction.lowerBound,
          upper_bound: reaction.upperBound,
          metabolites: Object.assign(
            {},
            ...reaction.metabolites.map(m => ({
              [`${m.id}_${m.compartment}`]: m.stoichiometry
            }))
          )
        }
      }));
      const reactionKnockouts = card.reactionKnockouts.map(reaction => ({
        operation: "knockout",
        type: "reaction",
        id: reaction.id
      }));
      const geneKnockouts = card.geneKnockouts.map(gene => ({
        operation: "knockout",
        type: "gene",
        id: gene.id
      }));
      const editedBounds = card.editedBounds.map(reaction => ({
        operation: "modify",
        type: "reaction",
        id: reaction.id,
        data: {
          lower_bound: reaction.lowerBound,
          upper_bound: reaction.upperBound
        }
      }));
      return [
        ...reactionDeletions,
        ...reactionAdditions,
        ...reactionKnockouts,
        ...geneKnockouts,
        ...editedBounds
      ];
    },
    postSimulation(card, model, operations) {
      this.updateCard({
        uuid: card.uuid,
        props: {
          isSimulating: true,
          hasSimulationError: false
        }
      });
      axios
        .post(`${settings.apis.simulations}/simulate`, {
          model_id: model.id,
          method: card.method,
          operations: operations,
          objective_id: card.objective.reaction
            ? card.objective.reaction.id
            : null,
          objective_direction: card.objective.maximize ? "max" : "min"
        })
        .then(response => {
          if (response.data.status === "optimal") {
            this.updateCard({
              uuid: card.uuid,
              props: {
                solverStatus: response.data.status,
                growthRate: response.data.growth_rate,
                fluxes: response.data.flux_distribution
              }
            });
          } else {
            this.updateCard({
              uuid: card.uuid,
              props: {
                solverStatus: response.data.status,
                growthRate: null,
                fluxes: null
              }
            });
          }
        })
        .catch(error => {
          this.updateCard({
            uuid: card.uuid,
            props: { hasSimulationError: true }
          });
          this.hasSimulationError = true;
        })
        .then(response => {
          this.updateCard({
            uuid: card.uuid,
            props: { isSimulating: false }
          });
        });
    },
    designSaved(design) {
      this.hasSaveDesignSuccess = true;
      this.savedDesignName = design.name;
    },
    ...mapMutations({
      updateCard: "interactiveMap/updateCard"
    })
  }
});
</script>

<style scoped>
.sidepanel-toggle {
  position: absolute;
}
</style>
