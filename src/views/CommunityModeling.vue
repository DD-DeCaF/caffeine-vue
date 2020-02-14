<template>
  <v-container>
    <MethodHelpDialog
      :showMethodHelpDialog="showMethodHelpDialog"
      @close-dialog="showMethodHelpDialog = false"
    />
    <v-card>
      <v-card-title></v-card-title>
      <v-card-text>
        <v-btn
          color="primary"
          small
          fab
          top
          right
          class="sidepanel-toggle"
          @click="isSidepanelOpen = true"
        >
          <v-icon>apps</v-icon>
        </v-btn>
        <v-container @click="isSidepanelOpen = false" v-if="communityData">
          <!-- Community Growth Rate -->
          <h1>Community Modeling</h1>
          <h2>Community Growth Rate</h2>
          <p>{{ communityData.growth_rate }}</p>
          <!-- Abundance -->
          <h2>Abundance</h2>
          <v-data-table
            :headers="headersAbundance"
            :items="communityData.abundance"
            class="elevation-1 pa-2 my-3"
          >
            <template v-slot:items="props">
              <td>
                {{
                  getOrganismByID(getModelByID(props.item.id).organism_id).name
                }}
              </td>
              <td>{{ getModelByID(props.item.id).name }}</td>
              <td>{{ props.item.value }}</td>
            </template>
            <template v-slot:no-data>
              <v-alert :value="true" color="error" icon="warning">
                No data to display yet. Select a medium and at least two models,
                then click SIMULATE NOW.
              </v-alert>
            </template>
          </v-data-table>
          <!-- Cross-Feeding -->
          <h2>Cross-Feeding</h2>
          <div ref="chartdiv" class="chart-style"></div>
          <v-card>
            <v-card-title>
              <v-layout row justify-space-around>
                <v-flex xl3>
                  <v-autocomplete
                    v-model="fromSearch"
                    :items="communityData.cross_feeding"
                    filled
                    chips
                    color="primary"
                    label="Source organism"
                    item-value="from"
                    multiple
                  >
                    <template slot="item" slot-scope="data">
                      {{ translateModelIDs(data.item.to) }}
                    </template>
                    <template v-slot:selection="data">
                      <v-chip
                        :selected="data.selected"
                        close
                        class="chip--select-multi"
                        @input="removeFromFilter(data.item)"
                      >
                        {{ translateModelIDs(data.item.from) }}
                      </v-chip>
                    </template>
                  </v-autocomplete>
                </v-flex>
                <v-spacer></v-spacer>
                <v-flex xl3>
                  <v-autocomplete
                    v-model="toSearch"
                    :items="communityData.cross_feeding"
                    filled
                    chips
                    color="primary"
                    label="Target organism"
                    item-value="to"
                    multiple
                  >
                    <template slot="item" slot-scope="data">
                      {{ translateModelIDs(data.item.to) }}
                    </template>
                    <template v-slot:selection="data">
                      <v-chip
                        :selected="data.selected"
                        close
                        class="chip--select-multi"
                        @input="removeToFilter(data.item)"
                      >
                        {{ translateModelIDs(data.item.to) }}
                      </v-chip>
                    </template>
                  </v-autocomplete>
                </v-flex>
                <v-spacer></v-spacer>
                <v-flex xl3>
                  <v-autocomplete
                    v-model="metaboliteSearch"
                    :items="communityData.cross_feeding"
                    filled
                    chips
                    color="primary"
                    label="Search metabolite"
                    item-value="metabolite"
                    multiple
                  >
                    <template slot="item" slot-scope="data">
                      {{ data.item.metabolite_name }}
                    </template>
                    <template v-slot:selection="data">
                      <v-chip
                        :selected="data.selected"
                        close
                        class="chip--select-multi"
                        @input="removeMetaboliteFilter(data.item)"
                      >
                        {{ data.item.metabolite_name }}
                      </v-chip>
                    </template>
                  </v-autocomplete>
                </v-flex>
                <v-spacer></v-spacer>
                <v-flex xl3 flex-shrink-0>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <v-btn
                        flat
                        color="primary"
                        :disabled="!communityDataFiltered.length"
                        class="mt-3"
                        @click="exportData()"
                        v-on="on"
                        ><v-icon v-if="!isExporting">cloud_download</v-icon
                        ><v-progress-circular
                          v-if="isExporting"
                          class="mr-1"
                          indeterminate
                          color="primary"
                          :width="2"
                          :size="15"
                        ></v-progress-circular
                      ></v-btn>
                    </template>
                    <span>Download table as csv</span>
                  </v-tooltip>
                </v-flex>
              </v-layout>
            </v-card-title>
            <v-data-table
            :headers="headersCrossFeeding"
            :items="communityData.cross_feeding"
            class="elevation-1 pa-2 my-3"
          >
            <template v-slot:items="props">
              <td>{{ translateModelIDs(props.item.from) }}</td>
              <td>{{ translateModelIDs(props.item.to) }}</td>
              <td>{{ props.item.metabolite_name }}</td>
              <td>{{ props.item.value }}</td>
            </template>
            <template v-slot:no-data>
              <v-alert :value="true" color="error" icon="warning">
                Cross-feeding could not be calculated. This could be due to
                mismatching metabolite identifiers between the selected models.
              </v-alert>
            </template>
          </v-data-table>
          </v-card>
        </v-container>
        <v-container @click="isSidepanelOpen = false" v-else>
          No data to display yet. Select a medium and at least two models, then
          click SIMULATE NOW.
        </v-container>
      </v-card-text>
    </v-card>
    <v-navigation-drawer
      v-model="isSidepanelOpen"
      right
      absolute
      hide-overlay
      class="elevation-6"
    >
      <v-container class="py-1">
        <v-select
          :items="availableMedia"
          :disabled="isUpdating"
          :loading="isLoading"
          label="Selected Medium"
          autofocus
          item-text="name"
          item-value="id"
          v-model="selectedMedium"
          return-object
          :rules="[v => !!v || 'Please choose a medium.']"
        ></v-select>
        <v-autocomplete
          v-model="selectedModels"
          :disabled="isUpdating"
          :items="models"
          box
          chips
          label="Selected Models"
          item-text="name"
          item-value="id"
          multiple
          :rules="[
            v =>
              v.length >= 2 ||
              'Please choose at least two metabolic models that you wish to simulate as a community.'
          ]"
        >
          <template v-slot:selection="data">
            <v-chip
              :selected="data.selected"
              close
              class="chip--select-multi"
              @input="remove(data.item)"
            >
              {{ data.item.name }}
            </v-chip>
          </template>
        </v-autocomplete>

        <v-select
          :items="methods"
          :disabled="isUpdating"
          label="Simulation Method"
          item-text="name"
          item-value="id"
          :hint="selectedMethod.description"
          persistent-hint
          v-model="selectedMethod"
          return-object
          prepend-icon="help"
          @click:prepend="showMethodHelpDialog = true"
          :rules="[v => !!v || 'Please choose the simulation method.']"
        ></v-select>

        <v-btn
          :loading="isUpdating"
          :disabled="isUpdating || !isValid"
          color="primary"
          depressed
          @click="simulateCommunity"
        >
          <v-icon left>update</v-icon>
          Simulate Now
        </v-btn>
      </v-container>
    </v-navigation-drawer>
    <v-snackbar color="error" v-model="hasSimulationError" :timeout="8000">
      Sorry, we were not able to complete the simulation successfully. Please
      try again in a few seconds, or contact us if the problem persists.
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import * as settings from "@/utils/settings";
import { mapGetters } from "vuex";
import { partitionedList } from "@/utils/utility";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import MethodHelpDialog from "@/views/MethodHelpDialog.vue";

am4core.useTheme(am4themes_animated);

export default Vue.extend({
  name: "CommunityModeling",
  components: {
    MethodHelpDialog
  },
  data: () => ({
    showMethodHelpDialog: false,
    chart: null,
    metaboliteSearch: [],
    fromSearch: [],
    toSearch: [],
    isUpdating: false,
    isLoading: true,
    selectedModels: [],
    selectedMedium: null,
    selectedMethod: null,
    isSidepanelOpen: true,
    hasSimulationError: false,
    isExporting: false,
    hasExportError: false,
    exportErrorMessage: null,
    communityData: {
      growth_rate: null,
      cross_feeding: [],
      abundance: []
    },
    headersAbundance: [
      { text: "Organism", value: "id" },
      { text: "Model", value: "id" },
      { text: "Abundance", value: "value" }
    ],
    headersCrossFeeding: [
      { text: "From", value: "from" },
      { text: "To", value: "to" },
      { text: "Metabolite", value: "metabolite_name" },
      { text: "Value", value: "value" }
    ],
    methods: [
      {
        id: "steadycom",
        name: "SteadyCom",
        description: "ReFramed implementation of SteadyCom (Chan et. al. 2017)"
      }
      // {
      //   id: "steadiercom",
      //   name: "SteadierCom",
      //   description: "Improvements on SteadyCom by Daniel Machado"
      // }
    ]
  }),
  computed: {
    isValid() {
      if (this.selectedModels.length >= 2 && this.selectedMedium !== null) {
        return true;
      } else {
        return false;
      }
    },
    models() {
      return partitionedList("models", "organisms");
    },
    availableModels() {
      return this.$store.state.models.models;
    },
    availableMedia() {
      return this.$store.state.media.media;
    },
    allMediumCompounds() {
      return this.$store.state.media.compounds;
    },
    ...mapGetters({
      getModelByID: "models/getModelById",
      getOrganismByID: "organisms/getOrganismById"
    }),
    communityDataFiltered() {
      return this.communityData.cross_feeding.filter(i => {
        return (
          (!this.metaboliteSearch.length &&
            !this.fromSearch.length &&
            !this.toSearch.length) ||
          (this.metaboliteSearch.length > 0 ===
            this.metaboliteSearch.includes(i.metabolite) &&
            this.fromSearch.length > 0 === this.fromSearch.includes(i.from) &&
            this.toSearch.length > 0 === this.toSearch.includes(i.to))
        );
      });
    }
  },
  watch: {
    communityDataFiltered: function() {
      this.renderCrossfeeding();
    }
  },
  created() {
    this.selectedMethod = this.methods[0];
    this.$store.state.media.mediaPromise.then(() => {
      this.isLoading = false;
    });
  },
  mounted() {
    this.renderCrossfeeding();
  },
  beforeDestroy() {
    this.disposeChart();
  },
  methods: {
    disposeChart() {
      if (this.chart) {
        this.chart.dispose();
      }
    },
    translateModelIDs(id) {
      // Translates numeric model warehouse IDs in cross_feedling response to
      // Model name but leaves 'medium' untouched.
      if (id !== "medium") {
        return this.getModelByID(id).name;
      } else {
        return "Medium";
      }
    },
    cleanData(cross_feeding) {
      if (cross_feeding.length > 0) {
        let output = cross_feeding.map(obj => ({
          ...obj,
          to: this.translateModelIDs(obj.to),
          from: this.translateModelIDs(obj.from)
        }));
        return output;
      } else {
        return [];
      }
    },
    renderCrossfeeding() {
      this.disposeChart();
      const chart = am4core.create(this.$refs.chartdiv, am4charts.ChordDiagram);

      chart.data = this.cleanData(this.communityDataFiltered);

      chart.dataFields.fromName = "from";
      chart.dataFields.toName = "to";
      chart.dataFields.value = "value";
      chart.sortBy = "value";
      chart.responsive.enabled = true;

      const slice = chart.nodes.template.slice;
      slice.stroke = am4core.color("#000");
      slice.strokeOpacity = 0.8;
      slice.strokeWidth = 1;
      slice.cornerRadius = 8;
      slice.innerCornerRadius = 8;

      var nodeTemplate = chart.nodes.template;
      nodeTemplate.readerTitle = "Click to show/hide or drag to rearrange";
      nodeTemplate.tooltipText = "{name}'s total exchanges: {total}";
      nodeTemplate.propertyFields.fill = "color";

      // Hovering over a Node highlights all connections that emmanate from that node.
      nodeTemplate.events.on("over", event => {
        var node = event.target;
        node.outgoingDataItems.each(dataItem => {
          if (dataItem.toNode) {
            dataItem.link.isHover = true;
            dataItem.toNode.isHover = true;
          }
        });
        node.incomingDataItems.each(dataItem => {
          if (dataItem.fromNode) {
            dataItem.link.isHover = true;
            dataItem.fromNode.label.isHover = true;
          }
        });

        node.label.isHover = true;
      });

      // Moving off a Node removes the highlights.
      nodeTemplate.events.on("out", event => {
        var node = event.target;
        node.outgoingDataItems.each(dataItem => {
          if (dataItem.toNode) {
            dataItem.link.isHover = false;
            dataItem.toNode.isHover = false;
          }
        });
        node.incomingDataItems.each(dataItem => {
          if (dataItem.fromNode) {
            dataItem.link.isHover = false;
            dataItem.fromNode.label.isHover = false;
          }
        });

        node.label.isHover = false;
      });

      var label = nodeTemplate.label;
      label.relativeRotation = 90;
      label.fillOpacity = 0.5;
      var labelHS = label.states.create("hover");
      labelHS.properties.fillOpacity = 1;

      // link template
      var linkTemplate = chart.links.template;
      linkTemplate.strokeOpacity = 0;
      linkTemplate.fillOpacity = 0.2;
      linkTemplate.tooltipText =
        "{fromName} provides {value.value} mmol/l {metabolite_name} to {toName}";

      var hoverState = linkTemplate.states.create("hover");
      hoverState.properties.fillOpacity = 0.7;
      hoverState.properties.strokeOpacity = 0.7;

      this.chart = chart;
    },
    simulateCommunity() {
      this.isUpdating = true;
      const payload = {
        medium: this.allMediumCompounds
          .filter(c => c.medium_id === this.selectedMedium.id)
          .map(c => c.compound_identifier),
        model_ids: this.selectedModels,
        method: this.selectedMethod.id
      };
      axios
        .post(`${settings.apis.simulations}/community/simulate`, payload)
        .then(response => {
          this.communityData = response.data;
          this.renderCrossfeeding();
          this.isUpdating = false;
        })
        .catch(error => {
          this.isUpdating = false;
          this.communityData = null;
          this.hasSimulationError = true;
        });
    },
    remove(item) {
      const index = this.selectedModels.indexOf(item.id);
      if (index >= 0) {
        this.selectedModels.splice(index, 1);
      }
    },
    removeMetaboliteFilter(item) {
      const index = this.metaboliteSearch.indexOf(item.metabolite);
      if (index >= 0) {
        this.metaboliteSearch.splice(index, 1);
      }
    },
    removeFromFilter(item) {
      const index = this.fromSearch.indexOf(item.from);
      if (index >= 0) {
        this.fromSearch.splice(index, 1);
      }
    },
    removeToFilter(item) {
      const index = this.toSearch.indexOf(item.to);
      if (index >= 0) {
        this.toSearch.splice(index, 1);
      }
    },
    exportData() {
      this.isExporting = true;
      const csvData = this.communityDataFiltered.map(item => ({
        sourceOrganism: this.getModelByID(item.from).name,
        targetOrganism: this.getModelByID(item.to).name,
        metabolite: item.metabolite,
        value: item.value
      }));
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += [
        Object.keys(csvData[0]).join(","),
        ...csvData.map(item => Object.values(item).join(","))
      ].join("\n");
      const fileName = `community_model_${this.$moment().format(
        "YYYY-MM-DD_HH-mm"
      )}`;
      var element = document.createElement("a");
      element.setAttribute("href", encodeURI(csvContent));
      element.setAttribute("download", fileName + ".csv");

      element.style.display = "none";
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);

      this.isExporting = false;
    }
  }
});
</script>

<style scoped>
.chart-style {
  width: 100%;
  height: 600px;
}
.sidepanel-toggle {
  position: absolute;
}
</style>
