<template>
  <div>
    <NewStrain v-model="isNewStrainDialogVisible" @return-object="passStrain" />
    <v-dialog v-model="isDialogVisible" full-width>
      <v-layout>
        <v-flex md9>
          <v-card class="pa-4" min-height="600">
            <div class="display-1 mb-2">{{ selectedTableName }}</div>
            <v-btn color="primary" small>
              Add row
            </v-btn>
            <template v-if="selectedTable === 'conditions'">
              <v-data-table
                :headers="conditionsHeaders"
                :items="conditions"
                :pagination.sync="pagination"
              >
                <template v-slot:items="{ item: condition, index: index }">
                  <td>
                    <v-edit-dialog :return-value.sync="condition.name">
                      {{ condition.name }}
                      <template v-slot:input>
                        <v-text-field v-model="condition.name"></v-text-field>
                      </template>
                    </v-edit-dialog>
                  </td>
                  <td>
                    <v-autocomplete-extended
                      return-object
                      item-text="name"
                      item-value="id"
                      v-model="condition.strain"
                      :items="availableStrains"
                      name="strain"
                      type="text"
                    >
                      <template v-slot:prepend-item>
                        <v-btn
                          flat
                          @click.stop="
                            isNewStrainDialogVisible = true;
                            currentRowIndex = index;
                          "
                          class="pl-0"
                        >
                          <v-icon class="mr-4" color="primary"
                            >add_circle</v-icon
                          >
                          New Strain
                        </v-btn>
                        <v-divider class="my-2"></v-divider>
                      </template>
                    </v-autocomplete-extended>
                  </td>
                </template>
              </v-data-table>
            </template>

            <template v-if="selectedTable === 'samples'">
              <v-data-table
                :headers="samplesHeaders"
                :items="samples"
                :pagination.sync="pagination"
              >
                <template v-slot:items="{ item: sample, index: index }">
                  <td>
                    <!-- <v-select :items="conditions.map(c => c.name)" v-model="sample.condition"> -->
                    <v-select
                      return-object
                      :items="conditions"
                      item-text="name"
                      v-model="sample.condition"
                    >
                    </v-select>
                  </td>
                  <td>
                    <v-edit-dialog :return-value.sync="sample.numerator">
                      {{ sample.numerator }}
                      <template v-slot:input>
                        <v-text-field v-model="sample.numerator"></v-text-field>
                      </template>
                    </v-edit-dialog>
                  </td>
                  <td>
                    <v-edit-dialog :return-value.sync="sample.denominator">
                      {{ sample.denominator }}
                      <template v-slot:input>
                        <v-text-field
                          v-model="sample.denominator"
                        ></v-text-field>
                      </template>
                    </v-edit-dialog>
                  </td>
                </template>
              </v-data-table>
            </template>
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
        </v-flex>
        <v-flex md3>
          <v-card class="pa-4" min-height="600">
            <v-radio-group v-model="selectedTable">
              <v-radio
                label="Conditions"
                value="conditions"
                color="primary"
              ></v-radio>
              <v-radio
                label="Samples"
                value="samples"
                color="primary"
              ></v-radio>
            </v-radio-group>
          </v-card>
        </v-flex>
      </v-layout>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "NewExperiment",
  props: {
    value: {
      type: Boolean,
      required: true
    }
  },
  data: () => ({
    conditions: [{}],
    samples: [{}],
    isNewStrainDialogVisible: false,
    currentRowIndex: null,
    selectedTable: "conditions",
    tableNames: {
      conditions: "Conditions",
      samples: "Samples"
    },
    conditionsHeaders: [
      { text: "Name", value: "name" },
      { text: "Strain", value: "strain" },
      { text: "Medium", value: "medium" },
      { text: "Date", value: "date" }
    ],
    samplesHeaders: [
      { text: "Condition", value: "condition" },
      { text: "Date", value: "date" },
      { text: "Time", value: "time" },
      { text: "Numerator", value: "numerator" },
      { text: "Denominator", value: "denominator" },
      { text: "Unit", value: "unit" },
      { text: "Value", value: "value" }
    ],
    pagination: {
      rowsPerPage: 10
    }
  }),
  computed: {
    availableStrains() {
      return this.$store.state.strains.strains;
    },
    selectedTableName() {
      return this.tableNames[this.selectedTable];
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
  methods: {
    passStrain(strain) {
      this.conditions[this.currentRowIndex].strain = strain;
    }
  }
});
</script>
