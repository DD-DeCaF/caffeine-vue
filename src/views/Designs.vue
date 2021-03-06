<template>
  <div>
    <v-container fluid>
      <v-layout justify-center>
        <v-flex>
          <h1 class="mb-2">Designs</h1>
          <div class="elevation-8">
            <v-list class="table-buttons">
              <v-list-tile>
                <v-layout justify-end>
                  <v-btn
                    flat
                    color="primary"
                    :disabled="selected.length < 1"
                    @click="visualize"
                  >
                    <v-icon>share</v-icon> Visualize
                  </v-btn>
                  <v-btn
                    flat
                    color="primary"
                    @click.stop="isDeletionDialogVisible = true"
                    :disabled="selected.length < 1"
                  >
                    <DeletionDialog
                      v-model="isDeletionDialogVisible"
                      :items="selected"
                      itemsType="designs"
                      @toggleLoader="toggleLoader()"
                      @delete-success="onDeletion"
                    />
                    <v-icon>delete</v-icon> Delete
                  </v-btn>
                </v-layout>
              </v-list-tile>
            </v-list>
            <v-data-table
              v-model="selected"
              :items="designs"
              :expand="expand"
              :pagination.sync="pagination"
              :custom-sort="customSort"
              :loading="isLoading || isDeleting"
              select-all
              :headers-length="7"
            >
              <v-progress-linear
                v-slot:progress
                color="primary"
              ></v-progress-linear>
              <template v-slot:headers="props">
                <tr>
                  <th width="5%">
                    <v-checkbox
                      :input-value="props.all"
                      :indeterminate="props.indeterminate"
                      color="primary"
                      hide-details
                      @click.stop="toggleAll"
                    ></v-checkbox>
                  </th>

                  <th
                    width="20%"
                    :class="[
                      'column sortable default-cursor text-xs-left',
                      pagination.descending ? 'desc' : 'asc',
                      'name' === pagination.sortBy ? 'active' : ''
                    ]"
                  >
                    <span @click="changeSort('name')" class="pointer"
                      >Name <v-icon>arrow_upward</v-icon><br
                    /></span>
                  </th>

                  <th
                    width="15%"
                    :class="[
                      'column sortable default-cursor text-xs-left',
                      pagination.descending ? 'desc' : 'asc',
                      'organismId' === pagination.sortBy ? 'active' : ''
                    ]"
                  >
                    <span @click="changeSort('organism_id')" class="pointer"
                      >Organism <v-icon>arrow_upward</v-icon><br
                    /></span>
                  </th>

                  <th
                    width="15%"
                    :class="[
                      'column sortable default-cursor text-xs-left',
                      pagination.descending ? 'desc' : 'asc',
                      'modelId' === pagination.sortBy ? 'active' : ''
                    ]"
                  >
                    <span @click="changeSort('modelId')" class="pointer"
                      >Model <v-icon>arrow_upward</v-icon> <br
                    /></span>
                  </th>

                  <th
                    width="15%"
                    :class="[
                      'column sortable default-cursor text-xs-left',
                      pagination.descending ? 'desc' : 'asc',
                      'reactionKnockins' === pagination.sortBy ? 'active' : ''
                    ]"
                  >
                    <span
                      @click="changeSort('reactionKnockins')"
                      class="pointer"
                      >Added Reactions <v-icon>arrow_upward</v-icon><br
                    /></span>
                  </th>

                  <th
                    width="15%"
                    :class="[
                      'column sortable default-cursor text-xs-left',
                      pagination.descending ? 'desc' : 'asc',
                      'reactionKnockouts' === pagination.sortBy ? 'active' : ''
                    ]"
                  >
                    <span
                      @click="changeSort('reactionKnockouts')"
                      class="pointer"
                      >Reaction Knockouts <v-icon>arrow_upward</v-icon><br
                    /></span>
                  </th>

                  <th
                    width="15%"
                    :class="[
                      'column sortable default-cursor text-xs-left',
                      pagination.descending ? 'desc' : 'asc',
                      'geneKnockouts' === pagination.sortBy ? 'active' : ''
                    ]"
                  >
                    <span @click="changeSort('geneKnockouts')" class="pointer"
                      >Gene Knockouts <v-icon>arrow_upward</v-icon><br
                    /></span>
                  </th>
                </tr>
              </template>
              <template v-slot:items="props">
                <tr
                  @click="props.expanded = !props.expanded"
                  class="expandable-row"
                  :key="props.item.id"
                >
                  <td @click.stop>
                    <v-checkbox
                      v-model="props.selected"
                      color="primary"
                      hide-details
                    ></v-checkbox>
                  </td>
                  <td>{{ props.item.name }}</td>
                  <td
                    v-if="
                      model(props.item.model_id) &&
                        organism(model(props.item.model_id).organism_id)
                    "
                  >
                    {{ organism(model(props.item.model_id).organism_id).name }}
                  </td>
                  <td v-else>
                    <v-progress-circular
                      indeterminate
                      color="primary"
                      :width="2"
                      :size="15"
                    ></v-progress-circular>
                  </td>
                  <td v-if="model(props.item.model_id)">
                    {{ model(props.item.model_id).name }}
                  </td>
                  <td v-else>
                    <v-progress-circular
                      indeterminate
                      color="primary"
                      :width="2"
                      :size="15"
                    ></v-progress-circular>
                  </td>
                  <td>{{ props.item.design.reactionKnockins.length }}</td>
                  <td>{{ props.item.design.reactionKnockouts.length }}</td>
                  <td>{{ props.item.design.geneKnockouts.length }}</td>
                </tr>
              </template>
              <template v-slot:expand="{ item: design }">
                <v-data-table
                  :items="[design]"
                  :expand="expand"
                  item-key="name"
                  hide-actions
                  hide-headers
                  :headers-length="7"
                >
                  <template v-slot:items="">
                    <td width="55%"></td>
                    <td width="15%">
                      <div class="link-list">
                        <div
                          v-for="(reactionKnockin, index) in design.design
                            .reactionKnockins"
                          :key="index"
                        >
                          <div v-if="index < 10">
                            <a-extended
                              :href="
                                reactionLink(reactionKnockin.id, design.method)
                              "
                              class="link"
                              target="_blank"
                            >
                              {{ reactionKnockin.id }}
                            </a-extended>
                          </div>
                          <div
                            v-if="index >= 10"
                            :hidden="!showAllReactionKnockins"
                          >
                            <a-extended
                              :href="
                                reactionLink(reactionKnockin.id, design.method)
                              "
                              class="link"
                              target="_blank"
                            >
                              {{ reactionKnockin.id }}
                            </a-extended>
                          </div>
                        </div>
                        <div v-if="design.design.reactionKnockins.length > 10">
                          <a-extended
                            @click="showAllReactionKnockins = true"
                            :hidden="showAllReactionKnockins"
                          >
                            ...
                          </a-extended>
                        </div>
                      </div>
                    </td>
                    <td width="15%">
                      <div class="link-list">
                        <div
                          v-for="(reactionKnockout, index) in design.design
                            .reactionKnockouts"
                          :key="index"
                        >
                          <div v-if="index < 10">
                            <a-extended
                              :href="
                                reactionLink(reactionKnockout.id, design.method)
                              "
                              class="link"
                              target="_blank"
                            >
                              {{ reactionKnockout.id }}
                            </a-extended>
                          </div>
                          <div
                            v-if="index >= 10"
                            :hidden="!showAllReactionKnockouts"
                          >
                            <a-extended
                              :href="
                                reactionLink(reactionKnockout.id, design.method)
                              "
                              class="link"
                              target="_blank"
                            >
                              {{ reactionKnockout.id }}
                            </a-extended>
                          </div>
                        </div>
                        <div v-if="design.design.reactionKnockouts.length > 10">
                          <a-extended
                            @click="showAllReactionKnockouts = true"
                            :hidden="showAllReactionKnockouts"
                          >
                            ...
                          </a-extended>
                        </div>
                      </div>
                    </td>
                    <td width="15%">
                      <div class="link-list">
                        <div
                          v-for="(geneKnockout, index) in design.design
                            .geneKnockouts"
                          :key="index"
                        >
                          <div v-if="index < 10">
                            <a-extended
                              :href="
                                `http://bigg.ucsd.edu/search?query=${geneKnockout.id}`
                              "
                              class="link"
                              target="_blank"
                            >
                              {{ geneKnockout.id }}
                            </a-extended>
                          </div>
                          <div
                            v-if="index >= 10"
                            :hidden="!showAllGeneKnockouts"
                          >
                            <a-extended
                              :href="
                                `http://bigg.ucsd.edu/search?query=${geneKnockout.id}`
                              "
                              class="link"
                              target="_blank"
                            >
                              {{ geneKnockout.id }}
                            </a-extended>
                          </div>
                        </div>
                        <div v-if="design.design.geneKnockouts.length > 10">
                          <a-extended
                            @click="showAllGeneKnockouts = true"
                            :hidden="showAllGeneKnockouts"
                          >
                            ...
                          </a-extended>
                        </div>
                      </div>
                    </td>
                  </template>
                </v-data-table>
              </template>
            </v-data-table>
          </div>
        </v-flex>
      </v-layout>
    </v-container>
    <v-container fluid fill-height class="overlay" v-if="isVisualizing">
      <v-layout align-center justify-center>
        <v-progress-circular
          indeterminate
          size="40"
          :width="2"
          class="mr-2"
          color="white"
        ></v-progress-circular>
        <p class="display-1 white--text mb-0">Visualizing...</p>
      </v-layout>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapGetters } from "vuex";
import uuidv4 from "uuid/v4";
import { orderBy } from "lodash";
import { Card } from "@/store/modules/interactiveMap";
import { DesignItem } from "@/store/modules/designs";

export default Vue.extend({
  name: "Designs",
  data: () => ({
    selected: [],
    expand: true,
    showAllReactionKnockins: false,
    showAllReactionKnockouts: false,
    showAllGeneKnockouts: false,
    isDeletionDialogVisible: false,
    isDeleting: false,
    isLoading: true,
    pagination: {
      rowsPerPage: 10,
      sortBy: "name"
    },
    headers: [
      { value: "name", align: "left" },
      { value: "organismId", align: "left" },
      { value: "modelId", align: "left" },
      { value: "reactionKnockins", align: "left" },
      { value: "reactionKnockouts", align: "left" },
      { value: "geneKnockouts", align: "left" }
    ],
    isVisualizing: false
  }),
  computed: {
    designs(): DesignItem[] {
      return this.$store.state.designs.designs;
    },
    ...mapGetters({
      model: "models/getModelById",
      organism: "organisms/getOrganismById"
    })
  },
  created() {
    this.$store.state.designs.designsPromise.then(() => {
      this.isLoading = false;
    });
  },
  methods: {
    customSort(items: DesignItem[], index: string, isDesc: boolean) {
      return orderBy(
        items,
        (item: DesignItem) => {
          if (
            index === "reactionKnockins" ||
            index === "reactionKnockouts" ||
            index === "geneKnockouts"
          ) {
            return item["design"][index].length;
          }
          if (index === "organismId") {
            return this.organism(this.model(item.model_id).organism_id).name;
          }
          return item[index];
        },
        isDesc ? "desc" : "asc"
      );
    },
    reactionLink(reactionId, method) {
      if (reactionId.startsWith("MNX")) {
        return `https://www.metanetx.org/equa_info/${reactionId}`;
      }
      return `http://bigg.ucsd.edu/search?query=${reactionId}`;
    },
    toggleLoader() {
      this.isDeleting = !this.isDeleting;
    },
    toggleAll() {
      if (this.selected.length) {
        this.selected = [];
      } else {
        this.selected = [...this.designs];
      }
    },
    changeSort(column) {
      if (this.pagination.sortBy === column) {
        this.pagination.descending = !this.pagination.descending;
      } else {
        this.pagination.sortBy = column;
        this.pagination.descending = false;
      }
    },
    visualize() {
      this.isVisualizing = true;
      this.selected.forEach(design => {
        // Remove any existing cards from the store that are related to the same
        // design.
        this.$store.state.interactiveMap.cards.forEach(card => {
          if (card.designId === design.id) {
            this.$store.commit("interactiveMap/removeCard", card);
          }
        });

        const card: Card = {
          uuid: uuidv4(),
          name: design.name,
          designId: design.id,
          organism: this.organism(this.model(design.model_id).organism_id),
          modelId: design.model_id,
          method: "pfba",
          modified: false,
          type: "Design",
          objective: {
            reaction: null,
            maximize: true
          },
          reactionDeletions: [], // user cannot remove a reaction
          reactionAdditions: design.design.reactionKnockins,
          reactionKnockouts: design.design.reactionKnockouts,
          geneKnockouts: design.design.geneKnockouts,
          editedBounds: design.design.constraints,
          // Data-driven card fields
          experiment: null,
          conditionData: null,
          sample: null,
          sampleWarnings: [],
          sampleErrors: [],
          showProteomicsData: false,
          // General simulation fields
          isSimulating: false,
          hasSimulationError: false,
          solverStatus: null,
          growthRate: null,
          fluxes: null,
          withDialog: false,
          // Specific fields for design prediction methods
          manipulations: null,
          productionGrowthRate: null,
          showDiffFVAScore: false,
          enzymeUsageThreshold: 90
        };
        // Make sure the full model is available before adding the card.
        this.$store
          .dispatch("models/withFullModel", design.model_id)
          .then(() => {
            this.$store.commit("interactiveMap/addCard", card);
            this.$router.push({ name: "interactiveMap" });
          });
      });
      this.$store.dispatch("analytics/sendToVisualize", {
        ids: this.selected.map(design => design.id),
        type: "design"
      });
    },
    onDeletion(ids) {
      // Remove any cards from the store that belongs to any of the deleted
      // designs. These cards will exist in the store if previously visualized.
      this.$store.state.interactiveMap.cards.forEach(card => {
        if (card.designId && ids.includes(card.designId)) {
          this.$store.commit("interactiveMap/removeCard", card);
        }
      });
    }
  }
});
</script>

<style scoped>
.hidden {
  visibility: hidden;
}
.link {
  text-decoration: none;
}
.link-list {
  max-height: 200px;
  overflow-y: auto;
}
.table-buttons {
  width: 100%;
}
.expandable-row {
  cursor: pointer;
}
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.15);
}
</style>
