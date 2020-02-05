<template>
  <a v-bind="$attrs" @click="trackClick">
    <slot></slot>
  </a>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "a-extended",
  inheritAttrs: false,
  methods: {
    trackClick() {
      if (
        this.$el.host !== window.location.host &&
        this.$el.protocol.includes("http")
      ) {
        this.$store.dispatch("analytics/link", {
          href: this.$el.href,
          protocol: this.$el.protocol,
          host: this.$el.host,
          hostname: this.$el.hostname,
          port: this.$el.port,
          pathname: this.$el.pathname,
          hash: this.$el.hash,
          search: this.$el.search,
          origin: this.$el.origin
        });
      }
    }
  }
});
</script>
