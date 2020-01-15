import { Module, Store } from "vuex";

/**
 * Fixes inferred types of vuex store modules.
 */
export function vuexStoreModule<T, R>(m: Module<T, R>): Store<T> {
  return m as Store<T>;
}
