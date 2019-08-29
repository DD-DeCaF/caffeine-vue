<template>
  <div>
    <NewStrain v-model="isNewStrainDialogVisible" @return-object="passStrain" />
    <NewMedium v-model="isNewMediumDialogVisible" @return-object="passMedium" />
    <v-dialog
      v-model="isDialogVisible"
      full-width
      content-class="full-height-dialog"
    >
      <v-card height="100%">
        <v-layout>
          <v-flex md10>
            <v-card class="pa-4" elevation="0">
              <div class="display-1 mb-2">{{ selectedTableName }}</div>
              <v-btn color="primary" small @click="addRow()">
                Add row
              </v-btn>
              <!-- Conditions table -->
              <template v-if="selectedTable === 'conditions'">
                <v-data-table
                  :headers="conditionsHeaders"
                  :items="conditions"
                  :pagination.sync="pagination"
                  disable-initial-sort
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
                      <v-edit-dialog
                        :return-value.sync="condition.strain"
                        large
                        persistent
                      >
                        {{ condition.strain.name }}
                        <template v-slot:input>
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
                        </template>
                      </v-edit-dialog>
                    </td>
                    <td>
                      <v-edit-dialog
                        :return-value.sync="condition.medium"
                        large
                        persistent
                      >
                        {{ condition.medium.name }}
                        <template v-slot:input>
                          <v-autocomplete-extended
                            return-object
                            item-text="name"
                            item-value="id"
                            v-model="condition.medium"
                            :items="availableMedia"
                            name="medium"
                            type="text"
                          >
                            <template v-slot:prepend-item>
                              <v-btn
                                flat
                                @click.stop="
                                  isNewMediumDialogVisible = true;
                                  currentRowIndex = index;
                                "
                                class="pl-0"
                              >
                                <v-icon class="mr-4" color="primary"
                                  >add_circle</v-icon
                                >
                                New Medium
                              </v-btn>
                              <v-divider class="my-2"></v-divider>
                            </template>
                          </v-autocomplete-extended>
                        </template>
                      </v-edit-dialog>
                    </td>
                  </template>
                </v-data-table>
              </template>

              <!-- Samples table -->
              <template v-if="selectedTable === 'samples'">
                <v-data-table
                  :headers="samplesHeaders"
                  :items="samples"
                  :pagination.sync="pagination"
                  disable-initial-sort
                >
                  <template v-slot:items="{ item: sample, index: index }">
                    <td>
                      <v-edit-dialog
                        :return-value.sync="sample.condition"
                        large
                        persistent
                      >
                        {{ sample.condition.name }}
                        <template v-slot:input>
                          <v-select
                            return-object
                            :items="conditions"
                            item-value="temporaryId"
                            item-text="name"
                            v-model="sample.condition"
                          >
                          </v-select>
                        </template>
                      </v-edit-dialog>
                    </td>
                    <!-- Name field was added, so user can distinguish -->
                    <!-- samples in other tables -->
                    <td>
                      <v-edit-dialog :return-value.sync="sample.name">
                        {{ sample.name }}
                        <template v-slot:input>
                          <v-text-field v-model="sample.name"></v-text-field>
                        </template>
                      </v-edit-dialog>
                    </td>
                    <td>
                      <v-edit-dialog :return-value.sync="sample.time">
                        {{ sample.time }}
                        <template v-slot:input>
                          <v-text-field v-model="sample.time"></v-text-field>
                        </template>
                      </v-edit-dialog>
                    </td>
                  </template>
                </v-data-table>
              </template>

              <!-- Fluxomics table -->
              <template v-if="selectedTable === 'fluxomics'">
                <v-data-table
                  :headers="fluxomicsHeaders"
                  :items="fluxomics"
                  :pagination.sync="pagination"
                  disable-initial-sort
                >
                  <template
                    v-slot:items="{ item: fluxomicsItem, index: index }"
                  >
                    <td>
                      <v-edit-dialog
                        :return-value.sync="fluxomicsItem.sample"
                        large
                        persistent
                      >
                        {{ fluxomicsItem.sample.name }}
                        <template v-slot:input>
                          <v-select
                            return-object
                            :items="samples"
                            item-text="name"
                            item-value="temporaryId"
                            v-model="fluxomicsItem.sample"
                          >
                          </v-select>
                        </template>
                      </v-edit-dialog>
                    </td>
                    <td>
                      <v-edit-dialog
                        :return-value.sync="fluxomicsItem.reaction"
                        large
                        persistent
                      >
                        {{ fluxomicsItem.reaction.name }}
                        <template v-slot:input>
                          <AutocompleteMnxReaction
                            hint="Searches the entire <a href='https://www.metanetx.org/mnxdoc/mnxref.html'>MetaNetX</a> database for known reactions."
                            @change="fluxomicsItem.reaction = $event.reaction"
                          ></AutocompleteMnxReaction>
                        </template>
                      </v-edit-dialog>
                    </td>
                    <td>
                      <v-edit-dialog
                        :return-value.sync="fluxomicsItem.measurement"
                      >
                        {{ fluxomicsItem.measurement }}
                        <template v-slot:input>
                          <v-text-field
                            v-model.number="fluxomicsItem.measurement"
                          ></v-text-field>
                        </template>
                      </v-edit-dialog>
                    </td>
                    <td>
                      <v-edit-dialog
                        :return-value.sync="fluxomicsItem.uncertainty"
                      >
                        {{ fluxomicsItem.uncertainty }}
                        <template v-slot:input>
                          <v-text-field
                            v-model.number="fluxomicsItem.uncertainty"
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

          <v-divider vertical></v-divider>

          <!-- Selection area -->
          <v-flex md2>
            <v-card class="pa-4" elevation="0">
              <v-text-field
                v-model="experimentName"
                label="Experiment name"
              ></v-text-field>
              <v-textarea
                v-model="experimentDescription"
                label="Description"
                auto-grow
                rows="1"
              ></v-textarea>
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
                <v-radio
                  label="Fluxomics"
                  value="fluxomics"
                  color="primary"
                ></v-radio>
              </v-radio-group>
            </v-card>
          </v-flex>
        </v-layout>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import uuidv4 from "uuid/v4";
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
    conditions: [
      {
        temporaryId: uuidv4(),
        strain: {
          name: null
        },
        medium: {
          name: null
        }
      }
    ],
    samples: [
      {
        temporaryId: uuidv4(),
        condition: {
          name: null
        }
      }
    ],
    fluxomics: [
      {
        temporaryId: uuidv4(),
        sample: {
          name: null
        },
        reaction: {
          name: null
        }
      }
    ],
    experimentName: null,
    experimentDescription: null,
    isNewStrainDialogVisible: false,
    isNewMediumDialogVisible: false,
    currentRowIndex: null,
    selectedTable: "conditions",
    tableNames: {
      conditions: "Conditions",
      samples: "Samples",
      fluxomics: "Fluxomics"
    },
    conditionsHeaders: [
      { text: "Name", value: "name", width: "30%" },
      { text: "Strain", value: "strain", width: "35%" },
      { text: "Medium", value: "medium", width: "35%" }
    ],
    samplesHeaders: [
      { text: "Condition", value: "condition", width: "30%" },
      { text: "Name", value: "name", width: "35%" },
      { text: "Time", value: "time", width: "35%" }
    ],
    fluxomicsHeaders: [
      { text: "Sample", value: "sample", width: "25%" },
      { text: "Reaction", value: "reaction", width: "25%" },
      { text: "Measurement", value: "measurement", width: "25%" },
      { text: "Uncertainty", value: "uncertainty", width: "25%" }
    ],
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
    addRow() {
      if (this.selectedTable === "conditions") {
        this.conditions.push({
          temporaryId: uuidv4(),
          strain: {
            name: null
          },
          medium: {
            name: null
          }
        });
      } else if (this.selectedTable === "samples") {
        this.samples.push({
          temporaryId: uuidv4(),
          condition: {
            name: null
          }
        });
      } else if (this.selectedTable === "fluxomics") {
        this.fluxomics.push({
          temporaryId: uuidv4(),
          sample: {
            name: null
          },
          reaction: {
            name: null
          }
        });
      }
    },
    passStrain(strain) {
      this.conditions[this.currentRowIndex].strain = strain;
    },
    passMedium(medium) {
      this.conditions[this.currentRowIndex].medium = medium;
    }
  }
});
</script>

<style>
.full-height-dialog {
  height: 90%;
}
</style>
