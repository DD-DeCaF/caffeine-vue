<template>
  <div class="interactive-map fill-height">
    <v-progress-linear
      v-if="isLoadingMap"
      :indeterminate="true"
      class="my-0"
      height="12"
    ></v-progress-linear>
    <Escher
      @escher-loaded="escherLoaded"
      @map-loaded="mapLoaded"
      :fluxDistribution="fluxDistribution"
      :mapData="mapData"
    />
    <v-navigation-drawer permanent right absolute>
      <v-container class="py-1">
        <!-- TODO: Grouped maps -->
        <!-- TODO: Select default map -->
        <v-select
          label="Selected Map"
          :items="maps"
          item-text="name"
          item-value="id"
          v-model="currentMapId"
          :disabled="isLoadingMap"
          @change="changeMap"
        ></v-select>
      </v-container>
      <v-divider></v-divider>
      <v-container class="pa-0">
        <v-layout justify-space-around>
          <v-btn flat icon>
            <v-icon>add</v-icon>
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
        <Card v-for="card in cards" :key="JSON.stringify(card)" :card="card" />
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
    isLoadingMap: false,
    fluxDistribution: null,
    mapData: null,
    cards: []
  }),
  methods: {
    escherLoaded() {
      // TODO: Data might not be available at this point - need to latch onto
      // the fetch action promise
      const organism = this.$store.state.organisms.organisms[0];
      const model = this.$store.state.models.models[2];
      this.addCard("Design", organism, model, "pfba");
    },
    changeMap() {
      this.isLoadingMap = true;
      // TODO: Get map from maps state lazy loader
      axios
        .get(`${settings.apis.maps}/maps/${this.currentMapId}`)
        .then(response => {
          this.mapData = response.data.map;
        })
        .catch(error => {
          // TODO: show snackbar
          this.isLoadingMap = false;
        });
    },
    mapLoaded() {
      this.isLoadingMap = false;
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
      this.simulate(card);
    },
    simulate(card) {
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
  }
});
</script>
