import axios from "axios";
import * as settings from "@/utils/settings";

export const lookupReaction = (reactionId: string) => {
  // Return a reaction object with info from BiGG (returned in a delayed
  // fashion)
  const reaction: any = {
    id: reactionId,
    name: null,
    reactionString: null
  };
  axios
    .get(`${settings.apis.bigg}/universal/reactions/${reactionId}`)
    .then(response => {
      reaction.name = response.data.name;
      reaction.reactionString = response.data.reaction_string;
    })
    .catch(error => {
      reaction.name = "Unknown reaction";
      reaction.reactionString = "N/A";
    });
  return reaction;
};

export const lookupGene = (modelId: string, geneId: string) => {
  // Return a gene object with BiGG data (returned in a delayed fashion).
  const gene: any = {
    id: geneId,
    name: null,
    reactions: null
  };
  axios
    .get(`${settings.apis.bigg}/models/${modelId}/genes/${geneId}`)
    .then(response => {
      gene.name = response.data.name;
      gene.reactions = response.data.reactions;
    })
    .catch(error => {
      gene.name = "Unknown gene";
      gene.reactions = [];
    });
  return gene;
};
