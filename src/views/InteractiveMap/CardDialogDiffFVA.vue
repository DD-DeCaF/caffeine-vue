<template>
  <div>
    <v-layout>
      <v-radio-group v-model="showModulationTargets">
      Toggle flux modulation targets
      <v-radio
        label="Show targets and scores"
        value="True"
      ></v-radio>
      <v-radio
        label="Show flux distribution"
        value=False
      ></v-radio>
    </v-radio-group>
    </v-layout>

    <v-progress-linear
      :indeterminate="true"
      v-if="isLoadingConditionData"
    ></v-progress-linear>

    <div v-if="organismMismatch" class="mb-2">
      <v-alert :value="true" type="warning">
        You are applying experimental data for the strain
        <em>{{ conditionOrganism.name }}</em> to a model based on a different
        organism (<em>{{ card.organism.name }}</em
        >). Some data points may not apply succesfully.
      </v-alert>
    </div>

    <v-layout v-if="card.manipulations">
      <v-flex class="mr-2">
        <v-card>
          <v-subheader>Overexpression</v-subheader>
          <v-list v-for="manipulation in card.manipulations" :key="manipulation.id">
            <v-list-tile v-if="manipulation.direction === 'up'">
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
          <v-subheader>Knock-down</v-subheader>
          <v-list v-for="manipulation in card.manipulations" :key="manipulation.id">
            <v-list-tile v-if="manipulation.direction === 'down'">
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
  props: ["card", "modifications"],
  data: () => ({
    showModulationTargets: false,
  }),
  computed: {
    organismMismatch() {
      if (!this.card.organism || !this.conditionOrganism) {
        return false;
      }
      return this.card.organism.id != this.conditionOrganism.id;
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
