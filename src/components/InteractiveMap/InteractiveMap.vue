<template>
  <div class="interactive-map fill-height">
    <Escher
      @escher-loaded="escherLoaded"
      @simulate-card="simulate"
      @click="isSidepanelOpen = false"
      :card="selectedCard"
      :mapData="mapData"
    />
    <Legend />
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
    <v-navigation-drawer v-model="isSidepanelOpen" right absolute hide-overlay>
      <v-container class="py-1">
        <v-select
          label="Selected Map"
          :items="maps"
          item-text="name"
          item-value="id"
          v-model="currentMapId"
          @change="changeMap"
        ></v-select>
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
                <v-list-tile @click="addDefaultCard">
                  <v-list-tile-title v-on="on">Design</v-list-tile-title>
                </v-list-tile>
              </template>
              <span>Manipulate and simulate models.</span>
            </v-tooltip>
            <v-tooltip left>
              <template v-slot:activator="{ on }">
                <v-list-tile @click="addDataDrivenCard">
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
          @load-model-error="hasLoadModelError = true"
        />
      </v-container>
    </v-navigation-drawer>
    <v-snackbar color="error" v-model="hasSimulationError" :timeout="8000">
      Sorry, we were not able to complete the simulation successfully. Please
      try again in a few seconds, or contact us if the problem persists.
    </v-snackbar>
    <v-snackbar color="error" v-model="hasLoadModelError" :timeout="6000">
      The model could not be loaded, please try updating the card's model.
      Certain features will not work properly without the model.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import uuidv4 from "uuid/v4";
import * as settings from "@/settings";
import Escher from "@/components/InteractiveMap/Escher.vue";
import Card from "@/components/InteractiveMap/Card.vue";
import Legend from "@/components/InteractiveMap/Legend.vue";

export default Vue.extend({
  name: "InteractiveMap",
  components: {
    Escher,
    Card,
    Legend
  },
  data: () => ({
    isSidepanelOpen: true,
    escherBuilder: null,
    currentMapId: null,
    mapData: null,
    cards: [],
    selectedCard: null,
    playingInterval: null,
    hasSimulationError: false,
    hasLoadModelError: false
  }),
  computed: {
    maps() {
      // Sort maps by model name, then map name
      const maps: any[] = [...this.$store.state.maps.maps];
      maps.sort((map1, map2) => {
        if (map1.model_id !== map2.model_id) {
          const model1 = this.$store.getters["models/getModelById"](
            map1.model_id
          );
          let model1Name;
          if (model1) {
            model1Name = model1.name;
          } else {
            model1Name = "Unknown model";
          }

          const model2 = this.$store.getters["models/getModelById"](
            map2.model_id
          );
          let model2Name;
          if (model2) {
            model2Name = model2.name;
          } else {
            model2Name = "Unknown model";
          }
          return model1Name.localeCompare(model2Name);
        } else {
          return map1.name.localeCompare(map2.name);
        }
      });

      // Build a data structure for the v-select, grouping maps by model with
      // dividers and headers.
      const mapsWithHeaders: object[] = [];
      let previousModelId = null;
      maps.forEach(map => {
        if (map.model_id !== previousModelId) {
          if (mapsWithHeaders.length !== 0) {
            mapsWithHeaders.push({ divider: true });
          }
          let modelName;
          try {
            modelName = this.$store.getters["models/getModelById"](map.model_id)
              .name;
          } catch {
            modelName = "Unknown model";
          }
          mapsWithHeaders.push({ header: modelName });
        }
        mapsWithHeaders.push(map);
        previousModelId = map.model_id;
      });
      return mapsWithHeaders;
    },
    playing() {
      return this.playingInterval !== null;
    }
  },
  methods: {
    escherLoaded() {
      // Add a default card. Chain promises to ensure that data is available.
      this.$store.state.models.modelsPromise.then(() => {
        this.$store.state.organisms.organismsPromise.then(() => {
          this.addDefaultCard();
        });
      });
    },
    changeMap() {
      // TODO: Get map from maps state lazy loader
      axios
        .get(`${settings.apis.maps}/maps/${this.currentMapId}`)
        .then(response => {
          this.mapData = response.data.map;
        })
        .catch(error => {
          // TODO: show snackbar
        });
    },
    addDefaultCard() {
      // Select the default preferred organism and related model.
      // Note: Expecting organisms and models to be already loaded into state.
      // TODO: Use hardcoded list of preferred models for organisms
      const organism = this.$store.state.organisms.organisms.find(organism => {
        return organism.id === 2 && organism.name === "Escherichia coli";
      });
      const model = this.$store.state.models.models.find(model => {
        return model.id === 15 && model.name === "e_coli_core";
      });

      if (!organism || !model) {
        this.addCard("Design", null, null, "pfba");
      } else {
        this.addCard("Design", organism, model, "pfba");
      }
    },
    addDataDrivenCard() {
      // TODO
      alert("Not implemented");
    },
    addCard(name, organism, model, method) {
      const card = {
        uuid: uuidv4(),
        name: name,
        organism: organism,
        model: model,
        fullModel: null,
        method: method,
        objective: {
          reaction: null,
          maximize: true
        },
        reactionAdditions: [],
        reactionKnockouts: [],
        geneKnockouts: [],
        editedBounds: [],
        isSimulating: false,
        hasSimulationError: false,
        hasLoadModelError: false,
        growthRate: null,
        fluxes: null
      };
      this.cards.push(card);
      this.selectedCard = card;
      this.simulate(card);
    },
    removeCard(card) {
      if (card === this.selectedCard) {
        // Removing the current card - be sure to unset the reference.
        this.selectedCard = null;
      }
      this.cards.splice(this.cards.indexOf(card), 1);
    },
    selectCard(card) {
      this.selectedCard = card;
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
    simulate(card) {
      if (card.model === null) {
        // Cards are not guaranteed to have the model set (e.g. if the preferred
        // default model doesn't exist - that could be the case for local
        // installations of the platform).
        card.fluxes = null;
        card.growthRate = null;
        return;
      }

      // Add card operations
      // TODO: Reaction additions
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
      const operations = [
        ...reactionKnockouts,
        ...geneKnockouts,
        ...editedBounds
      ];

      card.isSimulating = true;
      card.hasSimulationError = false;
      axios
        .post(`${settings.apis.model}/simulate`, {
          model_id: card.model.id,
          method: card.method,
          operations: operations,
          objective_id: card.objective.reaction
            ? card.objective.reaction.id
            : null,
          objective_direction: card.objective.maximize ? "max" : "min"
        })
        .then(response => {
          card.growthRate = response.data.growth_rate;
          card.fluxes = response.data.flux_distribution;
        })
        .catch(error => {
          card.growthRate = null;
          card.fluxes = null;
          card.hasSimulationError = true;
          this.hasSimulationError = true;
        })
        .then(response => {
          card.isSimulating = false;
        });
    }
  },
  mounted() {
    // Set the chosen map to the preferred default. Wait for a potential fetch
    // request (important if the user navigates directly to this view).
    this.$store.state.maps.mapsPromise.then(() => {
      this.$store.state.maps.maps.forEach(map => {
        if (map.model_id === 15 && map.name === "Core metabolism") {
          this.currentMapId = map.id;
          this.changeMap();
        }
      });
    });
  }
});
</script>

<style scoped>
.sidepanel-toggle {
  position: absolute;
}
</style>
