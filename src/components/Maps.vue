<template>
  <v-container>
    <v-layout justify-center>
      <v-flex md6>
        Some Test Content Goes Here!
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "Maps",
  data: () => ({}),
  methods: {},
  computed: {
    isAuthenticated() {
      return this.$store.state.session.isAuthenticated;
    }
  }
});
</script>
