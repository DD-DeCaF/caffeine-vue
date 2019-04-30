<template>
  <div>
    <v-dialog v-model="isDialogVisible" max-width="500px">
      <v-card class="text-xs-center pa-3">
        <v-icon large color="warning" class="warning-icon">warning</v-icon>
        <v-card-text class="headline"
          >Are you sure you want to delete
          <span v-for="(item, index) in items" :key="index">
            <span v-if="index === 0"
              ><em>{{ item.name }}</em></span
            >
            <span v-if="index > 0"
              ><em>,&nbsp;{{ item.name }}</em></span
            > </span
          >?</v-card-text
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            flat="flat"
            @click.stop="isDialogVisible = false"
          >
            Cancel
          </v-btn>
          <v-btn color="primary" flat="flat" @click.stop="deleteItem()">
            Yes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar color="success" v-model="isItemDeletionSuccess" :timeout="3000">
      {{ itemsType }} deleted.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";

export default Vue.extend({
  name: "DeletionDialog",
  data: () => ({
    isItemDeletionSuccess: false
  }),
  props: {
    value: {
      type: Boolean,
      required: true
    },
    items: {
      required: true
    },
    itemsType: {
      type: String,
      required: true,
      validator: (value: string) =>
        ["designs", "maps", "models", "projects"].includes(value)
    }
  },
  methods: {
    deleteItem() {
      this.$emit("toggleLoader");
      this.isDialogVisible = false;

      const storage = {
        designs: "designStorage",
        maps: "maps",
        models: "modelsStorage",
        projects: "iam"
      }[this.itemsType];

      const ids = this.items.map(item => item.id);
      axios
        .all(
          this.items.map(item =>
            axios.delete(
              `${settings.apis[storage]}/${this.itemsType}/${item.id}`
            )
          )
        )
        .then(response => {
          this.isItemDeletionSuccess = true;
          this.$store.commit(`${this.itemsType}/delete`, ids);
        })
        .catch(error => {
          this.$store.commit("setDeleteError", error);
        })
        .then(() => {
          this.$emit("toggleLoader");
        });
    }
  },
  computed: {
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
