<template>
  <div></div>
</template>

<script lang="ts">
  export default {
    name: "Design",
    data: () => {
      return {
        species: "",
        product: "",
        project: "",
        bigg: "",
        rhea: "",
        model: "",
        maxPredictions: 3,
        aerobic: false,
        isSubmitted: false
      };
    },
    methods: {
      onSubmit() {
        // trigger jobs polling
        this.$router.push({ name: "jobs" });
      }
    },
    validations: {},
    beforeRouteLeave(to, from, next) {
      if (!this.isSubmitted) {
        const answer = window.confirm('Do you really want to leave? You have pending changes!')
        if (answer) {
          next();
        } else {
          next(false);
        }
      }
    }
  };
</script>
