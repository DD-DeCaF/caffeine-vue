<template>
  <div>
    <NewStrain v-model="isNewStrainDialogVisible" @return-object="passStrain" />
    <v-dialog v-model="isDialogVisible" full-width>
      <v-card class="pa-4">
        <div class="display-1 mb-2">Conditions</div>
        <v-navigation-drawer absolute permanent right>
          <v-layout column>
            <v-flex>
              <div class="body-2">Experiment name:</div>
            </v-flex>
            <v-flex>
              <v-text-field
                v-model="experimentName"
                class="mx-2"
              ></v-text-field>
            </v-flex>
          </v-layout>
        </v-navigation-drawer>
        <v-btn color="primary" small @click="addRow()">
          Add row
        </v-btn>
        <div ref="table" class="custom-tabulator"></div>
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
import VDatePicker from "vuetify/lib/components/VDatePicker/VDatePicker";

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
    tableData: [{ name: null, strain: { id: null, name: null }, medium: null }],
    isNewStrainDialogVisible: false,
    selectedRow: null,
    experimentName: null
  }),
  computed: {
    availableStrains() {
      return this.$store.state.strains.strains;
    },
    strains() {
      return [
        {
          id: "New Strain",
          name: ""
        },
        ...this.availableStrains
      ];
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
        { title: "Name", field: "name", editor: true },
        {
          title: "Strain",
          field: "strain",
          editor: "autocomplete",
          editorParams: () => ({
            showListOnEmpty: true,
            allowEmpty: true,
            values: this.strains,
            sortValuesList: "asc",
            listItemFormatter: value => {
              if (value.id === "New Strain") {
                return `
                  <div class="autocomplete--new-strain">
                    <i class="v-icon material-icons theme--light primary--text">
                      add_circle
                    </i>
                    New Strain
                  </div>
                `;
              } else {
                return this.tabulator.modules.format.sanitizeHTML(value.name);
              }
            }
          }),
          formatter: cell =>
            this.tabulator.modules.format.sanitizeHTML(cell.getValue().name),
          cellEditing: cell => {
            // Clear input without committing empty value.
            cell._cell.value = "";
          },
          cellEdited: cell => {
            if (cell.getValue().id === "New Strain") {
              this.selectedRow = cell.getRow();
              this.isNewStrainDialogVisible = true;
            }
          }
        },
        { title: "Medium", field: "medium", editor: true },
        {
          title: "Date",
          field: "date",
          editor: (cell, onRendered, success, cancel, editorParams) => {
            const DatePickerComponentClass = Vue.extend(VDatePicker);
            const instance = new DatePickerComponentClass({
              propsData: { color: "purple" },
              _parentListeners: {
                input: success
              }
            });
            // instance.$slots["prepend-item"] = [`<v-btn>New project</v-btn>`];
            return instance.$mount().$el;
          }
        }
      ]
    });
  },
  methods: {
    addRow() {
      this.tabulator.addRow({
        name: null,
        strain: { id: null, name: null },
        medium: null
      });
      console.log(this.tabulator.getData());
    },
    passStrain(strain) {
      this.selectedRow.update({
        strain: strain
      });
    }
  }
});
</script>

<style>
.custom-tabulator .tabulator-cell[tabulator-field='date'] {
  overflow: visible;
}
.custom-tabulator .tabulator-cell[tabulator-field='date'] .v-picker {
  z-index: 9000;
}
.autocomplete--new-strain {
  min-height: 33px;
  min-width: 120px;
  border-bottom: 1px #000 solid;
}
.autocomplete--new-strain .v-icon {
  padding-right: 3px;
  margin-bottom: -2px;
}
</style>
