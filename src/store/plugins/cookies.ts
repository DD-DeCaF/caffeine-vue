import { Store } from "vuex";

export const cookiePlugin = (store: Store<any>) => {
  store.subscribe(({ type, payload }, state) => {
    const clearPreferencesCookies = () =>
      ["jwt", "cookie:accepted"].forEach(k => localStorage.removeItem(k));
    window.addEventListener("beforeunload", clearPreferencesCookies);

    if (type === "session/setConsent") {
      if (payload.type === "cookie" && payload.category === "preferences") {
        if (store.getters["session/isConsentAccepted"](payload)) {
          window.removeEventListener("beforeunload", clearPreferencesCookies);
        } else {
          window.addEventListener("beforeunload", clearPreferencesCookies);
        }
      }
    }
  });
};
