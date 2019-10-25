<template>
  <div>
    <v-text-field
      label="Protein"
      v-model="searchQuery"
      :loading="isLoading"
      :hint="hint()"
      persistent-hint
      :append-outer-icon="protein ? 'info' : ''"
      :rules="[requestErrorRule(requestError), ...(rules || [])]"
      @click:append-outer="dialog = true"
      @paste="$emit('paste', $event)"
    ></v-text-field>
    <v-dialog v-model="dialog" width="500">
      <v-card v-if="protein">
        <v-card-title
          class="headline primary lighten-2 white--text"
          primary-title
        >
          {{ protein.identifier }}
        </v-card-title>

        <v-card-text>
          <table class="protein-table">
            <tr>
              <th>Name</th>
              <td>{{ protein.name }}</td>
            </tr>
            <tr>
              <th>Identifier</th>
              <td>{{ protein.identifier }}</td>
            </tr>
            <tr>
              <th>Gene</th>
              <td>{{ protein.gene }}</td>
            </tr>
            <tr>
              <th>External link</th>
              <td>
                <a
                  :href="
                    `https://www.uniprot.org/uniprot/${protein.identifier}`
                  "
                  target="_blank"
                  >Open in UniProtKB</a
                >
              </td>
            </tr>
          </table>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" flat @click="dialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { debounce } from "lodash";

export default Vue.extend({
  name: "UniprotInput",
  props: {
    rules: [Array, Object],
    forceSearchQuery: String
  },
  data: () => ({
    debouncedQuery: null,
    searchQuery: "",
    isLoading: false,
    requestError: false,
    requestErrorRule: error =>
      !error ||
      "Could not query UniProtKB. Their service or your internet connection might be down.",
    protein: null,
    dialog: false
  }),
  computed: {},
  created() {
    this.debouncedQuery = debounce(this.query, 500);
  },
  watch: {
    forceSearchQuery: {
      // Watcher needs to be immediate to trigger when copy-paste creates
      // new rows with forceSearchQuery already set
      immediate: true,
      handler() {
        if (!this.forceSearchQuery) {
          return;
        }
        this.searchQuery = this.forceSearchQuery;
      }
    },
    searchQuery: {
      // Watcher needs to be immediate to trigger when copy-paste creates
      // new rows with forceSearchQuery already set
      immediate: true,
      handler() {
        // Reset state
        this.protein = null;
        this.requestError = false;
        this.$emit("change", this.protein);
        // For empty query; no need to make request
        if (!this.searchQuery) {
          return;
        }
        // Pretend we already started searching, even though it's debounced
        this.isLoading = true;
        // Note: Didn't yet implement cancelling stale requests here. Should
        // rarely results in wrong response order though, because of the 500ms
        // debounce.
        // Note 2: Needs to happen during next tick, since `created` lifecycle
        // event hasn't occurred when this watcher triggers immediately.
        this.$nextTick(() => {
          this.debouncedQuery(this.searchQuery);
        });
      }
    }
  },
  methods: {
    hint() {
      if (this.protein) {
        return `${this.protein.identifier} (${this.protein.name})`;
      } else {
        return `Enter any valid <a href="https://www.uniprot.org/uniprot/" target="_blank">UniProtKB identifier</a>.`;
      }
    },
    query(identifier: string) {
      axios
        .get(`https://www.uniprot.org/uniprot/${identifier}.xml`)
        .then(response => {
          // Parse the XML response, looking for name, identifier and gene.
          const doc = new DOMParser().parseFromString(
            response.data,
            "text/xml"
          );
          const name = doc.querySelector(
            "entry > protein > recommendedName > fullName"
          );
          const identifier = doc.querySelector("entry > name");
          const gene = doc.querySelector("entry > gene > name[type='primary']");
          this.protein = {
            name: name ? name.innerHTML : "Unknown",
            identifier: identifier ? identifier.innerHTML : "Unknown",
            gene: gene ? gene.innerHTML : "Unknown"
          };
          this.$emit("change", this.protein);
        })
        .catch(error => {
          if (error.response && error.response.status === 404) {
            // Not found - no need to take action; since `this.protein` is
            // already null and will not pass validation.
          } else {
            this.requestError = true;
          }
        })
        .then(() => {
          this.isLoading = false;
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.protein-table {
  width: 100%;

  th {
    text-align: left;
  }
}
</style>
