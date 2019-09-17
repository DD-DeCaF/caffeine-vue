import { Metabolite } from "@/store/modules/interactiveMap";

// Produces reaction string based on:
// sign of stoichiometry (positive/negative -> products/substrates)
// bounds (direction of the reaction)
// Format of the metabolite in the string: "stoichiometry id_compartment"                                                                                                                                 )
export function buildReactionString(
  metabolites: Metabolite[],
  lowerBound: number,
  upperBound: number
) {
  const substrates: Object[] = [];
  const products: Object[] = [];
  metabolites.forEach(metabolite => {
    const serializedMetabolite =
      Math.abs(metabolite.stoichiometry) +
      " " +
      metabolite.id +
      "_" +
      metabolite.compartment;
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
