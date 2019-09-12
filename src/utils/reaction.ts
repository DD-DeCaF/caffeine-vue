import { Metabolite } from "@/store/modules/interactiveMap";

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
