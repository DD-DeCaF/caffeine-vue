<template>
  <div>
    <v-dialog v-model="isDialogVisible" full-width>
      <v-card class="pa-4">
        <div class="display-1 mb-2">Conditions</div>
        <v-btn color="primary" small>
          Add row
        </v-btn>
        <v-data-table
          :headers="headers"
          :items="conditions"
          :pagination.sync="pagination"
        >
          <template v-slot:items="{ item: condition }">
            <td>
              <v-edit-dialog :return-value.sync="condition.name">
                {{ condition.name }}
                <template v-slot:input>
                  <v-text-field v-model="condition.name"></v-text-field>
                </template>
              </v-edit-dialog>
            </td>
            <td>
              <v-autocomplete-extended
                return-object
                item-text="name"
                item-value="id"
                v-model="condition.strain"
                :items="availableStrains"
                name="strain"
                label="Strain"
                type="text"
              >
                <template v-slot:prepend-item>
                  <v-btn
                    flat
                    @click.stop="isNewStrainDialogVisible = true"
                    class="pl-0"
                  >
                    <v-icon class="mr-4" color="primary">add_circle</v-icon>
                    New Strain
                  </v-btn>
                  <v-divider class="my-2"></v-divider>
                </template>
              </v-autocomplete-extended>
            </td>
            <!-- <td class="text-xs-right">{{ props.item.medium }}</td>
            <td class="text-xs-right">{{ props.item.date }}</td> -->
          </template>
        </v-data-table>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" flat @click="isDialogVisible = false">
            Cancel
          </v-btn>
          <v-btn color="primary">
            Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "NewExperiment",
  props: {
    value: {
      type: Boolean,
      required: true
    }
  },
  data: () => ({
    conditions: [{}],
    isNewStrainDialogVisible: false,
    headers: [
      { text: "Name", value: "name" },
      { text: "Strain", value: "strain" },
      { text: "Medium", value: "medium" },
      { text: "Date", value: "date" }
    ],
    pagination: {
      rowsPerPage: 10
    }
  }),
  computed: {
    availableStrains() {
      return this.$store.state.strains.strains;
    },
    isDialogVisible: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("input", value);
      }
    }
  }
});
</script>
