<template>
  <v-container>
    <v-layout justify-center>
      <v-flex md6>
        <h1>Maps</h1>
        <v-data-table
          :footer-props="showFirstLastPage"
          :headers="headers"
          :items="maps"
          class="elevation-8"
          :pagination.sync= "pagination"
        >
          <template v-slot:items="props">
          <td>{{ props.item.name }}</td>
          <td>{{ props.item.model_id }}</td>
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
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "Maps",
  data: () => ({
    headers: [
          {
            text: 'Name',
            align: 'left',
            value: 'name'
          },
          { text: 'Model', value: 'model' },
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
    maps() {
      return this.$store.state.maps.maps
    }

  }
});
</script>
