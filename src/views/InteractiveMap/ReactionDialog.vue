<template>
  <v-dialog v-model="showDialog" width="700">
    <v-card>
      Dialog for adding a reaction
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "ReactionDialog",
  props: ["model", "value"],
  data: () => ({}),
  computed: {
    showDialog: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("input", value);
      }
    }
  }
});
</script>
