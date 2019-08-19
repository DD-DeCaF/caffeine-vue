<template>
  <v-dialog v-model="isDialogVisible" full-width>
    <v-card class="pa-3">
      <v-btn color="primary" @click="addRow()">
        Add row
      </v-btn>
      <div ref="table"></div>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" flat @click="isDialogVisible = false">
          Cancel
        </v-btn>
        <v-btn color="primary">
          Submit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<script lang="ts">
import Vue from "vue";

var Tabulator = require("tabulator-tables");

export default Vue.extend({
  name: "NewExperiment",
  props: {
    value: {
      type: Boolean,
      required: true
    }
  },
  data: () => ({
    tabulator: null
    // data for table to display
    // tableData: [{}]
  }),
  computed: {
    isDialogVisible: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("input", value);
      }
    }
  },
  // watch: {
  //   // Update table if data changes
  //   tableData: {
  //     handler: function(newData) {
  //       this.tabulator.replaceData(newData);
  //     },
  //     deep: true
  //   }
  // },
  mounted() {
    this.tabulator = new Tabulator(this.$refs.table, {
      // data: this.tableData,
      reactiveData: true,
      clipboard: true,
      clipboardPasteAction: "replace",
      columns: [
        { title: "Name", field: "name", editor: "input" },
        { title: "Protocol", field: "protocol", editor: true },
        {
          title: "Temperature",
          field: "temperature",
          editor: true
        },
        { title: "Aerobic", field: "aerobic", editor: true }
      ]
    });
  },
  methods: {
    addRow() {
      this.tabulator.addRow({});
      console.log(this.tabulator.getData());
    }
  }
});
</script>
