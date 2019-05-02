<template
  ><p></p
></template>

<script lang="ts">
import Vue from "vue";
import { mapGetters } from "vuex";

export default Vue.extend({
  name: "JobDetails",
  computed: {
    ...mapGetters({
      job: "jobs/getJobById",
    })
  }
});
</script>
