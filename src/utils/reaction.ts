import { Metabolite, Reaction } from "@/store/modules/interactiveMap";
import { MetaNetXReaction } from "@/components/AutocompleteMnxReaction.vue";

// Produces reaction string based on:
// sign of stoichiometry (positive/negative -> products/substrates)
// bounds (direction of the reaction)
// Format of the metabolite in the string: "stoichiometry id_compartment"                                                                                                                                 )
export function buildReactionString(
  metabolites: Metabolite[],
  lowerBound: number,
  upperBound: number,
  propertyToDisplay: string = "id"
) {
  const substrates: Object[] = [];
  const products: Object[] = [];
  metabolites.forEach(metabolite => {
    const serializedMetabolite =
      Math.abs(metabolite.stoichiometry) +
      " " +
      metabolite[propertyToDisplay] +
      (metabolite.compartment ? "_" + metabolite.compartment : "");
    if (metabolite.stoichiometry < 0) {
      substrates.push(serializedMetabolite);
    } else {
      products.push(serializedMetabolite);
    }
  });
  const substratesSerialized = substrates.join(" + ");
  const productsSerialized = products.join(" + ");
  if (substratesSerialized || productsSerialized) {
    return (
      (substratesSerialized || "Ø") +
      direction(lowerBound, upperBound) +
      (productsSerialized || "Ø")
    );
  }
  return "";
}

function direction(lowerBound, upperBound) {
  if (lowerBound >= 0) {
    return " ⟶ ";
  }
  if (upperBound <= 0) {
    return " ⟵ ";
  }
  return " ⇌ ";
}

export function mapMnxReactionToReaction(
  mnxReaction: MetaNetXReaction
): Reaction {
  const metabolites: Metabolite[] = mnxReaction.reaction.equation_parsed.map(
    m => {
      const fullMetabolite = mnxReaction.metabolites.find(
        ({ mnx_id }) => mnx_id === m.metabolite_id
      );
      return {
        id: m.metabolite_id,
        name: fullMetabolite ? fullMetabolite.name : "",
        formula: fullMetabolite ? fullMetabolite.formula : "",
        // TODO: use m.compartment_id, mapped through selectedReaction.annotations
        compartment: "",
        stoichiometry: m.coefficient
      };
    }
  );
  // Note: Assuming all reactions in the universal model are
  // reversible, but this might not be the case. Could potentially use
  // the reaction string to check reversibility.
  const lowerBound = -1000;
  const upperBound = 1000;
  const reaction: Reaction = {
    id: mnxReaction.foundId || mnxReaction.reaction.mnx_id,
    name: mnxReaction.reaction.name || "",
    reactionString: buildReactionString(
      metabolites,
      lowerBound,
      upperBound,
      "name"
    ),
    lowerBound: lowerBound,
    upperBound: upperBound,
    metabolites: metabolites,
    namespace: mnxReaction.namespace || "metanetx.reaction",
    annotation: mnxReaction.reaction.annotation,
    ec: mnxReaction.reaction.ec || "",
    mnxId: mnxReaction.reaction.mnx_id
  };
  return reaction;
}
