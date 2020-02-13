<template>
  <v-dialog v-model="isDialogVisible" width="1200">
    <v-card>
      <v-card-title class="headline primary white--text" primary-title>
        Experiments
      </v-card-title>

      <v-card-text>
        <p>
          Caffeine allows you to upload and integrate multi-omics experimental
          data.
        </p>
        <h2 class="headline">Tips</h2>
        <br />
        <h3 class="title">Data Upload</h3>
        <p>
          Copying hundreds of rows from spreadsheets is tedious and error-prone.
          That's why we've tried to make it as easy as possible to upload and
          analyze your data with Caffeine.
        </p>
        <p>
          If you have your data in a spreadsheet, you can copy-paste the values
          into the form:
        </p>
        <ol>
          <li>
            In your spreadsheet, select the columns (or entry ranges within the
            columns) of the values you want to copy.
            <br />
            <i>
              Note: Make sure that the rows you have selected in each column
              start at the same data point.
            </i>
          </li>
          <br />
          <li>
            Navigate to the upload form, select an empty field in the column
            where you want to copy-paste the first column.
            <br />
            <i>
              Note: Check that the columns you have selected in the spreadsheet
              are in the same order as the fields in the form.
            </i>
          </li>
          <br />
          <li>
            A dialog will open which will ask you to associate the copy-pasted
            values with a sample. Select the respective sample (the selected
            sample can be changed for individual entries afterwards).
          </li>
          <br />
          <li>
            The entries will be upload. If you're uploading data with
            identifiers (such as proteins, metabolites or reactions), the IDs
            will be looked up and matched.
          </li>
          <br />
          <li>
            In case of an identifier mismatch, the rows will be highlighted and
            will need to be fixed. You can display all mismatches at the
            beginning of the uploaded rows.
          </li>
        </ol>
        <br />
        <h2 class="headline">Concepts</h2>
        <br />
        <p>
          Caffeine uses the following hierarchy to group experimental data:
        </p>
        <p><strong>Experiments > Conditions > Samples > Data Points</strong></p>
        <p>
          <i>
            Example: To make it easier to understand the different concepts,
            let's use the hypothetical example of observing growth of a novel
            <strong>Saccharomyces cerevisae</strong>
            strain under 3 different medium compositions with periodic
            measurements over 72 hours.
          </i>
        </p>
        <h3 class="title">Experiments</h3>
        <p>
          Experiments group all data (including multiple conditions) related to
          an organism of interest.
        </p>
        <p>
          <i>
            Example: In our example, this means that all data we've observed for
            our yeast strain would be entered under a single experiment.
          </i>
        </p>
        <h3 class="title">Conditions</h3>
        <p>
          Conditions group data measured under specific conditions such as
          medium, available gases, heat, etc. When taking multiple samples over
          a period of time, all these samples are still related to a single
          condition.
        </p>
        <p>
          <i>
            Example: In the example, this represents the 3 different medium
            compositions that we expose our novel strain to.
          </i>
        </p>
        <h3 class="title">Samples</h3>
        <p>
          Samples represent all data measured at discrete occasion such as a
          specific point in time. The data could be a single value if we're
          using method that measures only value such as growth rate, or it may
          be all the abundances measured in from the medium.
        </p>
        <p>
          <i>
            Example: Since we are measuring the growth rate at multiple time
            points over 72 hours, each time point would be represented as a
            separate sample.
          </i>
        </p>
        <h3 class="title">Data Point</h3>
        <p>
          Data point is the single measured piece of information (single row in
          the column) that we observed for a specific condition from a specific
          sample. These are the individual rows when integrating your
          experimental data on Caffeine.
        </p>
        <p>
          <i>
            Example: We've observed a specific growth rate for our novel strain
            at a specific timepoint for one of our experimental conditions, and
            this is the data point.
          </i>
        </p>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" flat @click="$emit('close-dialog')">
          I see, thanks!
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "ExperimentHelpDialog",
  props: ["isDialogVisible"],
  watch: {
    isDialogVisible(value) {
      if (!value) {
        this.$emit("close-dialog");
      }
    }
  }
});
</script>
