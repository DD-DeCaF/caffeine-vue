<template>
  <v-container>
    <v-layout justify-center>
      <v-flex md10>
        <h1 class="mb-2">Designs</h1>
        <div class="elevation-8">
          <v-list class="table-buttons">
            <v-list-tile>
              <v-layout justify-end>
                <v-btn flat color="primary" :disabled="selected.length < 1"
                  ><v-icon>share</v-icon>VISUALIZE</v-btn
                >
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
                  /><v-icon>delete</v-icon>DELETE</v-btn
                >
              </v-layout>
            </v-list-tile>
          </v-list>
          <v-data-table
            v-model="selected"
            :headers="headers"
            :items="designs"
            :expand="expand"
            :pagination.sync="pagination"
            :custom-sort="customSort"
            :loading="isLoading"
            select-all="primary"
          >
            <v-progress-linear
              v-slot:progress
              color="primary"
            ></v-progress-linear>
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
                <td>
                  {{ organism(model(props.item.model_id).organism_id).name }}
                </td>
                <td>{{ model(props.item.model_id).name }}</td>
                <td>{{ props.item.design.reaction_knockins.length }}</td>
                <td>{{ props.item.design.reaction_knockouts.length }}</td>
                <td>{{ props.item.design.gene_knockouts.length }}</td>
              </tr>
            </template>
            <template v-slot:expand="{ item: design }">
              <tr>
                <td>
                  <v-checkbox hide-details class="hidden"></v-checkbox>
                </td>
                <td align="rigth" width="20%">Name</td>
                <td align="rigth" width="15%">Organism</td>
                <td align="rigth" width="15%">Model</td>
                <td align="rigth" width="15%">
                  <div class="link-list">
                    <div
                      v-for="(reactionKnockin, index) in design.design
                        .reaction_knockins"
                      :key="index"
                    >
                      <div v-if="index < 10">
                        <a
                          :href="
                            reactionLink(reactionKnockin, design.method, true)
                          "
                          class="link"
                          target="_blank"
                        >
                          {{ getReactionId(reactionKnockin, design.method) }}
                        </a>
                      </div>
                      <div
                        v-if="index >= 10"
                        :hidden="!showAllReactionKnockins"
                      >
                        <a
                          :href="
                            reactionLink(reactionKnockin, design.method, true)
                          "
                          class="link"
                          target="_blank"
                        >
                          {{ getReactionId(reactionKnockin, design.method) }}
                        </a>
                      </div>
                    </div>
                    <div v-if="design.design.reaction_knockins.length > 10">
                      <a
                        @click="showAllReactionKnockins = true"
                        :hidden="showAllReactionKnockins"
                      >
                        ...
                      </a>
                    </div>
                  </div>
                </td>

                <td align="rigth" width="15%">
                  <div class="link-list">
                    <div
                      v-for="(reactionKnockout, index) in design.design
                        .reaction_knockouts"
                      :key="index"
                    >
                      <div v-if="index < 10">
                        <a
                          :href="
                            reactionLink(reactionKnockout, design.method, false)
                          "
                          class="link"
                          target="_blank"
                        >
                          {{ reactionKnockout }}
                        </a>
                      </div>
                      <div
                        v-if="index >= 10"
                        :hidden="!showAllReactionKnockouts"
                      >
                        <a
                          :href="
                            reactionLink(reactionKnockout, design.method, false)
                          "
                          class="link"
                          target="_blank"
                        >
                          {{ reactionKnockout }}
                        </a>
                      </div>
                    </div>
                    <div v-if="design.design.reaction_knockouts.length > 10">
                      <a
                        @click="showAllReactionKnockouts = true"
                        :hidden="showAllReactionKnockouts"
                      >
                        ...
                      </a>
                    </div>
                  </div>
                </td>

                <td align="rigth" width="15%">
                  <div class="link-list">
                    <div
                      v-for="(geneKnockout, index) in design.design
                        .gene_knockouts"
                      :key="index"
                    >
                      <div v-if="index < 10">
                        <a
                          :href="
                            `http://bigg.ucsd.edu/search?query=${geneKnockout}`
                          "
                          class="link"
                          target="_blank"
                        >
                          {{ geneKnockout }}
                        </a>
                      </div>
                      <div v-if="index >= 10" :hidden="!showAllGeneKnockouts">
                        <a
                          :href="
                            `http://bigg.ucsd.edu/search?query=${geneKnockout}`
                          "
                          class="link"
                          target="_blank"
                        >
                          {{ geneKnockout }}
                        </a>
                      </div>
                    </div>
                    <div v-if="design.design.gene_knockouts.length > 10">
                      <a
                        @click="showAllGeneKnockouts = true"
                        :hidden="showAllGeneKnockouts"
                      >
                        ...
                      </a>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </v-data-table>
        </div>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { mapGetters } from "vuex";

export default Vue.extend({
  name: "Designs",
  data: () => ({
    selected: [],
    expand: true,
    showAllReactionKnockins: false,
    showAllReactionKnockouts: false,
    showAllGeneKnockouts: false,
    isDeletionDialogVisible: false,
    isLoading: false,
    headers: [
      { text: "Name", value: "name", width: "20%" },
      { text: "Organism", value: "organism_id", width: "15%" },
      { text: "Model", value: "model_id", width: "15%" },
      { text: "Added reactions", value: "reaction_knockins", width: "15%" },
      { text: "Reaction knockouts", value: "reaction_knockouts", width: "15%" },
      { text: "Gene knockouts", value: "gene_knockouts", width: "15%" }
    ],
    pagination: {
      rowsPerPage: 10
    }
  }),
  methods: {
    customSort(items, index, isDesc) {
      items.sort((a, b) => {
        if (
          index === "reaction_knockins" ||
          index === "reaction_knockouts" ||
          index === "gene_knockouts"
        ) {
          if (!isDesc) {
            return a["design"][index].length - b["design"][index].length;
          }
          return b["design"][index].length - a["design"][index].length;
        }
        if (index === "organism_id") {
          if (!isDesc) {
            return this.organism(this.model(a.model_id).organism_id).name <
              this.organism(this.model(b.model_id).organism_id).name
              ? -1
              : 1;
          }
          return this.organism(this.model(b.model_id).organism_id).name <
            this.organism(this.model(a.model_id).organism_id).name
            ? -1
            : 1;
        }
        if (!isDesc) {
          return a[index] < b[index] ? -1 : 1;
        }
        return b[index] < a[index] ? -1 : 1;
      });
      return items;
    },
    getReactionId(reaction, method) {
      if (method === "Pathway") {
        return JSON.parse(reaction).bigg_id;
      }
      return reaction;
    },
    reactionLink(reaction, method, isReactionKnockin) {
      const reactionId =
        isReactionKnockin && method === "Pathway"
          ? JSON.parse(reaction).bigg_id
          : reaction;
      if (reactionId.startsWith("MNX")) {
        return `https://www.metanetx.org/equa_info/${reactionId}`;
      }
      return `http://bigg.ucsd.edu/search?query=${reactionId}`;
    },
    toggleLoader() {
      this.isLoading = !this.isLoading;
    }
  },
  computed: {
    designs() {
      return this.$store.state.designs.designs;
    },
    ...mapGetters({
      model: "models/getModelById",
      organism: "organisms/getOrganismById"
    })
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
</style>
