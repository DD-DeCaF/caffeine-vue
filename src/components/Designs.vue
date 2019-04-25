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
          select-all
          class="elevation-8"
          :pagination.sync="pagination"
        >
          <template v-slot:items="props">
            <td>
              <v-checkbox
                v-model="props.selected"
                primary
                hide-details
              ></v-checkbox>
            </td>
            <td>{{ props.item.name }}</td>
            <td>{{ props.item.model_id }}</td>
            <td>{{ model(props.item.model_id).name }}</td>
            <td>{{ props.item.design.reaction_knockins.length }}</td>
            <td>{{ props.item.design.reaction_knockouts.length }}</td>
            <td>{{ props.item.design.gene_knockouts.length }}</td>
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { mapGetters } from 'vuex'

export default Vue.extend({
  name: "Designs",
  data: () => ({
    selected: [],
    headers: [
      { text: "Name", value: "name" },
      { text: "Organism", value: "" }, // todo: get organism name
      { text: "Model", value: "model_id" },
      { text: "Added reactions", value: "reaction_knockins" },
      { text: "Reaction knockouts", value: "reaction_knockouts" },
      { text: "Gene knockouts", value: "gene_knockouts" }
    ],
    pagination: {
      rowsPerPage: 10
    }
  }),
  computed: {
    isAuthenticated() {
      return this.$store.state.session.isAuthenticated;
    },
    designs() {
      return this.$store.state.designs.designs;
    },
    ...mapGetters({
      model: "models/getModelById"
    })
  }
});
</script>
