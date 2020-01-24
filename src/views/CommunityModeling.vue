<template>
    <div class='interactive-map fill-height'>
    <v-container>
    <h1>Some test results go here</h1>
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
    </v-container>
    <v-navigation-drawer
    v-model="isSidepanelOpen"
    right
    absolute
    hide-overlay
    class="elevation-6"
    >
        <v-container class="py-1">
            <v-select
            :items='media'
            label="Selected Medium"
            autofocus
            item-text="name"
            item-value="id"
            v-model="defaultMedium"
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
                :rules="[v => !!v || 'Please choose at least one metabolic model.']"
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

            <v-btn
            :loading="isUpdating"
            color="primary"
            depressed
            @click="isUpdating = true"
            >
          <v-icon left>update</v-icon>
          Simulate Now
        </v-btn>
        </v-container>
    </v-navigation-drawer>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import * as settings from "@/utils/settings";
import { mapGetters } from "vuex";
import { partitionedList } from "@/utils/utility";

export default Vue.extend({
  name: "CommunityModeling",
  components: {
  },
  data: () => ({
    isUpdating: false,
    selectedModels:[],
    defaultMedium:{'id':1},
    isSidepanelOpen: true,
    media: [{'id':1, 'name':"M9 Glucose", 'componentIDs':[1,2,3,4,5]}]
  }),
  computed: {
    models() {
    return partitionedList("models", "organisms");
    },
    availableModels() {
      return this.$store.state.models.models;
    },
    ...mapGetters({
      organism: "organisms/getOrganismById"
    })
  },
  mounted() {
  },
  methods: {
    remove (item) {
    const index = this.selectedModels.indexOf(item.id)
    if (index >= 0) { this.selectedModels.splice(index, 1) }
    }
  }
});
</script>

<style scoped>
.sidepanel-toggle {
  position: absolute;
}
</style>

