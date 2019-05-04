<template>
  <div class="interactive-map fill-height">
    <Escher
      @escher-loaded="escherLoaded"
      :card="selectedCard"
      :mapData="mapData"
    />
    <v-navigation-drawer permanent right absolute>
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
        <!-- TODO proper unique key -->
        <Card
          v-for="card in cards"
          :key="cards.indexOf(card)"
          :card="card"
          :isSelected="card === selectedCard"
          :isOnlyCard="cards.length === 1"
          @select-card="selectCard"
          @remove-card="removeCard"
          @simulate-card="simulate"
        />
      </v-container>
    </v-navigation-drawer>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import * as settings from "@/settings";
import Escher from "@/components/InteractiveMap/Escher.vue";
import Card from "@/components/InteractiveMap/Card.vue";

export default Vue.extend({
  name: "InteractiveMap",
  components: {
    Escher,
    Card
  },
  data: () => ({
    escherBuilder: null,
    currentMapId: null,
    mapData: null,
    cards: [],
    selectedCard: null,
    playingInterval: null
  }),
  methods: {
    escherLoaded() {
      this.$store.getters["models/onData"](this.addDefaultCard);
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
      const model = this.$store.state.models.models.find(
        model => model.name === "e_coli_core"
      );
      if (model) {
        const organism = this.$store.getters["organisms/getOrganismById"](
          model.organism_id
        );
        this.addCard("Design", organism, model, "pfba");
      } else {
        this.addCard("Design", null, null, "pfba");
      }
    },
    addDataDrivenCard() {
      // TODO
      alert("Not implemented");
    },
    addCard(name, organism, model, method) {
      const card = {
        name: name,
        organism: organism,
        model: model,
        method: method,
        isSimulating: false,
        growthRate: null,
        fluxes: null
      };
      this.cards.push(card);
      this.selectedCard = card;
      this.simulate(card);
    },
    removeCard(card) {
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

      card.isSimulating = true;
      axios
        .post(`${settings.apis.model}/simulate`, {
          model_id: card.model.id,
          method: card.method
        })
        .then(response => {
          card.growthRate = response.data.growth_rate;
          card.fluxes = response.data.flux_distribution;
        })
        .catch(error => {
          // TODO: show snackbar
          card.growthRate = null;
          card.fluxes = null;
          console.error(error);
        })
        .then(response => {
          card.isSimulating = false;
        });
    }
  },
  computed: {
    maps() {
      // Sort maps by model name, then map name
      const maps = this.$store.state.maps.maps;
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
          return model1Name > model2Name;
        } else {
          return map1.name > map2.name;
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
  mounted() {
    // Set the chosen map to the preferred default. Wait for a potential fetch
    // request (important if the user navigates directly to this view).
    this.$store.getters["maps/onData"](() => {
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
