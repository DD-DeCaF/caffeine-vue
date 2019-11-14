<template>
  <v-dialog @input="change" value="true" max-width="500px" persistent>
    <v-card class="text-xs-center pa-3">
      <v-card-text class="headline"
        >Please choose which {{ itemType }} the pasted data belongs
        to:</v-card-text
      >
      <v-select
        return-object
        :items="items"
        item-value="temporaryId"
        item-text="name"
        v-model="selectedItem"
        no-data-text="No data available. You can add it in the corresponding table."
      >
      </v-select>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" flat="flat" @click="choose(true)">
          Ok
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop } from "vue/types/options";

export default Vue.extend({
  name: "SelectDialog",
  props: {
    itemType: {
      type: String,
      required: true
    },
    items: {
      type: Array as Prop<Array<Object>>,
      required: true
    }
  },
  data: function() {
    return {
      value: null,
      selectedItem: this.items[0]
    };
  },
  methods: {
    choose(value: boolean) {
      this.value = value ? this.selectedItem : null;
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
