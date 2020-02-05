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
  const clearPreferencesCookies = () => {
    // Do nothing if consents are not enabled
    if (!store.state.consents.enableConsents) {
      return;
    }
    // Sanity check - do nothing if preferences cookies accepted
    if (
      store.getters["consents/isConsentAccepted"]({
        type: "cookie",
        category: "preferences"
      })
    ) {
      return;
    }
    ["jwt", "cookie:accepted", "consents"].forEach(k =>
      localStorage.removeItem(k)
    );
  };
  // Guard against assigning multiple on-event callbacks
  let clearPrefFuncAssigned = false;

  store.subscribe(({ type, payload }, state) => {
    if (type === "consents/setConsent") {
      if (payload.type === "cookie" && payload.category === "preferences") {
        if (store.getters["consents/isConsentAccepted"](payload)) {
          window.removeEventListener("beforeunload", clearPreferencesCookies);
          clearPrefFuncAssigned = false;
        } else {
          if (!clearPrefFuncAssigned) {
            window.addEventListener("beforeunload", clearPreferencesCookies);
            clearPrefFuncAssigned = true;
          }
        }
      }
    } else if (type === "consents/clearConsents") {
      if (!clearPrefFuncAssigned) {
        window.addEventListener("beforeunload", clearPreferencesCookies);
        clearPrefFuncAssigned = true;
      }
    }
  });
};
