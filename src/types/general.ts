import { RawLocation } from "vue-router";

export type Nullable<T> = T | null | undefined;
// Vuetify does not seem to export types for form rules.
export type RuleOutcome = string | true;
export type RuleHandler = (any) => RuleOutcome;
// FIXME (Moritz Beber): In future we would like to import this from vue-router.
// See https://github.com/vuejs/vue-router/issues/2758
export type NextHandler = (to?: RawLocation | false | Function | void) => void;
