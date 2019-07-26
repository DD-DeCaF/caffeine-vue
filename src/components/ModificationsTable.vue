<template>
  <v-data-table
    hide-actions
    :headers="modificationsHeaders"
    :items="modificationsWithTableKeys"
    item-key="tableKey"
  >
    <template v-slot:items="{ item: { modification } }">
      <!-- Added reaction -->
      <td v-if="modification.type === 'added_reaction'">
        Added reaction
      </td>
      <td v-if="modification.type === 'added_reaction'">
        <span v-if="modification.name">
          {{ modification.name }} ({{ modification.id }})
        </span>
        <v-progress-circular
          v-else
          indeterminate
          size="12"
          :width="1"
        ></v-progress-circular>
      </td>
      <td v-if="modification.type === 'added_reaction'">
        <span
          v-if="modification.reactionString"
          v-html="modification.reactionString"
        />
        <v-progress-circular
          v-else
          indeterminate
          size="12"
          :width="1"
        ></v-progress-circular>
      </td>

      <!-- Reaction knockout -->
      <td v-if="modification.type === 'reaction_knockout'">
        Reaction knockout
      </td>
      <td v-if="modification.type === 'reaction_knockout'">
        <span v-if="modification.name">
          {{ modification.name }} ({{ modification.id }})
        </span>
        <v-progress-circular
          v-else
          indeterminate
          size="12"
          :width="1"
        ></v-progress-circular>
      </td>
      <td v-if="modification.type === 'reaction_knockout'">
        <span
          v-if="modification.reactionString"
          v-html="modification.reactionString"
        />
        <v-progress-circular
          v-else
          indeterminate
          size="12"
          :width="1"
        ></v-progress-circular>
      </td>

      <!-- Gene knockout -->
      <td v-if="modification.type === 'gene_knockout'">
        Gene knockout
      </td>
      <td v-if="modification.type === 'gene_knockout'">
        <span v-if="modification.name">
          {{ modification.name }} ({{ modification.id }})
        </span>
        <v-progress-circular
          v-else
          indeterminate
          size="12"
          :width="1"
        ></v-progress-circular>
      </td>
      <td v-if="modification.type === 'gene_knockout'">
        <span v-if="modification.reactions">
          <p
            class="mb-0"
            v-for="reaction in modification.reactions"
            :key="reaction.id"
          >
            {{ reaction.name }} ({{ reaction.id }})
          </p>
        </span>
        <v-progress-circular
          v-else
          indeterminate
          size="12"
          :width="1"
        ></v-progress-circular>
      </td>

      <!-- Edited bounds -->
      <td v-if="modification.type === 'edited_bounds'">
        Modified bounds
      </td>
      <td v-if="modification.type === 'edited_bounds'">
        {{ modification.name }} ({{ modification.id }})
      </td>
      <td v-if="modification.type === 'edited_bounds'">
        Bounds set from {{ modification.lowerBound }} to
        {{ modification.upperBound }}
      </td>

      <td v-if="!readonly">
        <v-btn flat icon @click="$emit('clear-modification', modification)">
          <v-icon>delete</v-icon>
        </v-btn>
      </td>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "CardDialogDesign",
  props: {
    modifications: [Array, Object],
    readonly: Boolean
  },
  computed: {
    modificationsHeaders() {
      return [
        { text: "Type", value: "type", sortable: false },
        { text: "Identification", value: "id", sortable: false },
        { text: "Details", value: "details", sortable: false },
        ...(this.readonly
          ? []
          : [{ text: "Remove", value: "remove", sortable: false }])
      ];
    },
    modificationsWithTableKeys() {
      return this.modifications.map(modification => ({
        tableKey: modification.type + " " + modification.id,
        modification
      }));
    }
  }
});
</script>
