import store from "../store";

export const initFromStorage = () => {
  // Restore potential existing session from local storage.
  const token = localStorage.getItem("jwt");
  if (token !== null) {
    store.commit("session/login", JSON.parse(token));
    store.dispatch("analytics/loginLocalStorage");
  }
};
