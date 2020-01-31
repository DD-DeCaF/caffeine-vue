import { Store } from "vuex";

/**
 * Take care of clearing cookies based on "preferences" cookie consent
 * status.
 *
 * If user rejects "preferences" cookie or the consents are cleared
 * (e.g. on log out), then preferences are removed from localStorage
 * on beforeunload.
 */
export const cookiePlugin = (store: Store<any>) => {
  store.subscribe(({ type, payload }, state) => {
    const clearPreferencesCookies = () =>
      ["jwt", "cookie:accepted", "consents"].forEach(k =>
        localStorage.removeItem(k)
      );
    if (type === "consents/setConsent") {
      if (payload.type === "cookie" && payload.category === "preferences") {
        if (store.getters["consents/isConsentAccepted"](payload)) {
          window.removeEventListener("beforeunload", clearPreferencesCookies);
        } else {
          window.addEventListener("beforeunload", clearPreferencesCookies);
        }
      }
    } else if (type === "consents/clearConsents") {
      window.addEventListener("beforeunload", clearPreferencesCookies);
    }
  });
};
