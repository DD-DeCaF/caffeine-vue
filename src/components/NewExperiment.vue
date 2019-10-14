<template>
  <div>
    <NewStrain v-model="isNewStrainDialogVisible" @return-object="passStrain" />
    <NewMedium
      v-model="isNewMediumDialogVisible"
      @return-object="passMedium"
      :modelIds="selectedMediumRelevantModelIds"
    />
    <NewProject
      v-model="isProjectCreationDialogVisible"
      @return-object="passProject"
    />
    <v-form ref="newExperimentForm">
      <v-dialog
        v-model="isDialogVisible"
        full-width
        content-class="full-height-dialog"
        scrollable
      >
        <v-layout>
          <v-flex md10>
            <v-card class="pa-4 scroll" height="100%" elevation="0">
              <div class="display-1 mb-2">{{ selectedTable.name }}</div>
              <!-- Conditions table -->
              <div v-show="selectedTableKey === 'conditions'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.conditions.items"
                  :pagination.sync="pagination"
                  hide-actions
                  disable-initial-sort
                  item-key="temporaryId"
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
                        @change="updateRelevantModels(condition)"
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
                              getRelevantModelIdsForNewMedium(condition);
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
                    <td>
                      <v-btn
                        icon
                        @click="deleteCondition(condition.temporaryId)"
                      >
                        <v-icon color="primary">delete</v-icon>
                      </v-btn>
                    </td>
                  </template>
                </v-data-table>
                <v-btn
                  color="primary"
                  small
                  @click="addRow('conditions')"
                  class="mt-3"
                  >Add row</v-btn
                >
              </div>

              <!-- Samples table -->
              <div v-show="selectedTableKey === 'samples'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.samples.items"
                  :pagination.sync="pagination"
                  hide-actions
                  disable-initial-sort
                  item-key="temporaryId"
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
                        :rules="[requiredIfHasMain(sample.condition, sample)]"
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
                        hint="dd/mm/yyyy hh:mm"
                        :rules="[requiredIfHasMain(sample.startTime, sample)]"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-text-field
                        v-model="sample.endTime"
                        mask="date-with-time"
                        return-masked-value
                        placeholder="dd/mm/yyyy hh:mm"
                        hint="dd/mm/yyyy hh:mm"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-btn
                        icon
                        @click="deleteSample(sample.temporaryId, true)"
                      >
                        <v-icon color="primary">delete</v-icon>
                      </v-btn>
                    </td>
                  </template>
                </v-data-table>
                <v-btn
                  color="primary"
                  small
                  @click="addRow('samples')"
                  class="mt-3"
                  >Add row</v-btn
                >
              </div>

              <!-- Fluxomics table -->
              <div v-show="selectedTableKey === 'fluxomics'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.fluxomics.items"
                  :pagination.sync="pagination"
                  hide-actions
                  disable-initial-sort
                  item-key="temporaryId"
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
                        @change="getRelevantModelIds(fluxomicsItem)"
                      >
                      </v-select>
                    </td>
                    <td>
                      <AutocompleteMnxReaction
                        hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known reactions."
                        @change="
                          onChange(fluxomicsItem, 'reaction', $event.reaction)
                        "
                        :modelIds="fluxomicsItem.modelIds"
                        :rules="[
                          requiredIfHasMain(
                            fluxomicsItem.reaction,
                            fluxomicsItem
                          )
                        ]"
                        @paste="paste(1, index, selectedTable, $event)"
                        :forceSearchQuery="
                          fluxomicsItem.reaction &&
                            fluxomicsItem.reaction._pastedText
                        "
                      ></AutocompleteMnxReaction>
                    </td>
                    <td>
                      <v-text-field
                        v-model="fluxomicsItem.measurement"
                        hint="mmol gDW <sup>-1</sup> h <sup>-1</sup>"
                        persistent-hint
                        type="number"
                        step="any"
                        :rules="[
                          requiredIfHasMain(
                            fluxomicsItem.measurement,
                            fluxomicsItem
                          )
                        ]"
                        @paste="paste(2, index, selectedTable, $event)"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-text-field
                        v-model="fluxomicsItem.uncertainty"
                        hint="mmol gDW <sup>-1</sup> h <sup>-1</sup>"
                        persistent-hint
                        type="number"
                        step="any"
                        @paste="paste(3, index, selectedTable, $event)"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-btn
                        icon
                        @click="
                          deleteMeasurement(
                            'fluxomics',
                            fluxomicsItem.temporaryId
                          )
                        "
                      >
                        <v-icon color="primary">delete</v-icon>
                      </v-btn>
                    </td>
                  </template>
                </v-data-table>
                <v-btn
                  color="primary"
                  small
                  @click="addRow('fluxomics')"
                  class="mt-3"
                  >Add row</v-btn
                >
              </div>

              <!-- Metabolomics table -->
              <div v-show="selectedTableKey === 'metabolomics'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.metabolomics.items"
                  :pagination.sync="pagination"
                  hide-actions
                  disable-initial-sort
                  item-key="temporaryId"
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
                        @change="getRelevantModelIds(metabolomicsItem)"
                      >
                      </v-select>
                    </td>
                    <td>
                      <AutocompleteMnxMetabolite
                        hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known metabolites."
                        @change="onChange(metabolomicsItem, 'compound', $event)"
                        @paste="paste(1, index, selectedTable, $event)"
                        :forceSearchQuery="
                          metabolomicsItem.compound &&
                            metabolomicsItem.compound._pastedText
                        "
                        :modelIds="metabolomicsItem.modelIds"
                        :rules="[
                          requiredIfHasMain(
                            metabolomicsItem.compound,
                            metabolomicsItem
                          )
                        ]"
                      ></AutocompleteMnxMetabolite>
                    </td>
                    <td>
                      <v-text-field
                        v-model="metabolomicsItem.measurement"
                        hint="mmol l <sup>-1</sup>"
                        persistent-hint
                        type="number"
                        step="any"
                        @paste="paste(2, index, selectedTable, $event)"
                        :rules="[
                          requiredIfHasMain(
                            metabolomicsItem.measurement,
                            metabolomicsItem
                          )
                        ]"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-text-field
                        v-model="metabolomicsItem.uncertainty"
                        hint="mmol l <sup>-1</sup>"
                        persistent-hint
                        type="number"
                        step="any"
                        @paste="paste(3, index, selectedTable, $event)"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-btn
                        icon
                        @click="
                          deleteMeasurement(
                            'metabolomics',
                            metabolomicsItem.temporaryId
                          )
                        "
                      >
                        <v-icon color="primary">delete</v-icon>
                      </v-btn>
                    </td>
                  </template>
                </v-data-table>
                <v-btn
                  color="primary"
                  small
                  @click="addRow('metabolomics')"
                  class="mt-3"
                  >Add row</v-btn
                >
              </div>

              <!-- Uptake/Secretion rates table -->
              <div v-show="selectedTableKey === 'uptakeSecretion'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.uptakeSecretion.items"
                  :pagination.sync="pagination"
                  hide-actions
                  disable-initial-sort
                  item-key="temporaryId"
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
                        @change="getRelevantModelIds(uptakeSecretionItem)"
                      >
                      </v-select>
                    </td>
                    <td>
                      <AutocompleteMnxMetabolite
                        hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known metabolites."
                        @change="
                          onChange(uptakeSecretionItem, 'compound', $event)
                        "
                        @paste="paste(1, index, selectedTable, $event)"
                        :forceSearchQuery="
                          uptakeSecretionItem.compound &&
                            uptakeSecretionItem.compound._pastedText
                        "
                        :modelIds="uptakeSecretionItem.modelIds"
                        :rules="[
                          requiredIfHasMain(
                            uptakeSecretionItem.compound,
                            uptakeSecretionItem
                          )
                        ]"
                      ></AutocompleteMnxMetabolite>
                    </td>
                    <td>
                      <v-text-field
                        v-model="uptakeSecretionItem.measurement"
                        hint="mmol gDW <sup>-1</sup> h <sup>-1</sup>"
                        persistent-hint
                        type="number"
                        step="any"
                        @paste="paste(2, index, selectedTable, $event)"
                        :rules="[
                          requiredIfHasMain(
                            uptakeSecretionItem.measurement,
                            uptakeSecretionItem
                          )
                        ]"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-text-field
                        v-model="uptakeSecretionItem.uncertainty"
                        hint="mmol gDW <sup>-1</sup> h <sup>-1</sup>"
                        persistent-hint
                        type="number"
                        step="any"
                        @paste="paste(3, index, selectedTable, $event)"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-btn
                        icon
                        @click="
                          deleteMeasurement(
                            'uptakeSecretion',
                            uptakeSecretionItem.temporaryId
                          )
                        "
                      >
                        <v-icon color="primary">delete</v-icon>
                      </v-btn>
                    </td>
                  </template>
                </v-data-table>
                <v-btn
                  color="primary"
                  small
                  @click="addRow('uptakeSecretion')"
                  class="mt-3"
                  >Add row</v-btn
                >
              </div>

              <!-- Molar Yields table -->
              <div v-show="selectedTableKey === 'molarYields'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.molarYields.items"
                  :pagination.sync="pagination"
                  hide-actions
                  disable-initial-sort
                  item-key="temporaryId"
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
                        @change="getRelevantModelIds(molarYieldsItem)"
                      >
                      </v-select>
                    </td>
                    <td>
                      <AutocompleteMnxMetabolite
                        hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known metabolites."
                        @change="onChange(molarYieldsItem, 'product', $event)"
                        @paste="paste(1, index, selectedTable, $event)"
                        :forceSearchQuery="
                          molarYieldsItem.product &&
                            molarYieldsItem.product._pastedText
                        "
                        :modelIds="molarYieldsItem.modelIds"
                        :rules="[
                          requiredIfHasMain(
                            molarYieldsItem.product,
                            molarYieldsItem
                          )
                        ]"
                      ></AutocompleteMnxMetabolite>
                    </td>
                    <td>
                      <AutocompleteMnxMetabolite
                        hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known metabolites."
                        @change="onChange(molarYieldsItem, 'substrate', $event)"
                        @paste="paste(2, index, selectedTable, $event)"
                        :forceSearchQuery="
                          molarYieldsItem.substrate &&
                            molarYieldsItem.substrate._pastedText
                        "
                        :modelIds="molarYieldsItem.modelIds"
                        :rules="[
                          requiredIfHasMain(
                            molarYieldsItem.substrate,
                            molarYieldsItem
                          )
                        ]"
                      ></AutocompleteMnxMetabolite>
                    </td>
                    <td>
                      <v-text-field
                        v-model="molarYieldsItem.measurement"
                        hint="mmol-product / mmol-substrate"
                        persistent-hint
                        type="number"
                        step="any"
                        @paste="paste(3, index, selectedTable, $event)"
                        :rules="[
                          requiredIfHasMain(
                            molarYieldsItem.measurement,
                            molarYieldsItem
                          )
                        ]"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-text-field
                        v-model="molarYieldsItem.uncertainty"
                        hint="mmol-product / mmol-substrate"
                        persistent-hint
                        type="number"
                        step="any"
                        @paste="paste(4, index, selectedTable, $event)"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-btn
                        icon
                        @click="
                          deleteMeasurement(
                            'molarYields',
                            molarYieldsItem.temporaryId
                          )
                        "
                      >
                        <v-icon color="primary">delete</v-icon>
                      </v-btn>
                    </td>
                  </template>
                </v-data-table>
                <v-btn
                  color="primary"
                  small
                  @click="addRow('molarYields')"
                  class="mt-3"
                  >Add row</v-btn
                >
              </div>

              <!-- Growth table -->
              <div v-show="selectedTableKey === 'growth'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.growth.items"
                  :pagination.sync="pagination"
                  hide-actions
                  disable-initial-sort
                  item-key="temporaryId"
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
                        v-model="growthItem.measurement"
                        hint="mmol gDW <sup>-1</sup> h <sup>-1</sup>"
                        persistent-hint
                        type="number"
                        step="any"
                        :rules="[
                          requiredIfHasMain(growthItem.measurement, growthItem)
                        ]"
                        @paste="paste(1, index, selectedTable, $event)"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-text-field
                        v-model="growthItem.uncertainty"
                        hint="mmol gDW <sup>-1</sup> h <sup>-1</sup>"
                        persistent-hint
                        type="number"
                        step="any"
                        @paste="paste(2, index, selectedTable, $event)"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-btn
                        icon
                        @click="
                          deleteMeasurement('growth', growthItem.temporaryId)
                        "
                      >
                        <v-icon color="primary">delete</v-icon>
                      </v-btn>
                    </td>
                  </template>
                </v-data-table>
                <v-btn
                  color="primary"
                  small
                  @click="addRow('growth')"
                  class="mt-3"
                  >Add row</v-btn
                >
              </div>
            </v-card>
          </v-flex>

          <v-divider vertical></v-divider>

          <!-- Selection area -->
          <v-flex md2>
            <v-card class="pa-4" height="100%" elevation="0">
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
                <v-btn color="secondary" flat @click="clear()">
                  Clear
                </v-btn>
                <v-btn
                  color="primary"
                  @click="createExperiment()"
                  :loading="isSubmitting"
                  >Submit
                </v-btn>
              </v-card-actions>
              <div class="my-5" v-if="isSubmitting">
                <em>Submitting...</em>
                <v-progress-linear
                  v-model="submitProgressValue"
                  class="my-2"
                ></v-progress-linear>
              </div>
            </v-card>
          </v-flex>
        </v-layout>
      </v-dialog>
      <v-snackbar
        color="success"
        v-model="isExperimentCreationSuccess"
        :timeout="5000"
      >
        {{ experiment.name }} successfully created.
      </v-snackbar>
    </v-form>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import uuidv4 from "uuid/v4";
import { tsvParseRows } from "d3-dsv";
import { flatten } from "lodash";
import * as settings from "@/utils/settings";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

function getInitialState() {
  return {
    experiment: {
      name: null,
      description: null,
      project_id: null,
      id: null
    },
    isNewStrainDialogVisible: false,
    isNewMediumDialogVisible: false,
    isProjectCreationDialogVisible: false,
    isSubmitting: false,
    isExperimentCreationSuccess: false,
    currentRowIndex: null,
    submitProgressValue: 0,
    conditionTempIdsMap: {},
    sampleTempIdsMap: {},
    selectedMediumRelevantModelIds: [],
    // Display all rows on a single page
    // We are relying on data table's `index` (for currentRowIndex and @paste)
    // but that only works correctly on the first page
    pagination: {
      rowsPerPage: -1
    },
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
          { text: "Name", value: "name", width: "35%" },
          { text: "Strain", value: "strain", width: "30%" },
          { text: "Medium", value: "medium", width: "30%" },
          { value: "actions", width: "5%" }
        ],
        items: [{ temporaryId: uuidv4() }]
      },
      samples: {
        name: "Samples",
        mainField: "name",
        headers: [
          { text: "Condition", value: "condition", width: "30%" },
          { text: "Name", value: "name", width: "25%" },
          { text: "Start time", value: "startTime", width: "20%" },
          { text: "End time", value: "endTime", width: "20%" },
          { value: "actions", width: "5%" }
        ],
        items: [{ temporaryId: uuidv4() }]
      },
      fluxomics: {
        name: "Fluxomics",
        mainField: "sample",
        headers: [
          { text: "Sample", value: "sample", width: "25%" },
          { text: "Reaction", value: "reaction", width: "30%" },
          { text: "Measurement", value: "measurement", width: "20%" },
          { text: "Uncertainty", value: "uncertainty", width: "20%" },
          { value: "actions", width: "5%" }
        ],
        parsePasted: {
          // Temporarily create mock reaction object and use forceSearchQuery;
          // selecting a reaction then clears forceSearchQuery.
          reaction: str => ({ _pastedText: str }),
          measurement: str => parseFloat(str),
          uncertainty: str => parseFloat(str)
        },
        items: [{ temporaryId: uuidv4() }]
      },
      metabolomics: {
        name: "Metabolomics",
        mainField: "sample",
        headers: [
          { text: "Sample", value: "sample", width: "25%" },
          { text: "Compound", value: "compound", width: "30%" },
          { text: "Measurement", value: "measurement", width: "20%" },
          { text: "Uncertainty", value: "uncertainty", width: "20%" },
          { value: "actions", width: "5%" }
        ],
        parsePasted: {
          compound: str => ({ _pastedText: str }),
          measurement: str => parseFloat(str),
          uncertainty: str => parseFloat(str)
        },
        items: [{ temporaryId: uuidv4() }]
      },
      uptakeSecretion: {
        name: "Uptake/Secretion rates",
        mainField: "sample",
        headers: [
          { text: "Sample", value: "sample", width: "25%" },
          { text: "Compound", value: "compound", width: "30%" },
          { text: "Measurement", value: "measurement", width: "20%" },
          { text: "Uncertainty", value: "uncertainty", width: "20%" },
          { value: "actions", width: "5%" }
        ],
        parsePasted: {
          compound: str => ({ _pastedText: str }),
          measurement: str => parseFloat(str),
          uncertainty: str => parseFloat(str)
        },
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
            width: "25%"
          },
          {
            text: "Substrate",
            value: "substrate",
            width: "25%"
          },
          { text: "Measurement", value: "measurement", width: "12.5%" },
          { text: "Uncertainty", value: "uncertainty", width: "12.5%" },
          { value: "actions", width: "5%" }
        ],
        parsePasted: {
          product: str => ({ _pastedText: str }),
          substrate: str => ({ _pastedText: str }),
          measurement: str => parseFloat(str),
          uncertainty: str => parseFloat(str)
        },
        items: [{ temporaryId: uuidv4() }]
      },
      growth: {
        name: "Growth",
        mainField: "sample",
        headers: [
          { text: "Sample", value: "sample", width: "30%" },
          { text: "Measurement", value: "measurement", width: "30%" },
          { text: "Uncertainty", value: "uncertainty", width: "30%" },
          { value: "actions", width: "10%" }
        ],
        parsePasted: {
          measurement: str => parseFloat(str),
          uncertainty: str => parseFloat(str)
        },
        items: [{ temporaryId: uuidv4() }]
      }
    }
  };
}

export default Vue.extend({
  name: "NewExperiment",
  props: {
    value: {
      type: Boolean,
      required: true
    }
  },
  data: () => getInitialState(),
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
    models() {
      return this.$store.getters["models/getModels"];
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
    },
    // Needed to provide a real progress status while submitting data
    itemsToPostAmount() {
      let result = 1; // counting experiment that should be posted
      [
        "conditions",
        "samples",
        "fluxomics",
        "metabolomics",
        "uptakeSecretion",
        "molarYields",
        "growth"
      ].forEach(tableKey => {
        const mainField = this.tables[tableKey].mainField;
        result += this.tables[tableKey].items.filter(item => item[mainField])
          .length;
      });
      return result;
    },
    itemWeight() {
      return Math.round(100 / this.itemsToPostAmount);
    }
  },
  mounted() {
    setTimeout(() => {
      // Show validation messages before user activates each input.
      this.$refs.newExperimentForm.validate();
    }, 0);
  },
  methods: {
    addRow(tableKey) {
      this.tables[tableKey].items.push({
        temporaryId: uuidv4()
      });
      setTimeout(() => {
        this.$refs.newExperimentForm.validate();
      }, 0);
    },
    deleteCondition(conditionId) {
      const relatedSamples = this.tables.samples.items.filter(
        sample =>
          sample.condition && sample.condition.temporaryId === conditionId
      );

      const message =
        "Are you sure you want to delete the condition?" +
        (relatedSamples.length
          ? " All related samples and measurements will be deleted."
          : " This condition is not associated with any related data.");

      const confirmation = this.$promisedDialog(ConfirmDialog, {
        message: message
      });

      confirmation.then(isConfirmed => {
        if (!isConfirmed) {
          return;
        }
        relatedSamples.forEach(sample =>
          this.deleteSample(sample.temporaryId, false)
        );
        this.tables.conditions.items = this.tables.conditions.items.filter(
          condition => condition.temporaryId !== conditionId
        );
        if (this.tables.conditions.items.length === 0) {
          this.addRow("conditions");
        }
      });
    },
    deleteSample(sampleId, isConfirmationRequired) {
      const relatedMeasurements = flatten(
        [
          "fluxomics",
          "metabolomics",
          "uptakeSecretion",
          "molarYields",
          "growth"
        ].map(tableKey =>
          this.tables[tableKey].items
            .filter(item => item.sample && item.sample.temporaryId === sampleId)
            .map(item => ({
              tableKey: tableKey,
              temporaryId: item.temporaryId
            }))
        )
      );

      const message =
        "Are you sure you want to delete the sample?" +
        (relatedMeasurements.length
          ? " All related measurements will be deleted."
          : " This sample is not associated with any related data.");

      const confirmation = !isConfirmationRequired
        ? Promise.resolve(true)
        : this.$promisedDialog(ConfirmDialog, {
            message: message
          });

      confirmation.then(isConfirmed => {
        if (!isConfirmed) {
          return;
        }
        relatedMeasurements.forEach(item =>
          this.deleteMeasurement(item.tableKey, item.temporaryId)
        );
        this.tables.samples.items = this.tables.samples.items.filter(
          sample => sample.temporaryId !== sampleId
        );
        if (this.tables.samples.items.length === 0) {
          this.addRow("samples");
        }
      });
    },
    deleteMeasurement(tableKey, itemId) {
      this.tables[tableKey].items = this.tables[tableKey].items.filter(
        item => item.temporaryId !== itemId
      );
      if (this.tables[tableKey].items.length === 0) {
        this.addRow(tableKey);
      }
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
    updateRelevantModels(condition) {
      const conditionId = condition.temporaryId;
      this.tables.samples.items
        .filter(
          sample =>
            sample.condition && sample.condition.temporaryId === conditionId
        )
        .forEach(sample => {
          const sampleId = sample.temporaryId;
          [
            "fluxomics",
            "metabolomics",
            "uptakeSecretion",
            "molarYields"
          ].forEach(tableKey => {
            this.tables[tableKey].items
              .filter(
                item => item.sample && item.sample.temporaryId === sampleId
              )
              .forEach(item => this.getRelevantModelIds(item));
          });
        });
    },
    getRelevantModelIds(item) {
      // Get ids of the models the selected organism belongs to
      // in order to prioritize reaction and compound results from autocomplete
      const organismId =
        item.sample.condition && item.sample.condition.strain
          ? item.sample.condition.strain.organism_id
          : null;
      item.modelIds = this.models
        .filter(model => model.organism_id === organismId)
        .map(model => model.id);
    },
    getRelevantModelIdsForNewMedium(condition) {
      const organismId = condition.strain ? condition.strain.organism_id : null;
      this.selectedMediumRelevantModelIds = this.models
        .filter(model => model.organism_id === organismId)
        .map(model => model.id);
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
    onChange(item, property, value) {
      Vue.set(item, property, value);
    },
    clear() {
      this.$refs.newExperimentForm.resetValidation();
      Object.assign(this.$data, getInitialState());
    },
    createExperiment() {
      this.conditionTempIdsMap = {};
      this.sampleTempIdsMap = {};
      this.isSubmitting = true;
      axios
        .post(`${settings.apis.warehouse}/experiments`, this.experiment)
        .then((response: AxiosResponse) => {
          this.experiment.id = response.data.id;
          this.updateProgressValue();
          return Promise.all(this.postConditions());
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
        .then(() => {
          this.$store.commit("experiments/addExperiment", this.experiment);
        })
        .catch(error => {
          this.$store.commit("setPostError", error);
        })
        .then(() => {
          this.isSubmitting = false;
          this.isExperimentCreationSuccess = true;
          this.isDialogVisible = false;
          this.clear();
        });
    },
    postConditions() {
      return this.tables.conditions.items
        .filter(condition => condition.name)
        .map(condition => {
          const payload = {
            name: condition.name,
            experiment_id: this.experiment.id,
            strain_id: condition.strain.id,
            medium_id: condition.medium.id
          };
          return axios
            .post(`${settings.apis.warehouse}/conditions`, payload)
            .then((response: AxiosResponse) => {
              this.updateProgressValue();
              this.conditionTempIdsMap[condition.temporaryId] =
                response.data.id;
            });
        });
    },
    postSamples() {
      return this.tables.samples.items
        .filter(sample => sample.name)
        .map(sample => {
          const conditionId = this.conditionTempIdsMap[
            sample.condition.temporaryId
          ];
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
              this.updateProgressValue();
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
            reaction_namespace: fluxomicsItem.reaction.namespace,
            measurement: fluxomicsItem.measurement,
            uncertainty: fluxomicsItem.uncertainty || 0
          };
          return axios
            .post(`${settings.apis.warehouse}/fluxomics`, payload)
            .then(() => this.updateProgressValue());
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
            compound_namespace: metabolomicsItem.compound.namespace,
            measurement: metabolomicsItem.measurement,
            uncertainty: metabolomicsItem.uncertainty || 0
          };
          return axios
            .post(`${settings.apis.warehouse}/metabolomics`, payload)
            .then(() => this.updateProgressValue());
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
            compound_namespace: uptakeSecretionItem.compound.namespace,
            measurement: uptakeSecretionItem.measurement,
            uncertainty: uptakeSecretionItem.uncertainty || 0
          };
          return axios
            .post(`${settings.apis.warehouse}/uptake-secretion-rates`, payload)
            .then(() => this.updateProgressValue());
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
            product_namespace: molarYieldsItem.product.namespace,
            substrate_name: molarYieldsItem.substrate.name,
            substrate_identifier: molarYieldsItem.substrate.id,
            substrate_namespace: molarYieldsItem.substrate.namespace,
            measurement: molarYieldsItem.measurement,
            uncertainty: molarYieldsItem.uncertainty || 0
          };
          return axios
            .post(`${settings.apis.warehouse}/molar-yields`, payload)
            .then(() => this.updateProgressValue());
        });
    },
    postGrowthRates() {
      return this.tables.growth.items
        .filter(growthItem => growthItem.sample)
        .map(growthItem => {
          const payload = {
            sample_id: this.sampleTempIdsMap[growthItem.sample.temporaryId],
            measurement: growthItem.measurement,
            uncertainty: growthItem.uncertainty || 0
          };
          return axios
            .post(`${settings.apis.warehouse}/growth-rates`, payload)
            .then(() => this.updateProgressValue());
        });
    },
    updateProgressValue() {
      this.submitProgressValue += this.itemWeight;
    }
  }
});
</script>

<style>
.full-height-dialog {
  height: 90%;
}
.scroll {
  overflow-y: auto;
}
</style>
