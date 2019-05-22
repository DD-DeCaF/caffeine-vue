import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import { OrganismItem } from "./organisms";
import { ModelItem } from "./models";

export interface Metabolite {
  id: string;
  name: string;
  compartmentId: string;
  stoichiometry: number;
}

export interface Reaction {
  id: string;
  name: string;
  reactionString: string;
  metabolites: Metabolite[];
  lowerBound?: number; // Used when editing bounds
  upperBound?: number; // Used when editing bounds
}

export interface Card {
  uuid: string;
  name: string;
  organism: OrganismItem;
  modelId: number;
  method: string;
  dataDriven: boolean;
  // Design card fields
  objective: {
    reaction: Reaction;
    maximize: boolean;
  };
  reactionAdditions: Reaction[];
  reactionKnockouts: Reaction[];
  geneKnockouts: any[];
  editedBounds: Reaction[];
  // Data-driven card fields
  experiment: any;
  condition: any;
  conditionData: any;
  conditionWarnings: any[];
  conditionErrors: any[];
  // General simulation fields
  isSimulating: boolean;
  hasSimulationError: boolean;
  growthRate: number;
  fluxes: number;
}

export default {
  namespaced: true,
  state: {
    cards: [] as Card[]
  },
  mutations: {
    addCard(state, card) {
      state.cards.push(card);
    },
    removeCard(state, card) {
      state.cards.splice(state.cards.indexOf(card), 1);
    },
    updateCard(state, { uuid, props }) {
      const card = state.cards.find(c => c.uuid === uuid);
      Object.keys(props).forEach(key => {
        Vue.set(card, key, props[key]);
      });
    },
    setObjectiveReaction(state, { uuid, reaction }) {
      state.cards.find(c => c.uuid === uuid).objective.reaction = reaction;
    },
    setObjectiveDirection(state, { uuid, maximize }) {
      state.cards.find(c => c.uuid === uuid).objective.maximize = maximize;
    },
    addReaction(state, { uuid, reaction }) {
      const card = state.cards.find(c => c.uuid === uuid);
      card.reactionAdditions.push(reaction);
    },
    undoAddReaction(state, { uuid, reactionId }) {
      const card = state.cards.find(c => c.uuid === uuid);
      const index = card.reactionAdditions.findIndex(r => r.id === reactionId);
      card.reactionAdditions.splice(index, 1);
    },
    knockoutReaction(state, { uuid, reaction }) {
      state.cards.find(c => c.uuid === uuid).reactionKnockouts.push(reaction);
    },
    updateKnockoutReaction(state, { uuid, reaction }) {
      const card = state.cards.find(c => c.uuid === uuid);
      const index = card.reactionKnockouts.findIndex(r => r.id === reaction.id);
      Vue.set(card.reactionKnockouts, index, reaction);
    },
    undoKnockoutReaction(state, { uuid, reactionId }) {
      const knockouts = state.cards.find(c => c.uuid === uuid)
        .reactionKnockouts;
      knockouts.splice(knockouts.findIndex(k => k.id === reactionId), 1);
    },
    knockoutGene(state, { uuid, gene }) {
      state.cards.find(c => c.uuid === uuid).geneKnockouts.push(gene);
    },
    updateKnockoutGene(state, { uuid, gene }) {
      const card = state.cards.find(c => c.uuid === uuid);
      const index = card.geneKnockouts.findIndex(g => g.id === gene.id);
      Vue.set(card.geneKnockouts, index, gene);
    },
    undoKnockoutGene(state, { uuid, geneId }) {
      const knockouts = state.cards.find(c => c.uuid === uuid).geneKnockouts;
      knockouts.splice(knockouts.findIndex(k => k.id === geneId), 1);
    },
    editBounds(state, { uuid, reaction }) {
      // Add a reaction object with modified bounds.
      const card = state.cards.find(c => c.uuid === uuid);
      card.editedBounds.push(reaction);
    },
    updateEditedBoundsReaction(state, { uuid, reaction }) {
      // Update the reaction data for an edited reaction.
      const card = state.cards.find(c => c.uuid === uuid);
      const existingReaction = card.editedBounds.find(
        r => r.id === reaction.id
      );
      // Update the reaction, but take care not to overwrite the bounds.
      Object.keys(reaction).forEach(key => {
        existingReaction[key] = reaction[key];
      });
    },
    updateEditedBounds(state, { uuid, reactionId, lowerBound, upperBound }) {
      // Update the *bounds* for a reaction which was already  reaction data for an edited reaction.
      const card = state.cards.find(c => c.uuid === uuid);
      const reaction = card.editedBounds.find(r => r.id === reactionId);
      reaction.lowerBound = lowerBound;
      reaction.upperBound = upperBound;
    },
    undoEditBounds(state, { uuid, reactionId }) {
      const card = state.cards.find(c => c.uuid === uuid);
      const index = card.editedBounds.findIndex(r => r.id === reactionId);
      card.editedBounds.splice(index, 1);
    }
  },
  actions: {
    getBiggReaction(context, reactionId) {
      // A typical pattern used in below actions is to commit a reaction with
      // only its ID, dispatch this action, and then eventually update the
      // reaction object with the returned data.
      return new Promise((resolve, reject) => {
        axios
          .get(`${settings.apis.bigg}/universal/reactions/${reactionId}`)
          .then(response => {
            resolve({
              id: response.data.bigg_id,
              name: response.data.name,
              reactionString: response.data.reaction_string,
              metabolites: response.data.metabolites.map(m => ({
                id: m.bigg_id,
                name: m.name,
                compartmentId: m.compartment_bigg_id,
                stoichiometry: m.stoichiometry
              }))
            });
          });
      });
    },
    getBiggGene(context, { modelId, geneId }) {
      return new Promise((resolve, reject) => {
        axios
          .get(`${settings.apis.bigg}/models/${modelId}/genes/${geneId}`)
          .then(response => {
            resolve({
              id: response.data.bigg_id,
              name: response.data.name,
              reactions: response.data.reactions.map(r => ({
                id: r.bigg_id,
                name: r.name,
                geneReactionRule: r.gene_reaction_rule
              }))
            });
          });
      });
    },
    setObjective({ commit, dispatch }, { uuid, reactionId }) {
      commit("setObjectiveReaction", {
        uuid: uuid,
        reaction: { id: reactionId }
      });
      dispatch("getBiggReaction", reactionId).then(reaction => {
        commit("setObjectiveReaction", { uuid: uuid, reaction: reaction });
      });
    },
    knockoutReaction({ commit, dispatch }, { uuid, reactionId }) {
      commit("knockoutReaction", { uuid: uuid, reaction: { id: reactionId } });
      dispatch("getBiggReaction", reactionId).then(reaction => {
        commit("updateKnockoutReaction", { uuid: uuid, reaction: reaction });
      });
    },
    knockoutGene({ state, commit, dispatch }, { uuid, geneId }) {
      commit("knockoutGene", { uuid: uuid, gene: { id: geneId } });
      // Fetch the full model, because we need the BiGG ID of the model to
      // retrieve gene information.
      const card = state.cards.find(c => c.uuid === uuid);
      dispatch("models/withFullModel", card.modelId, { root: true }).then(
        model => {
          dispatch("getBiggGene", {
            modelId: model.model_serialized.id,
            geneId: geneId
          }).then(gene => {
            commit("updateKnockoutGene", { uuid: uuid, gene: gene });
          });
        }
      );
    },
    editBounds(
      { commit, dispatch },
      { uuid, reactionId, lowerBound, upperBound }
    ) {
      commit("editBounds", {
        uuid: uuid,
        reaction: {
          id: reactionId,
          lowerBound: lowerBound,
          upperBound: upperBound
        }
      });
      dispatch("getBiggReaction", reactionId).then(reaction => {
        commit("updateEditedBoundsReaction", {
          uuid: uuid,
          reaction: reaction
        });
      });
    }
  }
};
