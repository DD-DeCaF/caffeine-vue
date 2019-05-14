// Vuetify does not seem to export types for form rules.
export type RuleOutcome = string | true;
export type RuleHandler = (any) => RuleOutcome;
