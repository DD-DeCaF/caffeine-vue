/**
 * getMetaboliteId('abc_c', 'c') => 'abc'
 * getMetaboliteId('abc_1', 'c') => 'abc_1'
 */
export function getMetaboliteId(
  idWithCompartment: string,
  compartmentInMetabolite: string
) {
  const compartmentInId = idWithCompartment.substring(
    idWithCompartment.lastIndexOf("_") + 1
  );
  if (compartmentInId !== compartmentInMetabolite) {
    return idWithCompartment;
  } else {
    return idWithCompartment.substring(0, idWithCompartment.lastIndexOf("_"));
  }
}
