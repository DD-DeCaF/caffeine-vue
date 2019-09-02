<template>
  <div>
    <NewStrain v-model="isNewStrainDialogVisible" @return-object="passStrain" />
    <NewMedium v-model="isNewMediumDialogVisible" @return-object="passMedium" />
    <NewProject
      v-model="isProjectCreationDialogVisible"
      @return-object="passProject"
    />
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
                      <v-select
                        return-object
                        :items="conditions.filter(c => c.name)"
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
                      <v-select
                        return-object
                        :items="samples.filter(s => s.name)"
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
                        @change="fluxomicsItem.reaction = $event.reaction"
                      ></AutocompleteMnxReaction>
                    </td>
                    <td>
                      <v-text-field
                        v-model.number="fluxomicsItem.measurement"
                        suffix="mmol/g/h"
                        type="number"
                        step="any"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-text-field
                        v-model.number="fluxomicsItem.uncertainty"
                        suffix="mmol/g/h"
                        type="number"
                        step="any"
                      ></v-text-field>
                    </td>
                  </template>
                </v-data-table>
              </template>

              <!-- Metabolomics table -->
              <template v-if="selectedTable === 'metabolomics'">
                <v-data-table
                  :headers="metabolomicsHeaders"
                  :items="metabolomics"
                  :pagination.sync="pagination"
                  disable-initial-sort
                >
                  <template
                    v-slot:items="{ item: metabolomicsItem, index: index }"
                  >
                    <td>
                      <v-select
                        return-object
                        :items="samples.filter(s => s.name)"
                        item-text="name"
                        item-value="temporaryId"
                        v-model="metabolomicsItem.sample"
                        no-data-text="No data available. You can add it in Samples table."
                      >
                      </v-select>
                    </td>
                    <td>
                      <v-autocomplete-extended
                        return-object
                        item-text="name"
                        item-value="id"
                        v-model="metabolomicsItem.compound"
                        :items="availableCompounds"
                        name="compound"
                        type="text"
                      ></v-autocomplete-extended>
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
              </template>

              <!-- Uptake/Secretion rates table -->
              <template v-if="selectedTable === 'uptakeSecretion'">
                <v-data-table
                  :headers="uptakeSecretionHeaders"
                  :items="uptakeSecretion"
                  :pagination.sync="pagination"
                  disable-initial-sort
                >
                  <template
                    v-slot:items="{ item: uptakeSecretionItem, index: index }"
                  >
                    <td>
                      <v-select
                        return-object
                        :items="samples.filter(s => s.name)"
                        item-text="name"
                        item-value="temporaryId"
                        v-model="uptakeSecretionItem.sample"
                        no-data-text="No data available. You can add it in Samples table."
                      >
                      </v-select>
                    </td>
                    <td>
                      <v-autocomplete-extended
                        return-object
                        item-text="name"
                        item-value="id"
                        v-model="uptakeSecretionItem.compound"
                        :items="availableCompounds"
                        name="compound"
                        type="text"
                      ></v-autocomplete-extended>
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
              </template>

              <!-- Molar Yields table -->
              <template v-if="selectedTable === 'molarYields'">
                <v-data-table
                  :headers="molarYieldsHeaders"
                  :items="molarYields"
                  :pagination.sync="pagination"
                  disable-initial-sort
                >
                  <template
                    v-slot:items="{ item: molarYieldsItem, index: index }"
                  >
                    <td>
                      <v-select
                        return-object
                        :items="samples.filter(s => s.name)"
                        item-text="name"
                        item-value="temporaryId"
                        v-model="molarYieldsItem.sample"
                        no-data-text="No data available. You can add it in Samples table."
                      >
                      </v-select>
                    </td>
                    <td>
                      <v-autocomplete-extended
                        return-object
                        item-text="name"
                        item-value="id"
                        v-model="molarYieldsItem.numeratorCompound"
                        :items="availableCompounds"
                        name="numeratorCompound"
                        type="text"
                      ></v-autocomplete-extended>
                    </td>
                    <td>
                      <v-autocomplete-extended
                        return-object
                        item-text="name"
                        item-value="id"
                        v-model="molarYieldsItem.denominatorCompound"
                        :items="availableCompounds"
                        name="denominatorCompound"
                        type="text"
                      ></v-autocomplete-extended>
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
              </template>

              <!-- Growth table -->
              <template v-if="selectedTable === 'growth'">
                <v-data-table
                  :headers="growthHeaders"
                  :items="growth"
                  :pagination.sync="pagination"
                  disable-initial-sort
                >
                  <template v-slot:items="{ item: growthItem, index: index }">
                    <td>
                      <v-select
                        return-object
                        :items="samples.filter(s => s.name)"
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
              </template>
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
                <v-radio
                  label="Metabolomics"
                  value="metabolomics"
                  color="primary"
                ></v-radio>
                <v-radio
                  label="Uptake/Secretion rates"
                  value="uptakeSecretion"
                  color="primary"
                ></v-radio>
                <v-radio
                  label="Molar Yields"
                  value="molarYields"
                  color="primary"
                ></v-radio>
                <v-radio
                  label="Growth"
                  value="growth"
                  color="primary"
                ></v-radio>
              </v-radio-group>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="secondary" flat @click="isDialogVisible = false">
                  Cancel
                </v-btn>
                <v-btn color="primary" @click="createExperiment()">
                  Submit
                </v-btn>
              </v-card-actions>
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
    metabolomics: [
      {
        temporaryId: uuidv4(),
        sample: {
          name: null
        },
        compound: {
          name: null
        }
      }
    ],
    uptakeSecretion: [
      {
        temporaryId: uuidv4(),
        sample: {
          name: null
        },
        compound: {
          name: null
        }
      }
    ],
    molarYields: [
      {
        temporaryId: uuidv4(),
        sample: {
          name: null
        },
        numeratorCompound: {
          name: null
        },
        denominatorCompound: {
          name: null
        }
      }
    ],
    growth: [
      {
        temporaryId: uuidv4(),
        sample: {
          name: null
        }
      }
    ],
    experiment: {
      name: null,
      description: null,
      project_id: null
    },
    isNewStrainDialogVisible: false,
    isNewMediumDialogVisible: false,
    isProjectCreationDialogVisible: false,
    currentRowIndex: null,
    availableCompounds: [],
    selectedTable: "conditions",
    tableNames: {
      conditions: "Conditions",
      samples: "Samples",
      fluxomics: "Fluxomics",
      metabolomics: "Metabolomics",
      uptakeSecretion: "Uptake/Secretion rates",
      molarYields: "Molar Yields",
      growth: "Growth"
    },
    conditionsHeaders: [
      { text: "Name", value: "name", width: "30%" },
      { text: "Strain", value: "strain", width: "35%" },
      { text: "Medium", value: "medium", width: "35%" }
    ],
    samplesHeaders: [
      { text: "Condition", value: "condition", width: "25%" },
      { text: "Name", value: "name", width: "25%" },
      { text: "Start time", value: "startTime", width: "25%" },
      { text: "End time", value: "endTime", width: "25%" }
    ],
    fluxomicsHeaders: [
      { text: "Sample", value: "sample", width: "25%" },
      { text: "Reaction", value: "reaction", width: "25%" },
      { text: "Measurement", value: "measurement", width: "25%" },
      { text: "Uncertainty", value: "uncertainty", width: "25%" }
    ],
    metabolomicsHeaders: [
      { text: "Sample", value: "sample", width: "25%" },
      { text: "Compound", value: "compound", width: "25%" },
      { text: "Measurement", value: "measurement", width: "25%" },
      { text: "Uncertainty", value: "uncertainty", width: "25%" }
    ],
    uptakeSecretionHeaders: [
      { text: "Sample", value: "sample", width: "25%" },
      { text: "Compound", value: "compound", width: "25%" },
      { text: "Measurement", value: "measurement", width: "25%" },
      { text: "Uncertainty", value: "uncertainty", width: "25%" }
    ],
    molarYieldsHeaders: [
      { text: "Sample", value: "sample", width: "20%" },
      { text: "Numerator compound", value: "numeratorCompound", width: "20%" },
      { text: "Denominator compound", value: "denominatorCompound", width: "20%" },
      { text: "Measurement", value: "measurement", width: "20%" },
      { text: "Uncertainty", value: "uncertainty", width: "20%" }
    ],
    growthHeaders: [
      { text: "Sample", value: "sample", width: "30%" },
      { text: "Measurement", value: "measurement", width: "35%" },
      { text: "Uncertainty", value: "uncertainty", width: "35%" }
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
    availableProjects() {
      return this.$store.state.projects.projects;
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
  // TODO: move fetch compounds logic
  created() {
    this.$store
      .dispatch("media/fetchCachedCompounds")
      .then(compounds => (this.availableCompounds = compounds));
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
      } else if (this.selectedTable === "metabolomics") {
        this.metabolomics.push({
          temporaryId: uuidv4(),
          sample: {
            name: null
          },
          compound: {
            name: null
          }
        });
      } else {
        this.growth.push({
          temporaryId: uuidv4(),
          sample: {
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
    },
    passProject(project) {
      this.experiment.project_id = project.id;
    },
    createExperiment() {}
  }
});
</script>

<style>
.full-height-dialog {
  height: 90%;
}
</style>
