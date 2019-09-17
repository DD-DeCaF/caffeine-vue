<template>
  <v-dialog v-model="showDialog" width="1200">
    <v-card class="pa-2">
      <v-form>
        <v-container>
          <p class="headline">Modify simulation card</p>

          <v-layout wrap>
            <v-flex xs12 md3>
              <v-text-field
                label="Card name"
                v-model="cardName"
                required
              ></v-text-field>
            </v-flex>
            <v-flex xs12 md3>
              <v-select-extended
                label="Organism"
                :items="organisms"
                v-model="cardOrganism"
                autoselectOnlyOption
                :loading="isLoadingOrganism"
                item-text="name"
                item-value="id"
                :hint="modificationsHint"
                persistent-hint
                :rules="[v => !!v || 'Please choose the organism.']"
                return-object
                @change="onOrganismChange"
              ></v-select-extended>
            </v-flex>
            <v-flex xs12 md3>
              <v-select-extended
                label="Model"
                :items="modelsByOrganism"
                v-model="cardModel"
                autoselectOnlyOption
                item-text="name"
                item-value="id"
                :hint="modificationsHint"
                persistent-hint
                :rules="[v => !!v || 'Please choose the metabolic model.']"
                return-object
                @change="onModelChange"
              ></v-select-extended>
            </v-flex>
            <v-flex xs12 md3>
              <v-select-extended
                label="Method"
                :items="methods"
                v-model="cardMethod"
                autoselectOnlyOption
                item-text="name"
                item-value="id"
                prepend-icon="help"
                @click:prepend="$emit('open-method-help-dialog')"
                @change="$emit('simulate-card')"
              ></v-select-extended>
            </v-flex>
          </v-layout>

          <CardDialogDesign
            v-if="card.type == 'Design'"
            :card="card"
            :model="model"
            :modifications="modifications"
            @simulate-card="$emit('simulate-card')"
          />
          <CardDialogDataDriven
            v-if="card.type == 'DataDriven'"
            :card="card"
            :modifications="modifications"
            @simulate-card="$emit('simulate-card')"
            @simulation-error="$emit('simulation-error')"
            @load-data-error="$emit('load-data-error')"
          />
          <CardDialogDiffFVA
            v-if="card.type == 'DiffFVA'"
            :card="card"
            :modifications="modifications"
            @simulate-card="$emit('simulate-card')"
            @load-data-error="$emit('load-data-error')"
          />
        </v-container>
      </v-form>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-progress-circular
          v-if="card.isSimulating"
          indeterminate
          size="12"
          :width="1"
        ></v-progress-circular>
        <span v-if="card.isSimulating" class="mx-2">
          <em>Simulating...</em>
        </span>
        <v-btn color="primary" @click="showDialog = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { mapMutations } from "vuex";
import axios from "axios";
import * as settings from "@/utils/settings";
import CardDialogDesign from "@/views/InteractiveMap/CardDialogDesign.vue";
import CardDialogDataDriven from "@/views/InteractiveMap/CardDialogDataDriven.vue";
import CardDialogDiffFVA from "@/views/InteractiveMap/CardDialogDiffFVA.vue";
import { ModelItem } from "@/store/modules/models";

export default Vue.extend({
  name: "CardDialog",
  components: {
    CardDialogDesign,
    CardDialogDataDriven,
    CardDialogDiffFVA
  },
  props: ["card", "model", "modifications", "value"],
  data: () => ({
    isLoadingOrganism: false,
    methods: [
      { id: "fba", name: "Flux Balance Analysis (FBA)" },
      { id: "pfba", name: "Parsimonious FBA" },
      { id: "fva", name: "Flux Variability Analysis (FVA)" },
      { id: "pfba-fva", name: "Parsimonious FVA" }
    ]
  }),
  computed: {
    organisms() {
      return this.$store.state.organisms.organisms;
    },
    modelsByOrganism() {
      if (!this.card.organism) {
        return [];
      }
      return this.$store.state.models.models.filter(model => {
        return model.organism_id === this.card.organism.id;
      });
    },
    modificationsHint() {
      if (this.modifications.length > 0) {
        return `Changing this will reset ${
          this.modifications.length
        } modifications`;
      } else {
        return null;
      }
    },
    cardName: {
      get() {
        return this.card.name;
      },
      set(name) {
        this.updateCard({
          uuid: this.card.uuid,
          props: { name: name }
        });
        this.setModified({
          uuid: this.card.uuid,
          modified: true
        });
      }
    },
    cardOrganism: {
      get() {
        return this.card.organism;
      },
      set(organism) {
        this.updateCard({
          uuid: this.card.uuid,
          props: { organism: organism }
        });
      }
    },
    cardModel: {
      get() {
        return this.model;
      },
      set(model: ModelItem) {
        this.updateCard({
          uuid: this.card.uuid,
          props: { modelId: model.id }
        });
      }
    },
    cardMethod: {
      get() {
        return this.card.method;
      },
      set(method) {
        this.updateCard({
          uuid: this.card.uuid,
          props: { method: method }
        });
      }
    },
    showDialog: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("input", value);
      }
    }
  },
  methods: {
    onOrganismChange() {
      // When selected organism is updated, update the selected model
      // correspondingly.
      // TODO: Choose a default preferred model.
      this.updateCard({
        uuid: this.card.uuid,
        props: { modelId: null }
      });
      // Since the model was updated, trigger `onModelChange` to make sure card
      // modifications are reset.
      this.onModelChange();
    },
    onModelChange() {
      // Reset all modifications when the selected model changes.
      // Note: We cannot simply watch `model` with `immediate: true`, because
      // that would reset modifications when cards are added from other
      // components, i.e., when visualizing jobs or designs.
      this.updateCard({
        uuid: this.card.uuid,
        props: {
          objective: {
            reaction: null,
            maximize: true
          },
          reactionDeletions: [],
          reactionAdditions: [],
          reactionKnockouts: [],
          geneKnockouts: [],
          editedBounds: [],
          // Reset simulation results too
          fluxes: null,
          growthRate: null
        }
      });
      this.setModified({
        uuid: this.card.uuid,
        modified: true
      });
      this.$emit("simulate-card");
    },
    setLoadingOrganism(isLoading) {
      this.isLoadingOrganism = isLoading;
    },
    ...mapMutations({
      updateCard: "interactiveMap/updateCard",
      setModified: "interactiveMap/setModified"
    })
  }
});
</script>
