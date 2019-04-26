<template>
  <div>
    <v-dialog persistent v-model="isVisible" width="650">
      <v-card class="pa-2">
        <v-container text-md-center>
          <v-progress-circular
            indeterminate
            color="primary"
            size="150"
          ></v-progress-circular>
        <v-card-text> {{ loadingMessage }}</v-card-text>
        </v-container>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "LoaderDialog",
  props: ["isLoaderDialogVisible", "loadingMessage"],
  data: () => ({
  }),
  methods: {
  },
  computed: {
    isVisible: {
      get: function() {
        return this.isLoaderDialogVisible;
      },
      set: function(value) {
        if (this.$refs.form !== undefined) {
          this.$refs.form!.reset();
        }
        this.$store.commit("toggleDialog", "loader");
      }
    }
  },
  watch: {}
});
</script>
