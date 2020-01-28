import axios from "axios";
import * as settings from "@/utils/settings";
import { vuexStoreModule } from "@/store/vuexStoreModule";
import {
  snakeCasePropertyNames,
  camelCasePropertyNames,
  toISOFormat
} from "@/utils/utility";

export interface JWT {
  jwt: string;
  refresh_token: {
    exp: number;
    val: string;
  };
}

type LinkedJWTAuthenticated =
  | {
      isAuthenticated: false;
      jwt: null;
    }
  | {
      isAuthenticated: true;
      jwt: JWT;
    };

/**
 * Description of user-given/-rejected consents
 */
export interface Consent {
  /**
   * Whether the consent was accepted or rejected/revoked.
   *
   * Values:
   * `"accepted"`
   * `"rejected"`
   *
   * @example
   * "accepted"
   */
  status: string;
  /**
   * Type of the consent
   *
   * Values:
   * `"gdpr"` - consenting to data processing
   * `"cookie"` - consenting to cookies on website
   *
   * @example
   * "gdpr"
   */
  type: string;
  /**
   * Category/type the data-processing the consent relates to.
   *
   * @example
   * // GDPR:
   * // User signed up for a newsletter with their email.
   * // Email is a personal identifiable information (PII) and stored
   * // on our servers, so we need their consent. In this case, we assign the
   * // consent the category "newsletter"
   * "newsletter"
   *
   * // Cookies:
   * // User consented to analytics cookies. To distinguish this consent from,
   * // consent for essential or marketing cookies, we assign the consent
   * // the category "analytics"
   * "analytics"
   */
  category: string;
  /**
   * Unix timestamp of the time when user accepted/rejected the consent.
   *
   * @default current timestamp
   *
   * @example
   * // User consented to a newsletter at Wed Jan 15 2020 12:36:17
   * // so the timestamp becomes
   * 1579088177
   */
  timestamp?: number;
  /**
   * Timestamp of the time when the consent should be revoked.
   *
   * @default "unlimited"
   *
   * @example
   * // User consented to a newsletter at Wed Jan 15 2020 12:36:17.
   * // The website's policy mentions that the users' consents are valid
   * // for 2 years, so the validUntil is unix timestamp of Wed Jan 15 2022 12:36:17
   * 1642246577
   *
   * // Alternatively, the privacy policy may state that the users' consents
   * // are valid for unlimited time. Rather than entering an arbitrary high
   * // number, it is better to set the field as "unlimited"
   * "unlimited"
   */
  validUntil?: number | string;
  /**
   * Source of the consent.
   *
   * @example
   * // If user's consent can be given via website or api, and user consented
   * // to the newsletter via website, the value would be:
   * "website"
   *
   * // Alternatively, if we're only on the website, and the cookies consent
   * // was given in the cookies consent banner, we might assign the value:
   * "cookie_consent_banner"
   */
  source?: string;
  /**
   * Exact wording of what the user consented to.
   *
   * @example
   * // User signed up for a newsletter. The sign-up form contained following
   * // info:
   * "By clicking on the submit button, you consent to us processing your data. For more information, see Privacy Policy"
   */
  message?: string;
}

/**
 * GDPR consent - consent to store and/or process user's data
 *
 * For example when user registers, they should be acknowledged that by
 * registering, they consent to submitting their data and consent to us
 * processing the data. For such consent, use the GDPRConsent object
 */
export interface GDPRConsent extends Consent {
  type: "gdpr";
}

/**
 * Cookie consent - consent to store cookies on user's machine (browser)
 *
 * For example when user visits the page, they should be informed that the
 * website uses cookies, and them accepting/rejecting that for individual types
 * of cookies should be recorded as CookieConsent objects.
 */

export interface CookieConsent extends Consent {
  type: "cookie";
}

type SessionState = LinkedJWTAuthenticated & {
  consentError: null;
  consents: Consent[];
  refreshError: null;
  refreshRequest: Promise<void> | null;
};

export default vuexStoreModule({
  namespaced: true,
  state: {
    isAuthenticated: false,
    consentError: null,
    consents: [],
    jwt: null,
    refreshError: null,
    // While a token refresh request is in progress, the following variable will
    // be set to its promise.
    refreshRequest: null
  } as SessionState,
  mutations: {
    login(state, jwt: JWT) {
      state.isAuthenticated = true;
      state.jwt = jwt;
      localStorage.setItem("jwt", JSON.stringify(state.jwt));
    },
    updateToken(state, jwt: string) {
      state.jwt!.jwt = jwt;
      localStorage.setItem("jwt", JSON.stringify(state.jwt));
    },
    setRefreshError(state, error) {
      state.refreshError = error;
    },
    setRefreshRequest(state, refreshRequest) {
      state.refreshRequest = refreshRequest;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.jwt = null;
      localStorage.removeItem("jwt");
    },
    setConsent(state, consent: Consent) {
      state.consents = [
        // keep all consents where either c.type or c.category are different
        ...state.consents.filter(c =>
          ["type", "category"].reduce(
            (predicate: boolean, key) => predicate || c[key] !== consent[key],
            false
          )
        ),
        consent
      ];
    },
    clearConsents(state) {
      state.consents = [];
    },
    setConsentError(state, error) {
      state.consentError = error;
    }
  },
  actions: {
    interceptRequests({ commit, dispatch, state }) {
      // Note that the intercepters apply in the reverse order of which they are
      // added here, and the order is both intentional and important:
      // 1. Dispatch a refresh request if the current token is about to expire.
      // 2. Have the request wait for any existing refresh request (either
      //    dispatched by the first interceptor, or the refreshTokenLoop action)
      //    to resolve before continuing.
      // 3. Add the (potentially refreshed) authorization token for API
      //    requests.

      // Interceptor 3/3: Add JWT token
      // Add authorization header to requests for trusted urls.
      axios.interceptors.request.use(config => {
        // If not authenticated, there's no token to add.
        if (!state.isAuthenticated) {
          return config;
        }

        // If the request is not going to a trusted url, don't add the token.
        if (!settings.trustedURLs.some(url => config.url!.startsWith(url))) {
          return config;
        }

        // Don't send a potentially expired JWT when refreshing the token.
        if (config.url === `${settings.apis.iam}/refresh`) {
          return config;
        }

        // The request needs a token, so add the authorization header.
        config.headers.Authorization = `Bearer ${state.jwt.jwt}`;
        return config;
      });

      // Interceptor 2/3: Wait for refresh request
      // Chain all requests when waiting for a refresh request
      axios.interceptors.request.use(
        config =>
          new Promise((resolve, reject) => {
            // Ignore the token refresh request itself
            if (config.url === `${settings.apis.iam}/refresh`) {
              resolve(config);
              return;
            }

            if (state.refreshRequest !== null) {
              // Refresh request is in progress - wait for it to complete first.
              state.refreshRequest.then(response => {
                resolve(config);
              });
            } else {
              // No refresh request in progress - go ahead with the original
              // request.
              resolve(config);
            }
          })
      );

      // Interceptor 1/3: Check expiry
      // If the token is about to expire, trigger an extra refresh request. This
      // will be mostly irrelevant since the token is regularly updated
      // automatically, but it might catch some edge cases, for example if the
      // user suspends the computed with the tab open, or similar.
      axios.interceptors.request.use(config => {
        if (!state.isAuthenticated) {
          // Not authenticated; there's no token to check.
          return config;
        }

        if (state.refreshRequest) {
          // Refresh request is in progress - no need to check expiry.
          return config;
        }
        // Buffer is the number of seconds before *actual* expiry when the token
        // will be considered expired, to account for clock skew and
        // service-to-service requests delays.
        const buffer = 60;
        const jwt = JSON.parse(atob(state.jwt.jwt.split(".")[1]));
        if (new Date((jwt.exp - buffer) * 1000) <= new Date()) {
          // The token is expired, so dispatch a refresh request. Then let the
          // request proceed - later interceptors will make sure API requests
          // wait for the refresh request to finish, in order to use the renewed
          // token.
          dispatch("refreshToken");
        }
        return config;
      });
    },
    refreshTokenLoop({ dispatch }) {
      dispatch("refreshToken");
      setTimeout(() => {
        dispatch("refreshTokenLoop");
      }, 9 * 60 * 1000);
    },
    refreshToken({ dispatch, commit, state }) {
      if (state.isAuthenticated) {
        const params = { refresh_token: state.jwt.refresh_token.val };
        const refreshRequest = axios
          .post(`${settings.apis.iam}/refresh`, params)
          .then(response => {
            commit("updateToken", response.data.jwt);
          })
          .catch(error => {
            commit("logout");
            commit("setRefreshError", error);
            dispatch("fetchAllData", null, { root: true });
          })
          .then(response => {
            commit("setRefreshRequest", null);
          });
        commit("setRefreshRequest", refreshRequest);
      }
    },
    fetchConsents({ state, commit }) {
      if (!state.isAuthenticated) {
        // TODO: Once cookies are implemented, first check if consents info is
        //       in localStorage, and only if not then clear consents
        commit("clearConsents");
      }
      axios
        .get(`${settings.apis.iam}/consent`)
        .then(response => {
          response.data.map(consent => {
            const localConsent = camelCasePropertyNames(consent);
            commit("setConsent", localConsent);
          });
        })
        .catch(error => {
          commit("setConsentError", error);
        });
      }
    },
    addConsent({ commit }, consent) {
      const formattedConsent = {
        ...consent,
        validUntil: consent.validUntil
          ? toISOFormat(consent.validUntil)
          : undefined,
        timestamp: consent.timestamp
          ? toISOFormat(consent.timestamp)
          : undefined
      };
      const remoteConsent = snakeCasePropertyNames(formattedConsent);
      axios
        .post(`${settings.apis.iam}/consent`, remoteConsent)
        .then(response => {
          commit("setConsent", formattedConsent);
        })
        .catch(error => {
          commit("setConsentError", error);
        });
    },
    addGdprConsent({ dispatch }, consent) {
      dispatch("addConsent", {
        ...consent,
        type: "gdpr"
      });
    },
    addCookieConsent({ dispatch }, consent) {
      dispatch("addConsent", {
        ...consent,
        type: "cookie"
      });
    },
    acceptGdprConsent({ dispatch }, consent) {
      dispatch("addGdprConsent", {
        ...consent,
        status: "accepted"
      });
    },
    rejectGdprConsent({ dispatch }, consent) {
      dispatch("addGdprConsent", {
        ...consent,
        status: "rejected"
      });
    },
    acceptCookieConsent({ dispatch }, consent) {
      dispatch("addCookieConsent", {
        ...consent,
        status: "accepted"
      });
    },
    rejectCookieConsent({ dispatch }, consent) {
      dispatch("addCookieConsent", {
        ...consent,
        status: "rejected"
      });
    }
  }
});
