<template>
  <v-container>
    <v-layout justify-center>
      <v-flex md6>
        <h1>Models</h1>
        <v-data-table
          :headers="headers"
          :items="models"
          class="elevation-8"
          :pagination.sync= "pagination"
        >
          <template v-slot:items="props">
          <td>{{ props.item.name }}</td>
          <td>
            <v-icon
              @click="editItem(props.item)"
            >
              edit
            </v-icon>
            <v-icon
              @click="deleteItem(props.item)"
            >
              delete
            </v-icon>
          </td>
        </template>
        </v-data-table>
        <v-btn
          fixed
          fab
          bottom
          right
          large
          color='secondary'
          @click="$store.commit('toggleDialog', 'model')"
        >
          <v-icon>add</v-icon>
        </v-btn> 
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "Models",
  data: () => ({
    headers: [
          {
            text: 'Name',
            align: 'left',
            value: 'name'
          },
          { text: 'Actions', value: 'name', sortable: false }
        ],
    pagination: {
      rowsPerPage: 10
    },
  }),
  methods: {},
  computed: {
    isAuthenticated() {
      return this.$store.state.session.isAuthenticated;
    },
    models() {
      return this.$store.state.models.models
    }

  }
});
</script>
