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
            <v-tooltip bottom :disabled="isAuthenticated">
            <span> {{ $store.state.commonTooltipMessages.unauthorized }} </span>
            <v-icon
              slot="activator"
              @click="editItem(props.item)"
              :disabled="!isAuthenticated"
              v-bind:style="styleObject"
            >
              edit
            </v-icon>
            </v-tooltip>
            <v-tooltip bottom :disabled="isAuthenticated">
            <span> {{ $store.state.commonTooltipMessages.unauthorized }} </span>
            <v-icon
              slot="activator"
              @click="deleteItem(props.item)"
              :disabled="!isAuthenticated"
              v-bind:style="styleObject"
            >
              delete
            </v-icon>
            </v-tooltip>
          </td>
        </template>
        </v-data-table>
         <v-tooltip bottom :disabled="isAuthenticated">
          <span> {{ $store.state.commonTooltipMessages.unauthorized }} </span>
        <v-btn
          slot="activator"
          fixed
          fab
          bottom
          right
          large
          :disabled="!isAuthenticated"
          @click="$store.commit('toggleDialog', 'model')"
          color='secondary'
          v-bind:style="styleObject"
        >
          <v-icon>add</v-icon>
        </v-btn>
        </v-tooltip>
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
    show: false,
    // Vuitify disables all pointer events on disabled objects.
    // https://stackoverflow.com/questions/51826891/how-do-i-enable-tooltips-on-a-disabled-text-field-in-vuetify
    // This style object is what we use to re-enable them so that the tooltip can be triggered on a disabled button.
    styleObject: {
      'pointer-events': "auto"
    }
  }),
  methods: {
  },
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
