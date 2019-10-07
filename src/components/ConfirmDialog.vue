<template>
  <v-dialog @input="change" value="true" max-width="500px">
    <v-card class="text-xs-center pa-3">
      <v-icon large color="warning" class="warning-icon">warning</v-icon>
      <v-card-text class="headline">{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" flat="flat" @click="choose(false)">
          {{ buttonFalseText }}
        </v-btn>
        <v-btn color="primary" flat="flat" @click="choose(true)">
          {{ buttonTrueText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "ConfirmDialog",
  props: {
    buttonTrueText: {
      type: String,
      default: "Yes"
    },
    buttonFalseText: {
      type: String,
      default: "Cancel"
    },
    message: {
      type: String,
      required: true
    }
  },
  data: () => ({
    value: false
  }),
  methods: {
    choose(value: boolean) {
      this.value = value;
      this.$destroy();
    },
    change(isDialogVisible: boolean) {
      if (!isDialogVisible) {
        this.$destroy();
      }
    }
  }
});
</script>
