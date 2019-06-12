<template>
  <div>
    <v-layout v-if="card.manipulations">
      <v-flex class="mr-2">
        <v-card>
          <v-subheader>Overexpression targets</v-subheader>
          <v-list v-for="manipulation in overexpressionTargets" :key="manipulation.id">
            <v-list-tile>
              <v-list-tile-content>
                <v-list-tile-title>
                  {{ manipulation.id }} ↑
                </v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-flex>
      <v-flex>
        <v-card class="mx-2">
          <v-subheader>Knock-down targets</v-subheader>
          <v-list v-for="manipulation in knockdownTargets" :key="manipulation.id">
            <v-list-tile>
              <v-list-tile-content>
                <v-list-tile-title>
                  {{ manipulation.id }} ↓
                </v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-flex>
    </v-layout>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapMutations } from "vuex";
import axios from "axios";
import * as settings from "@/utils/settings";

export default Vue.extend({
  name: "CardDialogDataDriven",
  props: ["card"],
  data: () => ({
  }),
  computed: {
    overexpressionTargets() {
       return [
        ...this.card.manipulations
      ]
        .filter(manipulation => manipulation.direction === 'up')
    },
    knockdownTargets() {
       return [
        ...this.card.manipulations
      ]
        .filter(manipulation => manipulation.direction === 'down')
    },
  },
  watch: {
  },
  methods: {
    ...mapMutations({
      updateCard: "interactiveMap/updateCard"
    })
  }
});
</script>
