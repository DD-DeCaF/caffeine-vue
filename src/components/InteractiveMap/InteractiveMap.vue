<template>
  <div class="interactive-map fill-height">
    <v-progress-linear
      v-if="isLoadingMap"
      :indeterminate="true"
      class="my-0"
      height="12"
    ></v-progress-linear>
    <div class="escher-container fill-height">
      <v-container fluid fill-height v-if="isInitializingEscher">
        <v-layout align-center justify-center>
          <p class="display-1">
            <v-progress-circular
              indeterminate
              size="60"
              :width="2"
              class="mr-2"
            ></v-progress-circular>
            Initializing Escher, please wait...
          </p>
        </v-layout>
      </v-container>
      <div ref="escher" class="fill-height"></div>
    </div>
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
        <v-card v-for="card in cards" :key="JSON.stringify(card)">
          <v-toolbar dense color="primary" dark>
            <v-toolbar-title class="body-2">{{ card.name }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn flat icon>
              <v-icon>close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-progress-linear
            :indeterminate="true"
            v-if="card.isSimulating"
            class="my-0"
            height="3"
          ></v-progress-linear>
          <v-card-title primary-title class="py-2">
            <v-layout justify-space-around>
              <v-btn flat icon>
                <v-icon>info</v-icon>
              </v-btn>
              <v-btn flat icon>
                <v-icon>edit</v-icon>
              </v-btn>
            </v-layout>
            <v-layout wrap>
              <v-flex class="xs6">
                Organism:
              </v-flex>
              <v-flex class="xs6 text-xs-right">
                {{ card.organism.name }}
              </v-flex>
              <v-flex class="xs6">
                Model:
              </v-flex>
              <v-flex class="xs6 text-xs-right">
                {{ card.model.name }}
              </v-flex>
              <v-flex class="xs6">
                Method:
              </v-flex>
              <v-flex class="xs6 text-xs-right">
                {{ card.method }}
              </v-flex>
              <v-flex class="xs6">
                Growth rate:
              </v-flex>
              <v-flex class="xs6 text-xs-right">
                <div v-if="!card.isSimulating">
                  {{ card.growthRate | round }} <em>h<sup>-1</sup></em>
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
          </v-card-title>
        </v-card>
      </v-container>
    </v-navigation-drawer>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
/// <reference path="@/types/escher.d.ts" />
import * as escher from "@dd-decaf/escher";
import * as settings from "@/settings";

export default Vue.extend({
  name: "InteractiveMap",
  data: () => ({
    escherBuilder: null,
    isInitializingEscher: true,
    currentMapId: null,
    isLoadingMap: false,
    cards: []
  }),
  filters: {
    round(value) {
      return value.toFixed(3);
    }
  },
  methods: {
    changeMap() {
      this.isLoadingMap = true;
      // TODO: Get map from maps state lazy loader
      axios
        .get(`${settings.apis.maps}/maps/${this.currentMapId}`)
        .then(response => {
          // Note that this will freeze the entire application, including
          // progress spinners.
          this.escherBuilder.load_map(response.data.map);
          this.isLoadingMap = false;
        })
        .catch(error => {
          // TODO: show snackbar
        });
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
          this.escherBuilder.set_reaction_data(response.data.flux_distribution);
          this.escherBuilder._update_data(true, true);
        })
        .catch(error => {
          // TODO: show snackbar
          this.escherBuilder.set_reaction_data(null);
          console.error(error);
        })
        .then(response => {
          card.isSimulating = false;
        });
    },
    reactionState(id: string, type?: string) {
      // TODO
    },
    handleKnockout(reactionId: string) {
      // TODO
    },
    handleKnockoutGenes(reactionId: string) {
      // TODO
    },
    handleSetAsObjective(reactionId: string) {
      // TODO
    },
    handleChangeBounds(reactionId: string, lower: string, upper: string) {
      // TODO
    },
    handleResetBounds(reactionId: string) {
      // TODO
    },
    handleObjectiveDirection(reactionId: string) {
      // TODO
    }
  },
  computed: {
    maps() {
      return this.$store.state.maps.maps;
    }
  },
  mounted() {
    this.escherBuilder = escher.Builder(null, null, null, this.$refs.escher, {
      menu: "zoom",
      scroll_behavior: "zoom",
      fill_screen: false,
      ignore_bootstrap: true,
      never_ask_before_quit: true,
      reaction_styles: ["color", "size", "text", "abs"],
      identifiers_on_map: "bigg_id",
      hide_all_labels: false,
      hide_secondary_metabolites: false,
      highlight_missing: true,
      reaction_scale: [
        { type: "min", color: "#A841D0", size: 20 },
        { type: "Q1", color: "#868BB2", size: 20 },
        { type: "Q3", color: "#6DBFB0", size: 20 },
        { type: "max", color: "#54B151", size: 20 }
      ],
      reaction_no_data_color: "#CBCBCB",
      reaction_no_data_size: 10,
      tooltip: "custom",
      enable_editing: false,
      enable_fva_opacity: true,
      show_gene_reaction_rules: true,
      zoom_extent_canvas: true,
      first_load_callback: () => {
        this.isInitializingEscher = false;
        // TODO: Data might not be available at this point - need to latch onto
        // the fetch action promise
        const organism = this.$store.state.organisms.organisms[0];
        const model = this.$store.state.models.models[2];
        this.addCard("Design", organism, model, "pfba");
      },
      reaction_state: this.reactionState,
      tooltip_callbacks: {
        knockout: this.handleKnockout,
        knockoutGenes: this.handleKnockoutGenes,
        setAsObjective: this.handleSetAsObjective,
        changeBounds: this.handleChangeBounds,
        resetBounds: this.handleResetBounds,
        objectiveDirection: this.handleObjectiveDirection
      }
    });
  }
});
</script>
