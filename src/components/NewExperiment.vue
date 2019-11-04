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
            <v-form-extended
              v-model="tables.conditions.isValid"
              immediatelyValidated
            >
              <div v-show="selectedTableKey === 'conditions'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.conditions.items"
                  :pagination.sync="tables.conditions.pagination"
                  :rows-per-page-items="[10, 25]"
                  disable-initial-sort
                >
                  <template v-slot:items="{ item: condition, index: relativeIndex }">
                    <Var :absoluteIndex="index + (tables.conditions.pagination.page - 1) * tables.conditions.pagination.rowsPerPage">
                      <tr :key="temporaryId" slot-scope="{ absoluteIndex: absoluteIndex }">
                        <td>
                          <v-text-field
                            v-model="condition.name"
                            @paste="
                              paste(
                                0,
                                absoluteIndex,
                                selectedTable,
                                $event
                              )
                            "
                          ></v-text-field>
                        </td>
                        <td>
                          <v-autocomplete-extended
                            return-object
                            :item-text="strainDisplay"
                            item-value="id"
                            v-model="condition.strain"
                            :items="availableStrains"
                            name="strain"
                            type="text"
                            :placeholder="
                              condition.strain && condition.strain._pastedText
                            "
                            ref="strainAutocomplete"
                            :rules="[
                              requiredIfHasMain(
                                'conditions',
                                condition.strain,
                                condition
                              )
                            ]"
                            @paste="
                              paste(
                                1,
                                absoluteIndex,
                                selectedTable,
                                $event
                              )
                            "
                          >
                            <template v-slot:prepend-item>
                              <v-list-tile
                                ripple
                                @click="
                                  isNewStrainDialogVisible = true;
                                  tables.conditions.rowIndexOnThePage = index;
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
                            :placeholder="
                              condition.medium && condition.medium._pastedText
                            "
                            ref="mediumAutocomplete"
                            :rules="[
                              requiredIfHasMain(
                                'conditions',
                                condition.medium,
                                condition
                              )
                            ]"
                            @paste="
                              paste(
                                2,
                                absoluteIndex,
                                selectedTable,
                                $event
                              )
                            "
                          >
                            <template v-slot:prepend-item>
                              <v-list-tile
                                ripple
                                @click="
                                  getRelevantModelIdsForNewMedium(condition);
                                  isNewMediumDialogVisible = true;
                                  tables.conditions.rowIndexOnThePage = index;
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
                      </tr>
                    </Var>
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
            </v-form-extended>

            <!-- Samples table -->
            <v-form-extended
              v-model="tables.samples.isValid"
              immediatelyValidated
            >
              <div v-show="selectedTableKey === 'samples'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.samples.items"
                  :pagination.sync="tables.samples.pagination"
                  :rows-per-page-items="[10, 25]"
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
                        :rules="[
                          requiredIfHasMain('samples', sample.condition, sample)
                        ]"
                      >
                      </v-select>
                    </td>
                    <!-- Name field was added, so user can distinguish -->
                    <!-- samples in other tables -->
                    <td>
                      <v-text-field
                        v-model="sample.name"
                        @paste="
                          paste(
                            1,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                      ></v-text-field>
                    </td>
                    <td>
                      <v-text-field
                        v-model="sample.startTime"
                        mask="####-##-## ##:##"
                        return-masked-value
                        placeholder="yyyy-mm-dd hh:mm"
                        hint="yyyy-mm-dd hh:mm"
                        :rules="[
                          requiredIfHasMain(
                            'samples',
                            sample.startTime,
                            sample
                          ),
                          singleDateTimeRule
                        ]"
                        @paste="
                          paste(
                            2,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                      ></v-text-field>
                    </td>
                    <td>
                      <v-text-field
                        v-model="sample.endTime"
                        mask="####-##-## ##:##"
                        return-masked-value
                        placeholder="yyyy-mm-dd hh:mm"
                        hint="yyyy-mm-dd hh:mm"
                        :rules="[
                          singleDateTimeRule,
                          dateTimeRules(sample.startTime, sample.endTime)
                        ]"
                        @paste="
                          paste(
                            3,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
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
            </v-form-extended>

            <!-- Fluxomics table -->
            <v-form-extended
              v-model="tables.fluxomics.isValid"
              immediatelyValidated
            >
              <div v-show="selectedTableKey === 'fluxomics'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.fluxomics.items"
                  :pagination.sync="tables.fluxomics.pagination"
                  :rows-per-page-items="[10, 25]"
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
                      >
                      </v-select>
                    </td>
                    <td>
                      <AutocompleteMnxReaction
                        hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known reactions."
                        @change="
                          onChange(fluxomicsItem, 'reaction', $event.reaction)
                        "
                        @paste="
                          paste(
                            1,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                        @clear="
                          onMeasurementClear(
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            'reaction'
                          )
                        "
                        :modelIds="getRelevantModelIds(fluxomicsItem)"
                        :rules="[
                          requiredIfHasMain(
                            'fluxomics',
                            fluxomicsItem.reaction,
                            fluxomicsItem
                          )
                        ]"
                        :forceSearchQuery="
                          fluxomicsItem.reaction &&
                            fluxomicsItem.reaction._pastedText
                        "
                        validate-on-blur
                      ></AutocompleteMnxReaction>
                    </td>
                    <td>
                      <v-number-field
                        v-model.number="fluxomicsItem.measurement"
                        hint="mmol gDW <sup>-1</sup> h <sup>-1</sup>"
                        persistent-hint
                        step="any"
                        :rules="[
                          requiredIfHasMain(
                            'fluxomics',
                            fluxomicsItem.measurement,
                            fluxomicsItem
                          )
                        ]"
                        @paste="
                          paste(
                            2,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                      ></v-number-field>
                    </td>
                    <td>
                      <v-number-field
                        v-model.number="fluxomicsItem.uncertainty"
                        hint="mmol gDW <sup>-1</sup> h <sup>-1</sup>"
                        persistent-hint
                        step="any"
                        @paste="
                          paste(
                            3,
                            inindex +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPagedex,
                            selectedTable,
                            $event
                          )
                        "
                      ></v-number-field>
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
            </v-form-extended>

            <!-- Metabolomics table -->
            <v-form-extended
              v-model="tables.metabolomics.isValid"
              immediatelyValidated
            >
              <div v-show="selectedTableKey === 'metabolomics'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.metabolomics.items"
                  :pagination.sync="tables.metabolomics.pagination"
                  :rows-per-page-items="[10, 25]"
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
                      >
                      </v-select>
                    </td>
                    <td>
                      <AutocompleteMnxMetabolite
                        hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known metabolites."
                        @change="onChange(metabolomicsItem, 'compound', $event)"
                        @paste="
                          paste(
                            1,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                        @clear="
                          onMeasurementClear(
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            'compound'
                          )
                        "
                        :forceSearchQuery="
                          metabolomicsItem.compound &&
                            metabolomicsItem.compound._pastedText
                        "
                        :modelIds="getRelevantModelIds(metabolomicsItem)"
                        :rules="[
                          requiredIfHasMain(
                            'metabolomics',
                            metabolomicsItem.compound,
                            metabolomicsItem
                          )
                        ]"
                        validate-on-blur
                      ></AutocompleteMnxMetabolite>
                    </td>
                    <td>
                      <v-number-field
                        v-model.number="metabolomicsItem.measurement"
                        hint="mmol l <sup>-1</sup>"
                        persistent-hint
                        step="any"
                        @paste="
                          paste(
                            2,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                        :rules="[
                          requiredIfHasMain(
                            'metabolomics',
                            metabolomicsItem.measurement,
                            metabolomicsItem
                          )
                        ]"
                      ></v-number-field>
                    </td>
                    <td>
                      <v-number-field
                        v-model.number="metabolomicsItem.uncertainty"
                        hint="mmol l <sup>-1</sup>"
                        persistent-hint
                        step="any"
                        @paste="
                          paste(
                            3,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                      ></v-number-field>
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
            </v-form-extended>

            <!-- Proteomics table -->
            <v-form-extended
              v-model="tables.proteomics.isValid"
              immediatelyValidated
            >
              <div v-show="selectedTableKey === 'proteomics'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.proteomics.items"
                  :pagination.sync="tables.proteomics.pagination"
                  :rows-per-page-items="[10, 25]"
                  disable-initial-sort
                  item-key="temporaryId"
                >
                  <template
                    v-slot:items="{ item: proteomicsItem, index: index }"
                  >
                    <td>
                      <v-select
                        return-object
                        :items="tables.samples.items.filter(s => s.name)"
                        item-text="name"
                        item-value="temporaryId"
                        v-model="proteomicsItem.sample"
                        no-data-text="No data available. You can add it in Samples table."
                      >
                      </v-select>
                    </td>
                    <td>
                      <UniprotInput
                        @paste="
                          paste(
                            1,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                        @change="onChange(proteomicsItem, 'protein', $event)"
                        @clear="
                          onMeasurementClear(
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            'protein'
                          )
                        "
                        :rules="[
                          requiredIfHasMain(
                            'proteomics',
                            proteomicsItem.protein,
                            proteomicsItem
                          )
                        ]"
                        :forceSearchQuery="
                          proteomicsItem.protein &&
                            proteomicsItem.protein._pastedText
                        "
                      />
                    </td>
                    <td>
                      <v-number-field
                        v-model.number="proteomicsItem.measurement"
                        hint="mmol l <sup>-1</sup>"
                        persistent-hint
                        step="any"
                        @paste="
                          paste(
                            2,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                        :rules="[
                          requiredIfHasMain(
                            'proteomics',
                            proteomicsItem.measurement,
                            proteomicsItem
                          )
                        ]"
                      ></v-number-field>
                    </td>
                    <td>
                      <v-number-field
                        v-model.number="proteomicsItem.uncertainty"
                        hint="mmol l <sup>-1</sup>"
                        persistent-hint
                        step="any"
                        @paste="
                          paste(
                            3,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                      ></v-number-field>
                    </td>
                    <td>
                      <v-btn
                        icon
                        @click="
                          deleteMeasurement(
                            'proteomics',
                            proteomicsItem.temporaryId
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
                  @click="addRow('proteomics')"
                  class="mt-3"
                  >Add row</v-btn
                >
              </div>
            </v-form-extended>

            <!-- Uptake/Secretion rates table -->
            <v-form-extended
              v-model="tables.uptakeSecretion.isValid"
              immediatelyValidated
            >
              <div v-show="selectedTableKey === 'uptakeSecretion'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.uptakeSecretion.items"
                  :pagination.sync="tables.uptakeSecretion.pagination"
                  :rows-per-page-items="[10, 25]"
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
                      >
                      </v-select>
                    </td>
                    <td>
                      <AutocompleteMnxMetabolite
                        hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known metabolites."
                        @change="
                          onChange(uptakeSecretionItem, 'compound', $event)
                        "
                        @paste="
                          paste(
                            1,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                        @clear="
                          onMeasurementClear(
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            'compound'
                          )
                        "
                        :forceSearchQuery="
                          uptakeSecretionItem.compound &&
                            uptakeSecretionItem.compound._pastedText
                        "
                        :modelIds="getRelevantModelIds(uptakeSecretionItem)"
                        :rules="[
                          requiredIfHasMain(
                            'uptakeSecretion',
                            uptakeSecretionItem.compound,
                            uptakeSecretionItem
                          )
                        ]"
                        validate-on-blur
                      ></AutocompleteMnxMetabolite>
                    </td>
                    <td>
                      <v-number-field
                        v-model.number="uptakeSecretionItem.measurement"
                        hint="mmol gDW <sup>-1</sup> h <sup>-1</sup>"
                        persistent-hint
                        step="any"
                        @paste="
                          paste(
                            2,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                        :rules="[
                          requiredIfHasMain(
                            'uptakeSecretion',
                            uptakeSecretionItem.measurement,
                            uptakeSecretionItem
                          )
                        ]"
                      ></v-number-field>
                    </td>
                    <td>
                      <v-number-field
                        v-model.number="uptakeSecretionItem.uncertainty"
                        hint="mmol gDW <sup>-1</sup> h <sup>-1</sup>"
                        persistent-hint
                        step="any"
                        @paste="
                          paste(
                            3,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                      ></v-number-field>
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
            </v-form-extended>

            <!-- Molar Yields table -->
            <v-form-extended
              v-model="tables.molarYields.isValid"
              immediatelyValidated
            >
              <div v-show="selectedTableKey === 'molarYields'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.molarYields.items"
                  :pagination.sync="tables.molarYields.pagination"
                  :rows-per-page-items="[10, 25]"
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
                      >
                      </v-select>
                    </td>
                    <td>
                      <AutocompleteMnxMetabolite
                        hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known metabolites."
                        @change="onChange(molarYieldsItem, 'product', $event)"
                        @paste="
                          paste(
                            1,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                        @clear="
                          onMeasurementClear(
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            'product'
                          )
                        "
                        :forceSearchQuery="
                          molarYieldsItem.product &&
                            molarYieldsItem.product._pastedText
                        "
                        :modelIds="getRelevantModelIds(molarYieldsItem)"
                        :rules="[
                          requiredIfHasMain(
                            'molarYields',
                            molarYieldsItem.product,
                            molarYieldsItem
                          )
                        ]"
                        validate-on-blur
                      ></AutocompleteMnxMetabolite>
                    </td>
                    <td>
                      <AutocompleteMnxMetabolite
                        hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known metabolites."
                        @change="onChange(molarYieldsItem, 'substrate', $event)"
                        @paste="
                          paste(
                            2,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                        @clear="
                          onMeasurementClear(
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            'substrate'
                          )
                        "
                        :forceSearchQuery="
                          molarYieldsItem.substrate &&
                            molarYieldsItem.substrate._pastedText
                        "
                        :modelIds="getRelevantModelIds(molarYieldsItem)"
                        :rules="[
                          requiredIfHasMain(
                            'molarYields',
                            molarYieldsItem.substrate,
                            molarYieldsItem
                          )
                        ]"
                        validate-on-blur
                      ></AutocompleteMnxMetabolite>
                    </td>
                    <td>
                      <v-number-field
                        v-model.number="molarYieldsItem.measurement"
                        hint="mmol-product / mmol-substrate"
                        persistent-hint
                        step="any"
                        @paste="
                          paste(
                            3,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                        :rules="[
                          requiredIfHasMain(
                            'molarYields',
                            molarYieldsItem.measurement,
                            molarYieldsItem
                          )
                        ]"
                      ></v-number-field>
                    </td>
                    <td>
                      <v-number-field
                        v-model.number="molarYieldsItem.uncertainty"
                        hint="mmol-product / mmol-substrate"
                        persistent-hint
                        step="any"
                        @paste="
                          paste(
                            4,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                      ></v-number-field>
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
            </v-form-extended>

            <!-- Growth table -->
            <v-form-extended
              v-model="tables.growth.isValid"
              immediatelyValidated
            >
              <div v-show="selectedTableKey === 'growth'">
                <v-data-table
                  :headers="selectedTable.headers"
                  :items="tables.growth.items"
                  :pagination.sync="tables.growth.pagination"
                  :rows-per-page-items="[10, 25]"
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
                      <v-number-field
                        v-model.number="growthItem.measurement"
                        hint="mmol gDW <sup>-1</sup> h <sup>-1</sup>"
                        persistent-hint
                        step="any"
                        :rules="[
                          requiredIfHasMain(
                            'growth',
                            growthItem.measurement,
                            growthItem
                          )
                        ]"
                        @paste="
                          paste(
                            1,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                      ></v-number-field>
                    </td>
                    <td>
                      <v-number-field
                        v-model.number="growthItem.uncertainty"
                        hint="mmol gDW <sup>-1</sup> h <sup>-1</sup>"
                        persistent-hint
                        step="any"
                        @paste="
                          paste(
                            2,
                            index +
                              (selectedTable.pagination.page - 1) *
                                selectedTable.pagination.rowsPerPage,
                            selectedTable,
                            $event
                          )
                        "
                      ></v-number-field>
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
            </v-form-extended>
          </v-card>
        </v-flex>

        <v-divider vertical></v-divider>

        <!-- Selection area -->
        <v-flex md2>
          <v-card class="pa-4" height="100%" elevation="0">
            <v-form-extended
              v-model="isExperimentDataValid"
              immediatelyValidated
            >
              <v-text-field
                v-model="experiment.name"
                label="Experiment name *"
                :rules="[requiredIfHasCondition(experiment.name)]"
              ></v-text-field>
              <v-textarea
                v-model="experiment.description"
                label="Description *"
                :rules="[requiredIfHasCondition(experiment.description)]"
                auto-grow
                rows="1"
              ></v-textarea>
              <v-autocomplete-extended
                item-text="name"
                item-value="id"
                v-model="experiment.project_id"
                :items="availableProjects"
                :rules="[requiredIfHasCondition(experiment.project_id)]"
                name="project"
                label="Project *"
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
                <div v-for="(table, key) in tables" :key="key">
                  <v-tooltip bottom :disabled="Boolean(!isTableDisabled(key))">
                    <template v-slot:activator="{ on }">
                      <v-layout v-on="on">
                        <v-radio
                          :label="table.name"
                          :value="key"
                          color="primary"
                          class="mb-1"
                          :disabled="Boolean(isTableDisabled(key))"
                        ></v-radio>
                        <v-icon
                          v-if="
                            table.isValid &&
                              table.items.some(item => item[table.mainField])
                          "
                          color="success"
                          >done</v-icon
                        >
                        <v-icon v-if="!table.isValid" color="error"
                          >error_outline</v-icon
                        >
                      </v-layout>
                    </template>
                    <span>{{ isTableDisabled(key) }}</span>
                  </v-tooltip>
                </div>
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
                  :disabled="!isValid"
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
            </v-form-extended>
          </v-card>
        </v-flex>
      </v-layout>
    </v-dialog>
    <v-snackbar color="error" v-model="isMoreDataRequired" :timeout="7000">
      Please enter condition, sample and at least one measurement.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import uuidv4 from "uuid/v4";
import { tsvParseRows } from "d3-dsv";
import { flatten, groupBy, mapValues } from "lodash";
import * as settings from "@/utils/settings";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import SelectDialog from "@/components/SelectDialog.vue";
import UniprotInput from "@/components/UniprotInput.vue";
import { mapGetters } from "vuex";

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
    isExperimentDataValid: true,
    isMoreDataRequired: false,
    submitProgressValue: 0,
    conditionTempIdsMap: {},
    sampleTempIdsMap: {},
    selectedMediumRelevantModelIds: [],
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
          { text: "Name *", value: "name", width: "35%" },
          { text: "Strain *", value: "strain", width: "30%" },
          { text: "Medium *", value: "medium", width: "30%" },
          { value: "actions", width: "5%" }
        ],
        parsePasted: {
          name: str => str,
          strain: (str, { availableStrains }) => {
            const match = availableStrains.find(({ name }) => name === str);
            return match || { _pastedText: str };
          },
          medium: (str, { availableMedia }) => {
            const match = availableMedia.find(({ name }) => name === str);
            return match || { _pastedText: str };
          }
        },
        items: [{ temporaryId: uuidv4() }],
        isValid: true,
        rowIndexOnThePage: null,
        // We should control pagination for every table separately
        // When using pagination, data table's indeces on every page start from 0
        // To get the correct index, we need to take into account also page and
        // rowsPerPage properties of the pagination object
        pagination: {
          rowsPerPage: 10
        }
      },
      samples: {
        name: "Samples",
        mainField: "name",
        headers: [
          { text: "Condition *", value: "condition", width: "30%" },
          { text: "Name *", value: "name", width: "25%" },
          { text: "Start time *", value: "startTime", width: "20%" },
          { text: "End time", value: "endTime", width: "20%" },
          { value: "actions", width: "5%" }
        ],
        parsePasted: {
          name: str => str,
          startTime: str => str,
          endTime: str => str
        },
        items: [{ temporaryId: uuidv4() }],
        isValid: true,
        pagination: {
          rowsPerPage: 10
        }
      },
      fluxomics: {
        name: "Fluxomics",
        mainField: "sample",
        headers: [
          { text: "Sample *", value: "sample", width: "25%" },
          { text: "Reaction *", value: "reaction", width: "30%" },
          { text: "Measurement *", value: "measurement", width: "20%" },
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
        items: [{ temporaryId: uuidv4() }],
        isValid: true,
        pagination: {
          rowsPerPage: 10
        }
      },
      metabolomics: {
        name: "Metabolomics",
        mainField: "sample",
        headers: [
          { text: "Sample *", value: "sample", width: "25%" },
          { text: "Compound *", value: "compound", width: "30%" },
          { text: "Measurement *", value: "measurement", width: "20%" },
          { text: "Uncertainty", value: "uncertainty", width: "20%" },
          { value: "actions", width: "5%" }
        ],
        parsePasted: {
          compound: str => ({ _pastedText: str }),
          measurement: str => parseFloat(str),
          uncertainty: str => parseFloat(str)
        },
        items: [{ temporaryId: uuidv4() }],
        isValid: true,
        pagination: {
          rowsPerPage: 10
        }
      },
      proteomics: {
        name: "Proteomics",
        mainField: "sample",
        headers: [
          { text: "Sample *", value: "sample", width: "25%" },
          { text: "Protein *", value: "protein", width: "30%" },
          { text: "Measurement *", value: "measurement", width: "20%" },
          { text: "Uncertainty", value: "uncertainty", width: "20%" },
          { value: "actions", width: "5%" }
        ],
        parsePasted: {
          protein: str => ({ _pastedText: str }),
          measurement: str => parseFloat(str),
          uncertainty: str => parseFloat(str)
        },
        items: [{ temporaryId: uuidv4() }],
        isValid: true,
        pagination: {
          rowsPerPage: 10
        }
      },
      uptakeSecretion: {
        name: "Uptake/Secretion rates",
        mainField: "sample",
        headers: [
          { text: "Sample *", value: "sample", width: "25%" },
          { text: "Compound *", value: "compound", width: "30%" },
          { text: "Measurement *", value: "measurement", width: "20%" },
          { text: "Uncertainty", value: "uncertainty", width: "20%" },
          { value: "actions", width: "5%" }
        ],
        parsePasted: {
          compound: str => ({ _pastedText: str }),
          measurement: str => parseFloat(str),
          uncertainty: str => parseFloat(str)
        },
        items: [{ temporaryId: uuidv4() }],
        isValid: true,
        pagination: {
          rowsPerPage: 10
        }
      },
      molarYields: {
        name: "Molar Yields",
        mainField: "sample",
        headers: [
          { text: "Sample *", value: "sample", width: "20%" },
          {
            text: "Product *",
            value: "product",
            width: "25%"
          },
          {
            text: "Substrate *",
            value: "substrate",
            width: "25%"
          },
          { text: "Measurement *", value: "measurement", width: "12.5%" },
          { text: "Uncertainty", value: "uncertainty", width: "12.5%" },
          { value: "actions", width: "5%" }
        ],
        parsePasted: {
          product: str => ({ _pastedText: str }),
          substrate: str => ({ _pastedText: str }),
          measurement: str => parseFloat(str),
          uncertainty: str => parseFloat(str)
        },
        items: [{ temporaryId: uuidv4() }],
        isValid: true,
        pagination: {
          rowsPerPage: 10
        }
      },
      growth: {
        name: "Growth",
        mainField: "sample",
        headers: [
          { text: "Sample *", value: "sample", width: "30%" },
          { text: "Measurement *", value: "measurement", width: "30%" },
          { text: "Uncertainty", value: "uncertainty", width: "30%" },
          { value: "actions", width: "10%" }
        ],
        parsePasted: {
          measurement: str => parseFloat(str),
          uncertainty: str => parseFloat(str)
        },
        items: [{ temporaryId: uuidv4() }],
        isValid: true,
        pagination: {
          rowsPerPage: 10
        }
      }
    }
  };
}

export default Vue.extend({
  name: "NewExperiment",
  components: {
    UniprotInput
  },
  props: {
    value: {
      type: Boolean,
      required: true
    }
  },
  data: () => getInitialState(),
  computed: {
    ...mapGetters({
      getOrganismById: "organisms/getOrganismById"
    }),
    availableStrains() {
      return this.$store.state.strains.strains;
    },
    availableMedia() {
      return this.$store.state.media.media;
    },
    availableProjects() {
      return this.$store.state.projects.projects;
    },
    modelIdsByOrganism() {
      const models = this.$store.getters["models/getModels"];
      const modelsByOrganism = groupBy(models, model => model.organism_id);
      return mapValues(modelsByOrganism, models => {
        return models.map(model => model.id);
      });
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
        "proteomics",
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
    },
    isValid() {
      return (
        Object.values(this.tables).every((table: any) => table.isValid) &&
        this.isExperimentDataValid
      );
    }
  },
  methods: {
    addRow(tableKey) {
      this.tables[tableKey].items.push({
        temporaryId: uuidv4()
      });
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
          "proteomics",
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
      const index =
        this.tables.conditions.rowIndexOnThePage +
        (this.tables.conditions.pagination.page - 1) *
          this.tables.conditions.pagination.rowsPerPage;
      this.tables.conditions.items[index].strain = strain;
    },
    passMedium(medium) {
      const index =
        this.tables.conditions.rowIndexOnThePage +
        (this.tables.conditions.pagination.page - 1) *
          this.tables.conditions.pagination.rowsPerPage;
      this.tables.conditions.items[index].medium = medium;
    },
    passProject(project) {
      this.experiment.project_id = project.id;
    },
    getRelevantModelIds(item) {
      // Get ids of the models the selected organism belongs to
      // in order to prioritize reaction and compound results from autocomplete
      const organismId =
        item.sample && item.sample.condition && item.sample.condition.strain
          ? item.sample.condition.strain.organism_id
          : null;
      return this.modelIdsByOrganism[organismId] || [];
    },
    getRelevantModelIdsForNewMedium(condition) {
      const organismId = condition.strain ? condition.strain.organism_id : null;
      this.selectedMediumRelevantModelIds =
        this.modelIdsByOrganism[organismId] || [];
    },
    requiredIfHasMain(tableKey, value, row) {
      const mainField = this.tables[tableKey].mainField;
      if (row[mainField]) {
        if (!value && value !== 0) {
          return "Required.";
        }
        if (value && value._pastedText) {
          return "No match was found.";
        }
      }
      return true;
    },
    requiredIfHasCondition(value) {
      const mainField = this.tables.conditions.mainField;
      if (
        this.tables.conditions.items.filter(item => item[mainField]).length &&
        !value &&
        value !== 0
      ) {
        return "Required.";
      }
      return true;
    },
    singleDateTimeRule(value) {
      if (!value || this.$moment(value, "YYYY-MM-DD HH:mm", true).isValid()) {
        return true;
      }
      return `Invalid datetime <br> yyyy-mm-dd hh:mm`;
    },
    dateTimeRules(startTime, endTime) {
      if (
        this.$moment(endTime, "YYYY-MM-DD HH:mm").isBefore(
          this.$moment(startTime, "YYYY-MM-DD HH:mm")
        )
      ) {
        return "End Time cannot be earlier than Start Time";
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
                tables: this.tables,
                availableStrains: this.availableStrains,
                availableMedia: this.availableMedia
              });
            } else {
              // Empty cell clears existing value.
              value = null;
            }

            return [property, value];
          });
      });

      // Ask which condition/sample pasted data belongs to
      let dialogSelection;
      if (table.name === "Samples") {
        dialogSelection = this.$promisedDialog(SelectDialog, {
          itemType: "condition",
          items: this.tables.conditions.items.filter(({ name }) => name)
        }).then(selected => (selected ? [["condition", selected]] : []));
      } else if (table.name === "Conditions") {
        dialogSelection = Promise.resolve([]);
      } else {
        dialogSelection = this.$promisedDialog(SelectDialog, {
          itemType: "sample",
          items: this.tables.samples.items.filter(({ name }) => name)
        }).then(selected => (selected ? [["sample", selected]] : []));
      }

      dialogSelection.then(rowPairsFromDialog => {
        // parsedRows = [[["name", "a"], ["measurement", 5], ["uncertainty", null]]]
        parsedRows.forEach((rowPairs, rowIx) => {
          if (!table.items[rowOffset + rowIx]) {
            // Create excess rows.
            table.items.push({ temporaryId: uuidv4() });
          }
          [...rowPairs, ...rowPairsFromDialog].forEach(([property, value]) => {
            Vue.set(table.items[rowOffset + rowIx], property, value);
          });
        });
      });
    },
    onChange(item, property, value) {
      Vue.set(item, property, value);
    },
    clear() {
      Object.assign(this.$data, getInitialState());
    },
    createExperiment() {
      const hasACondition = this.tables.conditions.items.some(
        item => item[this.tables.conditions.mainField]
      );
      const hasASample = this.tables.samples.items.some(
        item => item[this.tables.samples.mainField]
      );
      const hasAMeasurement = [
        "fluxomics",
        "metabolomics",
        "proteomics",
        "uptakeSecretion",
        "molarYields",
        "growth"
      ].some(tableKey =>
        this.tables[tableKey].items.some(
          item => item[this.tables[tableKey].mainField]
        )
      );

      // Check that all required data is entered:
      // condition, sample and at least one measurement
      this.isMoreDataRequired =
        !hasACondition || !hasASample || !hasAMeasurement;
      if (this.isMoreDataRequired) {
        return;
      }
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
          return Promise.all(this.postProteomics());
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
          this.$emit("new-experiment-success", this.experiment.name);
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
              "YYYY-MM-DD HH:mm"
            ).toDate(),
            end_time: sample.endTime
              ? this.$moment(sample.endTime, "YYYY-MM-DD HH:mm").toDate()
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
    postProteomics() {
      return this.tables.proteomics.items
        .filter(proteomicsItem => proteomicsItem.sample)
        .map(proteomicsItem => {
          const payload = {
            sample_id: this.sampleTempIdsMap[proteomicsItem.sample.temporaryId],
            name: proteomicsItem.protein.name,
            identifier: proteomicsItem.protein.identifier,
            gene: proteomicsItem.protein.gene,
            measurement: proteomicsItem.measurement,
            uncertainty: proteomicsItem.uncertainty || 0
          };
          return axios
            .post(`${settings.apis.warehouse}/proteomics`, payload)
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
    },
    isTableDisabled(key): false | string {
      if (key === "conditions") {
        return false;
      } else if (key === "samples") {
        const mainField = this.tables.conditions.mainField;
        if (
          this.tables.conditions.items[0][mainField] &&
          this.tables.conditions.isValid
        ) {
          return false;
        } else {
          return "You should enter valid condition first";
        }
      } else {
        const mainField = this.tables.samples.mainField;
        if (
          this.tables.samples.items[0][mainField] &&
          this.tables.samples.isValid
        ) {
          return false;
        } else {
          return "You should enter valid sample first";
        }
      }
    },
    strainDisplay(strain) {
      return `${strain.name +
        (this.getOrganismById(strain.organism_id)
          ? " (" + this.getOrganismById(strain.organism_id).name + ")"
          : "")}`;
    },
    onMeasurementClear(index, table, property) {
      table.items[index][property] = null;
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
