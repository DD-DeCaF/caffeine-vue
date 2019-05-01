<template>
  <v-card>
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
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import settings from "@/settings";

export default Vue.extend({
  name: "Card",
  props: ["card"],
  filters: {
    round(value) {
      return value.toFixed(3);
    }
  }
});
</script>
