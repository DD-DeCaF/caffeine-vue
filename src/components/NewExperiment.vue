<template>
  <div>
    <NewStrain v-model="isNewStrainDialogVisible" @return-object="passStrain" />
    <v-dialog v-model="isDialogVisible" full-width>
      <v-card class="pa-4">
        <div class="display-1 mb-2">Conditions</div>
        <v-navigation-drawer absolute permanent right> </v-navigation-drawer>
        <v-btn color="primary" small @click="addRow()">
          Add row
        </v-btn>
        <div ref="table"></div>
        <!-- <v-card-actions> -->
        <!-- <v-spacer></v-spacer> -->
        <v-btn color="secondary" flat @click="isDialogVisible = false">
          Cancel
        </v-btn>
        <v-btn color="primary">
          Submit
        </v-btn>
        <!-- </v-card-actions> -->
      </v-card>
    </v-dialog>
  </div>
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
    tabulator: null,
    tableData: [{ name: "name", strain: "strain", medium: "medium" }],
    isNewStrainDialogVisible: false,
    selectedRow: null,
  }),
  computed: {
    availableStrains() {
      return this.$store.state.strains.strains;
    },
    strains() {
      const result = { "New Strain": "New Strain" };
      this.availableStrains.forEach(
        strain => (result[strain.id] = strain.name)
      );
      return result;
    },
    isDialogVisible: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("input", value);
      }
    }
  },
  watch: {
    // Update table if data changes
    tableData: {
      handler: function(newData) {
        this.tabulator.replaceData(newData);
      },
      deep: true
    }
  },
  mounted() {
    this.tabulator = new Tabulator(this.$refs.table, {
      data: this.tableData,
      reactiveData: true,
      clipboard: true,
      clipboardPasteAction: "replace",
      height: 500,
      columns: [
        { title: "Name", field: "name" },
        {
          title: "Strain",
          field: "strain",
          editor: "autocomplete",
          editorParams: () => ({
            showListOnEmpty: true,
            allowEmpty: true,
            values: this.strains,
            sortValuesList: "asc"
          }),
          formatter: "lookup",
          formatterParams: () => this.strains,
          cellEditing: cell => {
            // Clear input without committing empty value.
            cell._cell.value = "";
          },
          cellEdited: cell => {
            if (cell.getValue() === "New Strain") {
              cell.setValue("");
              this.selectedRow = cell.getRow();
              this.isNewStrainDialogVisible = true;
            }
          }
        },
        { title: "Medium", field: "medium" },
        { title: "Date", field: "date" }
      ]
    });
  },
  methods: {
    addRow() {
      this.tabulator.addRow({});
      console.log(this.tabulator.getData());
    },
    passStrain(strain) {
      this.selectedRow.update({
        strain: strain.id,
      });
    }
  }
});
</script>
