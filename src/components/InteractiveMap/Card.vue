<template>
  <v-card class="mb-2">
    <v-toolbar
      dense
      :color="color"
      class="white--text"
      :class="{ clickable: !card.isSelected }"
      @click="selectCard"
    >
      <v-toolbar-title class="body-2">{{ card.name }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn flat icon v-if="!isLastCard" @click="removeCard">
        <v-icon>close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-progress-linear
      :indeterminate="true"
      v-if="card.isSimulating"
      class="my-0"
      height="3"
    ></v-progress-linear>
    <v-card-title primary-title class="py-2" v-if="card.isSelected">
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
          <span v-if="card.organism">{{ card.organism.name }}</span>
          <span v-else><em>Unknown</em></span>
        </v-flex>
        <v-flex class="xs6">
          Model:
        </v-flex>
        <v-flex class="xs6 text-xs-right">
          <span v-if="card.model">{{ card.model.name }}</span>
          <span v-else><em>Not selected</em></span>
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
            <span v-if="card.growthRate">
              {{ card.growthRate | round }} <em>h<sup>-1</sup></em>
            </span>
            <span v-else>
              N/A
            </span>
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

export default Vue.extend({
  name: "Card",
  props: ["card", "isLastCard"],
  filters: {
    round(value) {
      return value.toFixed(3);
    }
  },
  computed: {
    color() {
      if (this.card.isSelected) {
        return "primary";
      } else {
        return "grey";
      }
    }
  },
  methods: {
    selectCard() {
      this.$emit("select-card", this.card);
    },
    removeCard() {
      this.$emit("remove-card", this.card);
    }
  }
});
</script>

<style>
.clickable {
  cursor: pointer;
}
</style>
