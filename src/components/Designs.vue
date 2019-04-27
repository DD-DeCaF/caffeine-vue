<template>
  <v-container>
    <v-layout justify-center>
      <v-flex>
        <h1 class="mb-1">Designs</h1>
        <v-btn flat color="primary" :disabled="selected.length < 1"
          ><v-icon>share</v-icon>VISUALIZE</v-btn
        >
        <v-btn flat color="primary" :disabled="selected.length < 1"
          ><v-icon>delete</v-icon>DELETE</v-btn
        >
        <v-data-table
          v-model="selected"
          :headers="headers"
          :items="designs"
          :expand="expand"
          select-all="primary"
          class="elevation-8"
        >
          <template v-slot:items="props">
            <tr @click="props.expanded = !props.expanded">
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
          <template v-slot:expand="props">
            <v-card flat>
              <v-card-text>Expanded row</v-card-text>
            </v-card>
          </template>
        </v-data-table>
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
    headers: [
      { text: "Name", value: "name", width: "20%" },
      { text: "Organism", value: "organism_id", width: "15%" },
      { text: "Model", value: "model_id", width: "15%" },
      { text: "Added reactions", value: "reactions_knockins", width: "15%" },
      { text: "Reaction knockouts", value: "reaction_knockouts", width: "15%" },
      { text: "Gene knockouts", value: "gene_knockouts", width: "15%" }
    ],
    pagination: {
      rowsPerPage: 10
    }
  }),
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
