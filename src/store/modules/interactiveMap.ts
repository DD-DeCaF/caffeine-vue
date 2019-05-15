import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import { OrganismItem } from "./organisms";
import { ModelItem } from "./models";

export interface Card {
  uuid: string;
  name: string;
  organism: OrganismItem;
  model: ModelItem;
  isLoadingModel: boolean;
  fullModel: ModelItem;
  method: string;
  // Design card fields
  objective: {
    reaction: any; // TODO: Reaction type
    maximize: boolean;
  };
  reactionAdditions: any[];
  reactionKnockouts: any[];
  geneKnockouts: any[];
  editedBounds: any[];
  // Data-driven card fields
  experiment: any,
  condition: any,
  conditionData: any,
  conditionWarnings: any[],
  conditionErrors: any[],
  // General simulation fields
  isSimulating: boolean;
  hasSimulationError: boolean;
  hasLoadModelError: boolean;
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
    }
  }
};
