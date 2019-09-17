<template>
  <div>
    <NewStrain v-model="isNewStrainDialogVisible" @return-object="passStrain" />
    <NewMedium v-model="isNewMediumDialogVisible" @return-object="passMedium" />
    <NewProject
      v-model="isProjectCreationDialogVisible"
      @return-object="passProject"
    />
    <v-form ref="newExperimentForm">
      <v-dialog
        v-model="isDialogVisible"
        full-width
        content-class="full-height-dialog"
      >
        <v-card height="100%">
          <v-layout>
            <v-flex md10>
              <v-card class="pa-4" elevation="0">
                <div class="display-1 mb-2">{{ selectedTable.name }}</div>
                <v-btn color="primary" small @click="addRow()">
                  Add row
                </v-btn>
                <!-- Conditions table -->
                <div v-show="selectedTableKey === 'conditions'">
                  <v-data-table
                    :headers="selectedTable.headers"
                    :items="tables.conditions.items"
                    :pagination.sync="pagination"
                    disable-initial-sort
                  >
                    <template v-slot:items="{ item: condition, index: index }">
                      <td>
                        <v-text-field v-model="condition.name"></v-text-field>
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
                          ref="strainAutocomplete"
                          :rules="[
                            requiredIfHasMain(condition.strain, condition)
                          ]"
                        >
                          <template v-slot:prepend-item>
                            <v-list-tile
                              ripple
                              @click="
                                isNewStrainDialogVisible = true;
                                currentRowIndex = index;
                                $refs.strainAutocomplete.isMenuActive = false;
                              "
                            >
                              <v-icon class="mr-3" color="primary"
                                >add_circle</v-icon
                              >
                              <v-list-tile-title>
                                New Strain
                              </v-list-tile-title>
                            </v-list-tile>
                            <v-divider class="my-2"></v-divider>
                          </template>
                        </v-autocomplete-extended>
                      </td>
                      <td>
                        <v-autocomplete-extended
                          return-object
                          item-text="name"
                          item-value="id"
                          v-model="condition.medium"
                          :items="availableMedia"
                          name="medium"
                          type="text"
                          ref="mediumAutocomplete"
                          :rules="[
                            requiredIfHasMain(condition.medium, condition)
                          ]"
                        >
                          <template v-slot:prepend-item>
                            <v-list-tile
                              ripple
                              @click="
                                isNewMediumDialogVisible = true;
                                currentRowIndex = index;
                                $refs.mediumAutocomplete.isMenuActive = false;
                              "
                            >
                              <v-icon class="mr-3" color="primary"
                                >add_circle</v-icon
                              >
                              <v-list-tile-title>
                                New Medium
                              </v-list-tile-title>
                            </v-list-tile>
                            <v-divider class="my-2"></v-divider>
                          </template>
                        </v-autocomplete-extended>
                      </td>
                    </template>
                  </v-data-table>
                </div>

                <!-- Samples table -->
                <div v-show="selectedTableKey === 'samples'">
                  <v-data-table
                    :headers="selectedTable.headers"
                    :items="tables.samples.items"
                    :pagination.sync="pagination"
                    disable-initial-sort
                  >
                    <template v-slot:items="{ item: sample, index: index }">
                      <td>
                        <v-select
                          return-object
                          :items="tables.conditions.items.filter(c => c.name)"
                          item-value="temporaryId"
                          item-text="name"
                          v-model="sample.condition"
                          no-data-text="No data available. You can add it in Conditions table."
                        >
                        </v-select>
                      </td>
                      <!-- Name field was added, so user can distinguish -->
                      <!-- samples in other tables -->
                      <td>
                        <v-text-field v-model="sample.name"></v-text-field>
                      </td>
                      <td>
                        <v-text-field
                          v-model="sample.startTime"
                          mask="date-with-time"
                          return-masked-value
                          placeholder="dd/mm/yyyy hh:mm"
                        ></v-text-field>
                      </td>
                      <td>
                        <v-text-field
                          v-model="sample.endTime"
                          mask="date-with-time"
                          return-masked-value
                          placeholder="dd/mm/yyyy hh:mm"
                        ></v-text-field>
                      </td>
                    </template>
                  </v-data-table>
                </div>

                <!-- Fluxomics table -->
                <div v-show="selectedTableKey === 'fluxomics'">
                  <v-data-table
                    :headers="selectedTable.headers"
                    :items="tables.fluxomics.items"
                    :pagination.sync="pagination"
                    disable-initial-sort
                  >
                    <template
                      v-slot:items="{ item: fluxomicsItem, index: index }"
                    >
                      <td>
                        <v-select
                          return-object
                          :items="tables.samples.items.filter(s => s.name)"
                          item-text="name"
                          item-value="temporaryId"
                          v-model="fluxomicsItem.sample"
                          no-data-text="No data available. You can add it in Samples table."
                          @paste="paste(0, index, selectedTable, $event)"
                        >
                        </v-select>
                      </td>
                      <td>
                        <AutocompleteMnxReaction
                          hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known reactions."
                          @change="fluxomicsItem.reaction = $event.reaction"
                          @paste="paste(1, index, selectedTable, $event)"
                          :forceSearchQuery="
                            fluxomicsItem.reaction &&
                              fluxomicsItem.reaction._pastedText
                          "
                        ></AutocompleteMnxReaction>
                      </td>
                      <td>
                        <v-text-field
                          v-model.number="fluxomicsItem.measurement"
                          suffix="mmol/g/h"
                          type="number"
                          step="any"
                          @paste="paste(2, index, selectedTable, $event)"
                        ></v-text-field>
                      </td>
                      <td>
                        <v-text-field
                          v-model.number="fluxomicsItem.uncertainty"
                          suffix="mmol/g/h"
                          type="number"
                          step="any"
                          @paste="paste(3, index, selectedTable, $event)"
                        ></v-text-field>
                      </td>
                    </template>
                  </v-data-table>
                </div>

                <!-- Metabolomics table -->
                <div v-show="selectedTableKey === 'metabolomics'">
                  <v-data-table
                    :headers="selectedTable.headers"
                    :items="tables.metabolomics.items"
                    :pagination.sync="pagination"
                    disable-initial-sort
                  >
                    <template
                      v-slot:items="{ item: metabolomicsItem, index: index }"
                    >
                      <td>
                        <v-select
                          return-object
                          :items="tables.samples.items.filter(s => s.name)"
                          item-text="name"
                          item-value="temporaryId"
                          v-model="metabolomicsItem.sample"
                          no-data-text="No data available. You can add it in Samples table."
                        >
                        </v-select>
                      </td>
                      <td>
                        <AutocompleteMnxMetabolite
                          hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known metabolites."
                          @change="
                            metabolomicsItem.compound = {
                              name: $event.name,
                              id: $event.mnx_id
                            }
                          "
                        ></AutocompleteMnxMetabolite>
                      </td>
                      <td>
                        <v-text-field
                          v-model.number="metabolomicsItem.measurement"
                          suffix="mmol/l"
                          type="number"
                          step="any"
                        ></v-text-field>
                      </td>
                      <td>
                        <v-text-field
                          v-model.number="metabolomicsItem.uncertainty"
                          suffix="mmol/l"
                          type="number"
                          step="any"
                        ></v-text-field>
                      </td>
                    </template>
                  </v-data-table>
                </div>

                <!-- Uptake/Secretion rates table -->
                <div v-show="selectedTableKey === 'uptakeSecretion'">
                  <v-data-table
                    :headers="selectedTable.headers"
                    :items="tables.uptakeSecretion.items"
                    :pagination.sync="pagination"
                    disable-initial-sort
                  >
                    <template
                      v-slot:items="{ item: uptakeSecretionItem, index: index }"
                    >
                      <td>
                        <v-select
                          return-object
                          :items="tables.samples.items.filter(s => s.name)"
                          item-text="name"
                          item-value="temporaryId"
                          v-model="uptakeSecretionItem.sample"
                          no-data-text="No data available. You can add it in Samples table."
                        >
                        </v-select>
                      </td>
                      <td>
                        <AutocompleteMnxMetabolite
                          hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known metabolites."
                          @change="
                            uptakeSecretionItem.compound = {
                              name: $event.name,
                              id: $event.mnx_id
                            }
                          "
                        ></AutocompleteMnxMetabolite>
                      </td>
                      <td>
                        <v-text-field
                          v-model.number="uptakeSecretionItem.measurement"
                          suffix="mmol/g/h"
                          type="number"
                          step="any"
                        ></v-text-field>
                      </td>
                      <td>
                        <v-text-field
                          v-model.number="uptakeSecretionItem.uncertainty"
                          suffix="mmol/g/h"
                          type="number"
                          step="any"
                        ></v-text-field>
                      </td>
                    </template>
                  </v-data-table>
                </div>

                <!-- Molar Yields table -->
                <div v-show="selectedTableKey === 'molarYields'">
                  <v-data-table
                    :headers="selectedTable.headers"
                    :items="tables.molarYields.items"
                    :pagination.sync="pagination"
                    disable-initial-sort
                  >
                    <template
                      v-slot:items="{ item: molarYieldsItem, index: index }"
                    >
                      <td>
                        <v-select
                          return-object
                          :items="tables.samples.items.filter(s => s.name)"
                          item-text="name"
                          item-value="temporaryId"
                          v-model="molarYieldsItem.sample"
                          no-data-text="No data available. You can add it in Samples table."
                        >
                        </v-select>
                      </td>
                      <td>
                        <AutocompleteMnxMetabolite
                          hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known metabolites."
                          @change="
                            molarYieldsItem.product = {
                              name: $event.name,
                              id: $event.mnx_id
                            }
                          "
                        ></AutocompleteMnxMetabolite>
                      </td>
                      <td>
                        <AutocompleteMnxMetabolite
                          hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known metabolites."
                          @change="
                            molarYieldsItem.substrate = {
                              name: $event.name,
                              id: $event.mnx_id
                            }
                          "
                        ></AutocompleteMnxMetabolite>
                      </td>
                      <td>
                        <v-text-field
                          v-model.number="molarYieldsItem.measurement"
                          suffix="mmol-num/mmol-den"
                          type="number"
                          step="any"
                        ></v-text-field>
                      </td>
                      <td>
                        <v-text-field
                          v-model.number="molarYieldsItem.uncertainty"
                          suffix="mmol-num/mmol-den"
                          type="number"
                          step="any"
                        ></v-text-field>
                      </td>
                    </template>
                  </v-data-table>
                </div>

                <!-- Growth table -->
                <div v-show="selectedTableKey === 'growth'">
                  <v-data-table
                    :headers="selectedTable.headers"
                    :items="tables.growth.items"
                    :pagination.sync="pagination"
                    disable-initial-sort
                  >
                    <template v-slot:items="{ item: growthItem, index: index }">
                      <td>
                        <v-select
                          return-object
                          :items="tables.samples.items.filter(s => s.name)"
                          item-text="name"
                          item-value="temporaryId"
                          v-model="growthItem.sample"
                          no-data-text="No data available. You can add it in Samples table."
                        >
                        </v-select>
                      </td>
                      <td>
                        <v-text-field
                          v-model.number="growthItem.measurement"
                          suffix="mmol/g/h"
                          type="number"
                          step="any"
                          :rules="[
                            requiredIfHasMain(
                              growthItem.measurement,
                              growthItem
                            )
                          ]"
                        ></v-text-field>
                      </td>
                      <td>
                        <v-text-field
                          v-model.number="growthItem.uncertainty"
                          suffix="mmol/g/h"
                          type="number"
                          step="any"
                        ></v-text-field>
                      </td>
                    </template>
                  </v-data-table>
                </div>
              </v-card>
            </v-flex>

            <v-divider vertical></v-divider>

            <!-- Selection area -->
            <v-flex md2>
              <v-card class="pa-4" elevation="0">
                <v-text-field
                  v-model="experiment.name"
                  label="Experiment name"
                ></v-text-field>
                <v-textarea
                  v-model="experiment.description"
                  label="Description"
                  auto-grow
                  rows="1"
                ></v-textarea>
                <v-autocomplete-extended
                  item-text="name"
                  item-value="id"
                  v-model="experiment.project_id"
                  :items="availableProjects"
                  name="project"
                  label="Project"
                  type="text"
                  ref="projectAutocomplete"
                >
                  <template v-slot:prepend-item>
                    <v-list-tile
                      ripple
                      @click="
                        isProjectCreationDialogVisible = true;
                        $refs.projectAutocomplete.isMenuActive = false;
                      "
                    >
                      <v-icon class="mr-3" color="primary">add_circle</v-icon>
                      <v-list-tile-title>
                        New project
                      </v-list-tile-title>
                    </v-list-tile>
                    <v-divider class="my-2"></v-divider>
                  </template>
                </v-autocomplete-extended>
                <v-radio-group v-model="selectedTableKey">
                  <v-radio
                    v-for="(table, key) in tables"
                    :key="key"
                    :label="table.name"
                    :value="key"
                    color="primary"
                  ></v-radio>
                </v-radio-group>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="secondary"
                    flat
                    @click="isDialogVisible = false"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    color="primary"
                    @click="createExperiment()"
                    :disabled="isLoading"
                  >
                    <span v-if="!isLoading">Submit</span>
                    <v-progress-circular
                      v-if="isLoading"
                      indeterminate
                      color="primary"
                    ></v-progress-circular>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-flex>
          </v-layout>
        </v-card>
      </v-dialog>
    </v-form>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import uuidv4 from "uuid/v4";
import { tsvParseRows } from "d3-dsv";
import * as settings from "@/utils/settings";

export default Vue.extend({
  name: "NewExperiment",
  props: {
    value: {
      type: Boolean,
      required: true
    }
  },
  data: () => ({
    experiment: {
      name: null,
      description: null,
      project_id: null
    },
    isNewStrainDialogVisible: false,
    isNewMediumDialogVisible: false,
    isProjectCreationDialogVisible: false,
    isLoading: false,
    currentRowIndex: null,
    conditionTempIdsMap: {},
    sampleTempIdsMap: {},
    selectedTableKey: "conditions",
    tables: {
      conditions: {
        name: "Conditions",
        /**
         * Until mainField is defined, the row should be ignored when submitting
         * and validating.
         */
        mainField: "name",
        headers: [
          { text: "Name", value: "name", width: "30%" },
          { text: "Strain", value: "strain", width: "35%" },
          { text: "Medium", value: "medium", width: "35%" }
        ],
        items: [{ temporaryId: uuidv4() }]
      },
      samples: {
        name: "Samples",
        mainField: "name",
        headers: [
          { text: "Condition", value: "condition", width: "25%" },
          { text: "Name", value: "name", width: "25%" },
          { text: "Start time", value: "startTime", width: "25%" },
          { text: "End time", value: "endTime", width: "25%" }
        ],
        items: [{ temporaryId: uuidv4() }]
      },
      fluxomics: {
        name: "Fluxomics",
        mainField: "sample",
        headers: [
          { text: "Sample", value: "sample", width: "25%" },
          { text: "Reaction", value: "reaction", width: "25%" },
          { text: "Measurement", value: "measurement", width: "25%" },
          { text: "Uncertainty", value: "uncertainty", width: "25%" }
        ],
        parsePasted: {
          sample: (str, { tables }) => {
            const index = parseInt(str, 10);
            const isExactMatch = index.toString() === str;
            // If an integer (without unit postfix) is pasted, use it to try to
            // get sample by index.
            if (isExactMatch && tables.samples.items[index]) {
              return tables.samples.items[index];
            }
            return null;
          },
          // Temporarily create mock reaction object and use forceSearchQuery;
          // selecting a reaction then clears forceSearchQuery.
          reaction: str => ({ _pastedText: str }),
          measurement: str => parseFloat(str),
          uncertainty: str => parseFloat(str)
        },
        items: [{ temporaryId: uuidv4() }]
        /*
in excel:
sample	reaction	measurement	uncertainity
0	MNXR94672	5
1	CO transporter via diffusion	4	1mmol/g/h
5		0.1	0.5 mmol/g/h
  MNXR96863	0.1	2
*/
      },
      metabolomics: {
        name: "Metabolomics",
        mainField: "sample",
        headers: [
          { text: "Sample", value: "sample", width: "25%" },
          { text: "Compound", value: "compound", width: "25%" },
          { text: "Measurement", value: "measurement", width: "25%" },
          { text: "Uncertainty", value: "uncertainty", width: "25%" }
        ],
        items: [{ temporaryId: uuidv4() }]
      },
      uptakeSecretion: {
        name: "Uptake/Secretion rates",
        mainField: "sample",
        headers: [
          { text: "Sample", value: "sample", width: "25%" },
          { text: "Compound", value: "compound", width: "25%" },
          { text: "Measurement", value: "measurement", width: "25%" },
          { text: "Uncertainty", value: "uncertainty", width: "25%" }
        ],
        items: [{ temporaryId: uuidv4() }]
      },
      molarYields: {
        name: "Molar Yields",
        mainField: "sample",
        headers: [
          { text: "Sample", value: "sample", width: "20%" },
          {
            text: "Product",
            value: "product",
            width: "20%"
          },
          {
            text: "Substrate",
            value: "substrate",
            width: "20%"
          },
          { text: "Measurement", value: "measurement", width: "20%" },
          { text: "Uncertainty", value: "uncertainty", width: "20%" }
        ],
        items: [{ temporaryId: uuidv4() }]
      },
      growth: {
        name: "Growth",
        mainField: "sample",
        headers: [
          { text: "Sample", value: "sample", width: "30%" },
          { text: "Measurement", value: "measurement", width: "35%" },
          { text: "Uncertainty", value: "uncertainty", width: "35%" }
        ],
        items: [{ temporaryId: uuidv4() }]
      }
    },
    pagination: {
      rowsPerPage: 10
    }
  }),
  computed: {
    availableStrains() {
      return this.$store.state.strains.strains;
    },
    availableMedia() {
      return this.$store.state.media.media;
    },
    availableProjects() {
      return this.$store.state.projects.projects;
    },
    isDialogVisible: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("input", value);
      }
    },
    selectedTable() {
      return this.tables[this.selectedTableKey];
    }
  },
  mounted() {
    setTimeout(() => {
      // Show validation messages before user activates each input.
      this.$refs.newExperimentForm.validate();
    }, 0);
  },
  methods: {
    addRow() {
      this.selectedTable.items.push({
        temporaryId: uuidv4()
      });
    },
    passStrain(strain) {
      this.selectedTable.items[this.currentRowIndex].strain = strain;
    },
    passMedium(medium) {
      this.selectedTable.items[this.currentRowIndex].medium = medium;
    },
    passProject(project) {
      this.experiment.project_id = project.id;
    },
    requiredIfHasMain(value, row) {
      const mainField = this.selectedTable.mainField;
      if (row[mainField]) {
        if (!value && value !== 0) {
          return "Required.";
        }
        if (value && value._pastedText) {
          return "Required.";
        }
      }
      return true;
    },
    paste(columnOffset, rowOffset, table, $event) {
      const text = $event.clipboardData.getData("text/plain");
      const rows = tsvParseRows(text);
      const isSingleValue = rows.length === 1 && rows[0].length === 1;
      if (!text || isSingleValue) {
        return;
      }

      // Tabular data pasted.
      $event.preventDefault();

      // rows = [["a", "5", ""]]
      const parsedRows = rows.map(row => {
        return row
          .filter((cell, columnIx) => {
            // Ignore excess columns.
            return !!table.headers[columnOffset + columnIx];
          })
          .map((cell, columnIx) => {
            const property = table.headers[columnOffset + columnIx].value;
            let value;
            if (cell) {
              // Parse cell.
              value = table.parsePasted[property](cell, {
                // Extra parameters for parsePasted:
                tables: this.tables
              });
            } else {
              // Empty cell clears existing value.
              value = null;
            }

            return [property, value];
          });
      });

      // parsedRows = [[["name", "a"], ["measurement", 5], ["uncertainty", null]]]
      parsedRows.forEach((rowPairs, rowIx) => {
        if (!table.items[rowOffset + rowIx]) {
          // Create excess rows.
          table.items.push({ temporaryId: uuidv4() });
        }

        rowPairs.forEach(([property, value]) => {
          Vue.set(table.items[rowOffset + rowIx], property, value);
        });
      });
    },
    createExperiment() {
      this.conditionTempIdsMap = {};
      this.sampleTempIdsMap = {};
      this.isLoading = true;
      axios
        .post(`${settings.apis.warehouse}/experiments`, this.experiment)
        .then((response: AxiosResponse) => {
          return Promise.all(this.postConditions(response.data.id));
        })
        .then(() => {
          return Promise.all(this.postSamples());
        })
        .then(() => {
          return Promise.all(this.postFluxomics());
        })
        .then(() => {
          return Promise.all(this.postMetabolomics());
        })
        .then(() => {
          return Promise.all(this.postUptakeSecretionRates());
        })
        .then(() => {
          return Promise.all(this.postMolarYields());
        })
        .then(() => {
          return Promise.all(this.postGrowthRates());
        })
        .catch(error => {
          this.$store.commit("setPostError", error);
        })
        .then(() => (this.isLoading = false));
    },
    postConditions(experimentId) {
      return this.tables.conditions.items
        .filter(condition => condition.name)
        .map(condition => {
          const payload = {
            name: condition.name,
            experiment_id: experimentId,
            strain_id: condition.strain.id,
            medium_id: condition.medium.id
          };
          return axios
            .post(`${settings.apis.warehouse}/conditions`, payload)
            .then(
              (response: AxiosResponse) =>
                (this.conditionTempIdsMap[condition.temporaryId] =
                  response.data.id)
            );
        });
    },
    postSamples() {
      return this.tables.samples.items
        .filter(sample => sample.name)
        .map(sample => {
          const conditionId = this.conditionTempIdsMap[
            sample.condition.temporaryId
          ];

          const date = this.$moment("01/01/2019 15:35", "DD/MM/YYYY HH:mm");
          const payload = {
            condition_id: conditionId,
            start_time: this.$moment(
              sample.startTime,
              "DD/MM/YYYY HH:mm"
            ).toDate(),
            end_time: sample.endTime
              ? this.$moment(sample.endTime, "DD/MM/YYYY HH:mm").toDate()
              : null
          };
          return axios
            .post(`${settings.apis.warehouse}/samples`, payload)
            .then((response: AxiosResponse) => {
              this.sampleTempIdsMap[sample.temporaryId] = response.data.id;
            });
        });
    },
    postFluxomics() {
      return this.tables.fluxomics.items
        .filter(fluxomicsItem => fluxomicsItem.sample)
        .map(fluxomicsItem => {
          const payload = {
            sample_id: this.sampleTempIdsMap[fluxomicsItem.sample.temporaryId],
            reaction_name: fluxomicsItem.reaction.name,
            reaction_identifier: fluxomicsItem.reaction.id,
            reaction_namespace: "metanetx.chemical",
            measurement: fluxomicsItem.measurement,
            uncertainty: fluxomicsItem.uncertainty
          };
          return axios.post(`${settings.apis.warehouse}/fluxomics`, payload);
        });
    },
    postMetabolomics() {
      return this.tables.metabolomics.items
        .filter(metabolomicsItem => metabolomicsItem.sample)
        .map(metabolomicsItem => {
          const payload = {
            sample_id: this.sampleTempIdsMap[
              metabolomicsItem.sample.temporaryId
            ],
            compound_name: metabolomicsItem.compound.name,
            compound_identifier: metabolomicsItem.compound.id,
            compound_namespace: "metanetx.chemical",
            measurement: metabolomicsItem.measurement,
            uncertainty: metabolomicsItem.uncertainty
          };
          return axios.post(`${settings.apis.warehouse}/metabolomics`, payload);
        });
    },
    postUptakeSecretionRates() {
      return this.tables.uptakeSecretion.items
        .filter(uptakeSecretionItem => uptakeSecretionItem.sample)
        .map(uptakeSecretionItem => {
          const payload = {
            sample_id: this.sampleTempIdsMap[
              uptakeSecretionItem.sample.temporaryId
            ],
            compound_name: uptakeSecretionItem.compound.name,
            compound_identifier: uptakeSecretionItem.compound.id,
            compound_namespace: "metanetx.chemical",
            measurement: uptakeSecretionItem.measurement,
            uncertainty: uptakeSecretionItem.uncertainty
          };
          return axios.post(
            `${settings.apis.warehouse}/uptake-secretion-rates`,
            payload
          );
        });
    },
    postMolarYields() {
      return this.tables.molarYields.items
        .filter(molarYieldsItem => molarYieldsItem.sample)
        .map(molarYieldsItem => {
          const payload = {
            sample_id: this.sampleTempIdsMap[
              molarYieldsItem.sample.temporaryId
            ],
            product_name: molarYieldsItem.product.name,
            product_identifier: molarYieldsItem.product.id,
            product_namespace: "metanetx.chemical",
            substrate_name: molarYieldsItem.substrate.name,
            substrate_identifier: molarYieldsItem.substrate.id,
            substrate_namespace: "metanetx.chemical",
            measurement: molarYieldsItem.measurement,
            uncertainty: molarYieldsItem.uncertainty
          };
          return axios.post(`${settings.apis.warehouse}/molar-yields`, payload);
        });
    },
    postGrowthRates() {
      return this.tables.growth.items
        .filter(growthItem => growthItem.sample)
        .map(growthItem => {
          const payload = {
            sample_id: this.sampleTempIdsMap[growthItem.sample.temporaryId],
            measurement: growthItem.measurement,
            uncertainty: growthItem.uncertainty
          };
          return axios.post(`${settings.apis.warehouse}/growth-rates`, payload);
        });
    }
  }
});
</script>

<style>
.full-height-dialog {
  height: 90%;
}
</style>
