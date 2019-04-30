<template>
  <v-container>
    <EditMap
      v-model="isMapEditDialogVisible"
      :mapItem="selectedMapItem"
      :mapItemIndex="maps.indexOf(selectedMapItem)"
    />
    <DeletionDialog
      v-model="isDeletionDialogVisible"
      :items="[selectedMapItem]"
      itemsType="maps"
      @toggleLoader="toggleLoader()"
    />
    <v-layout justify-center>
      <v-flex md6>
        <h1>Maps</h1>
        <v-data-table
          :headers="headers"
          :items="maps"
          class="elevation-8"
          :pagination.sync= "pagination"
        >
          <template v-slot:items="props">
          <td>{{ props.item.name }}</td>
          <td>{{ model(props.item.model_id).name }} </td>
          <td>
            <v-tooltip bottom :disabled="isAuthenticated && props.item.project_id !== null">
            <div v-if="!isAuthenticated">
              <span> {{ $store.state.commonTooltipMessages.unauthenticated }} </span>
            </div>
            <div v-else-if="props.item.project_id === null">
              <span> {{ $store.state.commonTooltipMessages.publicData }} </span>
            </div>
            <v-icon
              slot="activator"
              @click="editItem(props.item)"
              :disabled="!isAuthenticated || props.item.project_id === null"
              v-bind:style="styleObject"
            >
              edit
            </v-icon>
            </v-tooltip>
            <v-tooltip bottom :disabled="isAuthenticated && props.item.project_id !== null">
            <div v-if="!isAuthenticated">
              <span> {{ $store.state.commonTooltipMessages.unauthenticated }} </span>
            </div>
            <div v-else-if="props.item.project_id === null">
              <span> {{ $store.state.commonTooltipMessages.publicData }} </span>
            </div>
            <v-icon
              slot="activator"
              @click="deleteItem(props.item)"
              :disabled="!isAuthenticated || props.item.project_id === null"
              v-bind:style="styleObject"
            >
              delete
            </v-icon>
            </v-tooltip>
          </td>
        </template>
        </v-data-table>
           <v-tooltip bottom :disabled="isAuthenticated">
          <span> {{ $store.state.commonTooltipMessages.unauthenticated }} </span>
        <v-btn
          slot="activator"
          fixed
          fab
          bottom
          right
          large
          :disabled="!isAuthenticated"
          @click="$store.commit('toggleDialog', 'map')"
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
import { mapGetters } from 'vuex';
import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";

export default Vue.extend({
  name: "Maps",
  data: () => ({
    selectedMapItem: {id: null, name: null, model_id: null, project_id: null},
    isMapEditDialogVisible: false,
    isDeletionDialogVisible: false,
    headers: [
          {
            text: 'Name',
            align: 'left',
            value: 'name'
          },
          { text: 'Model', value: 'model_id' },
          { text: 'Actions', value: 'name', sortable: false }
        ],
    pagination: {
      rowsPerPage: 10
    },
    // Vuitify disables all pointer events on disabled objects.
    // https://stackoverflow.com/questions/51826891/how-do-i-enable-tooltips-on-a-disabled-text-field-in-vuetify
    // This style object is what we use to re-enable them so that the tooltip can be triggered on a disabled button.
    styleObject: {
      'pointer-events': "auto"
    }
  }),
  methods: {
    editItem(item) {
      this.selectedMapItem = item;
      this.isMapEditDialogVisible = true
    },
     deleteItem(item) {
      this.selectedMapItem = item;
      this.isDeletionDialogVisible = true
    }
  },
  computed: {
    isAuthenticated() {
      return this.$store.state.session.isAuthenticated;
    },
    maps() {
      return this.$store.state.maps.maps
    },
    ...mapGetters({
      model: "models/getModelById"
    })
  }
});
</script>
