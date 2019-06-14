<template>
  <v-dialog v-model="showDialog" width="500">
    <v-card class="pa-3">
      <v-container grid-list-lg>
        <v-layout column wrap>
          <v-flex md6>
            <h3>Add a new metabolite</h3>
          </v-flex>
          <v-flex>
            <v-form ref="form" v-model="isValid" @keyup.native.enter="onEnter">
              <v-text-field
                v-model="metabolite.name"
                :rules="[rules.required]"
                name="name"
                label="Name"
                type="text"
              ></v-text-field>
              <v-text-field
                v-model="metabolite.id"
                :rules="[rules.required]"
                name="id"
                label="Id"
                type="text"
              ></v-text-field>
            </v-form>
          </v-flex>
        </v-layout>
      </v-container>

      <v-divider class="my-2"></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="secondary" flat @click="showDialog = false">
          Cancel
        </v-btn>
        <v-btn color="primary" @click="addMetabolite" :disabled="!isValid">
          Add
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Reaction } from "@/store/modules/interactiveMap";

export default Vue.extend({
  name: "MetaboliteDialog",
  props: ["value"],
  data: () => ({
    rules: {
      required: value => !!value || "Required"
    },
    isValid: true,
    metabolite: {
      id: null,
      name: null
    }
  }),
  computed: {
    showDialog: {
      get() {
        return this.value;
      },
      set(value) {
        this.$refs.form.reset();
        this.$emit("input", value);
      }
    }
  },
  methods: {
    addMetabolite() {
      this.$emit("return-object", {
        id: this.metabolite.id,
        name: this.metabolite.name
      });
      this.showDialog = false;
    },
    onEnter() {
      if (this.$refs.form.validate()) {
        this.addMetabolite();
      }
    }
  }
});
</script>
