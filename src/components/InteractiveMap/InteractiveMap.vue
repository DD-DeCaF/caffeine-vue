<template>
  <div class="interactive-map fill-height">
    <Escher
      @escher-loaded="escherLoaded"
      :fluxDistribution="fluxDistribution"
      :mapData="mapData"
    />
    <v-navigation-drawer permanent right absolute>
      <v-container class="py-1">
        <!-- TODO: Grouped maps -->
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
        <v-layout justify-space-around>
          <v-btn flat icon>
            <v-icon @click="addDefaultCard">add</v-icon>
          </v-btn>
          <v-btn flat icon>
            <v-icon>chevron_left</v-icon>
          </v-btn>
          <v-btn flat icon>
            <v-icon>play_arrow</v-icon>
          </v-btn>
          <v-btn flat icon>
            <v-icon>chevron_right</v-icon>
          </v-btn>
        </v-layout>
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
    fluxDistribution: null,
    mapData: null,
    cards: [],
    selectedCard: null
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
    addCard(name, organism, model, method) {
      const card = {
        name: name,
        organism: organism,
        model: model,
        method: method,
        isSimulating: false,
        growthRate: null
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
    simulate(card) {
      if (card.model === null) {
        // Cards are not guaranteed to have the model set (e.g. if the preferred
        // default model doesn't exist - that could be the case for local
        // installations of the platform).
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
          // TODO: Flux distribution should belong to the card
          this.fluxDistribution = response.data.flux_distribution;
        })
        .catch(error => {
          // TODO: show snackbar
          card.growthRate = null;
          // TODO: Flux distribution should belong to the card
          this.fluxDistribution = null;
          console.error(error);
        })
        .then(response => {
          card.isSimulating = false;
        });
    }
  },
  computed: {
    maps() {
      return this.$store.state.maps.maps;
    }
  },
  mounted() {
    // Set the chosen map to the preferred default. Wait for a potential fetch
    // request (important if the user navigates directly to this view).
    this.$store.getters["maps/onData"](() => {
      this.$store.state.maps.maps.forEach(map => {
        if (map.model_id === 10 && map.name === "Central metabolism") {
          this.currentMapId = map.id;
          this.changeMap();
        }
      });
    });
  }
});
</script>
