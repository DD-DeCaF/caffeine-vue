export const environment = process.env.VUE_APP_ENVIRONMENT;
export const deploymentHash = process.env.VUE_APP_DEPLOYMENT_HASH;

export const apis = {
  simulations: `${process.env.VUE_APP_SIMULATIONS_API}`,
  modelStorage: `${process.env.VUE_APP_MODEL_STORAGE_API}`,
  warehouse: `${process.env.VUE_APP_WAREHOUSE_API}`,
  maps: `${process.env.VUE_APP_MAPS_API}`,
  iam: `${process.env.VUE_APP_IAM_API}`,
  metabolicNinja: `${process.env.VUE_APP_METABOLIC_NINJA_API}`,
  designStorage: `${process.env.VUE_APP_DESIGN_STORAGE_API}`,
  idMapper: `${process.env.VUE_APP_ID_MAPPER_API}`,
  bigg: `${process.env.VUE_APP_BIGG_API}`,
  metanetx: `${process.env.VUE_APP_METANETX_API}`
};

export const trustedURLs = process.env.VUE_APP_TRUSTED_URLS.split(",");
export const sentryDSN = process.env.sentryDSN;
export const gaTrackingID = process.env.VUE_APP_GA_TRACKING_ID;
export const hotjarID = Number.parseInt(process.env.VUE_APP_HOTJAR_ID);
export const hotjarSnippetVersion = Number.parseInt(
  process.env.VUE_APP_HOTJAR_SNIPPET_VERSION
);
export const enableAnalytics = ["true", "1"].includes(
  process.env.VUE_APP_ENABLE_ANALYTICS.toLowerCase()
);
export const enableConsents = ["true", "1"].includes(
  process.env.VUE_APP_ENABLE_CONSENTS.toLowerCase()
);
export const enableHotjar = ["true", "1"].includes(
  process.env.VUE_APP_ENABLE_HOTJAR.toLowerCase()
);
