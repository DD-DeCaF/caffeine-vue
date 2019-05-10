<template>
  <div class="notfound">
    <img src="../assets/decaf-giraffe.svg" alt="DeCaF Giraffe" width="600" />
    <h1>404 not found</h1>
    <p>
      There is no page to be found at this address. Maybe you mistyped the URL?
    </p>
    <p>
      <router-link to="/">Back to Caffeine</router-link>
    </p>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "NotFound"
});
</script>

<style scoped>
.notfound {
  text-align: center;
}
</style>
