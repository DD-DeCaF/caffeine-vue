import axios from "axios";
import * as settings from "@/utils/settings";
import { vuexStoreModule } from "@/store/vuexStoreModule";
import { RootState } from "@/types/vuex";
import {
  snakeCasePropertyNames,
  camelCasePropertyNames,
  toISOFormat
} from "@/utils/utility";

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

export interface CookieOption {
  category: string;
  label: string;
  message: string;
  default: boolean;
  canOptOut: boolean;
}

export type ConsentsState = {
  enableConsents: boolean;
  cookieOptions: CookieOption[];
  consentError: null;
  consents: Consent[];
  consentsPromise: Promise<void> | null;
};

export default vuexStoreModule({
  namespaced: true,
  state: {
    enableConsents: settings.enableConsents,
    consentError: null,
    consents: [],
    consentsPromise: Promise.resolve(),
    // For cookie consent categories, see https://gdpr.eu/cookies/
    cookieOptions: [
      {
        category: "strictly_necessary",
        label: "Strictly Necessary",
        message:
          "These cookies are essential for you to use the website and its " +
          "features, and security reasons.",
        default: true,
        canOptOut: false
      },
      {
        category: "preferences",
        label: "Preferences",
        message:
          "These cookies allow to remember choices you have made such as " +
          "what your user name and password are so you can automatically " +
          "log in.<br/><br/><small class='warning py-1 px-1 font-weight-bold'" +
          ">Note: Preferences cookies are necessary to hide cookies " +
          "notification and remember login.</small>",
        default: false,
        canOptOut: true
      },
      {
        category: "statistics",
        label: "Statistics",
        message:
          "These cookies collect information about how you use a website, " +
          "like which pages you visited and which links you clicked on. " +
          "None of this information can be used to identify you. It is all " +
          "aggregated and, therefore, anonymized. Their sole purpose is " +
          "to improve website functions. This includes cookies from " +
          "third-party analytics services as long as the cookies are for " +
          "the exclusive use of the owner of the website visited.",
        default: false,
        canOptOut: true
      }
      // {
      //   category: "marketing",
      //   label: "Marketing",
      //   messages:
      //     "These cookies track your online activity to help advertisers " +
      //     "deliver more relevant advertising or to limit how many times " +
      //     "you see an ad. These cookies can share that information with " +
      //     "other organizations or advertisers. These are persistent " +
      //     "cookies and almost always of third-party provenance.",
      //   default: false,
      //   canOptOut: true
      // }
    ]
  } as ConsentsState,
  mutations: {
    setEnableConsents(state, enabled) {
      state.enableConsents = enabled;
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
    setConsentsPromise(state, consentsPromise) {
      state.consentsPromise = consentsPromise;
    },
    clearConsents(state) {
      state.consents = [];
    },
    setConsentError(state, error) {
      state.consentError = error;
    }
  },
  actions: {
    clearLocalStorageOnExit({ getters, state }) {
      /**
       * Take care of clearing cookies based on "preferences" cookie consent
       * status.
       *
       * If user rejects "preferences" cookie or the consents are cleared
       * (e.g. on log out), then preferences are removed from localStorage.
       */
      window.addEventListener("beforeunload", () => {
        if (!state.enableConsents) {
          return;
        }
        const consentGiven = getters.isConsentAccepted({
          type: "cookie",
          category: "preferences"
        });
        if (!consentGiven) {
          ["jwt", "cookie:accepted", "consents"].forEach(k =>
            localStorage.removeItem(k)
          );
        }
      });
    },
    fetchConsents({ commit, rootState, state }) {
      if (!state.enableConsents) {
        return;
      }
      // Fetch consents from localStorage if anonymous user
      if (!(rootState as RootState).session.isAuthenticated) {
        const consentsJson = localStorage.getItem("consents");
        const consents = consentsJson ? JSON.parse(consentsJson) : [];
        consents.forEach((consent: Consent) => commit("setConsent", consent));
        commit("setConsentsPromise", Promise.resolve(consents));
        return;
      }
      const consentsPromise = axios
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
      commit("setConsentsPromise", consentsPromise);
    },
    addConsent({ commit, rootState, state }, consent) {
      if (!state.enableConsents) {
        return;
      }
      const formattedConsent = {
        ...consent,
        validUntil: consent.validUntil
          ? toISOFormat(consent.validUntil)
          : undefined,
        timestamp: consent.timestamp
          ? toISOFormat(consent.timestamp)
          : undefined
      };
      // Store consent in localStorage if anonymous user
      if (!(rootState as RootState).session.isAuthenticated) {
        const updatedConsents = [
          ...state.consents.filter(c =>
            ["type", "category"].reduce(
              (predicate: boolean, key) => predicate || c[key] !== consent[key],
              false
            )
          ),
          formattedConsent
        ];
        localStorage.setItem("consents", JSON.stringify(updatedConsents));
        commit("setConsent", formattedConsent);
        return;
      }
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
    addConsentsFromLocalStorage({ dispatch }) {
      const consents = localStorage.getItem("consents");
      if (consents) {
        JSON.parse(consents).forEach((consent: Consent) => {
          dispatch("addConsent", consent);
        });
      }
      localStorage.removeItem("consents");
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
  },
  getters: {
    isConsentAccepted: state => ({ category, type }) => {
      const consent =
        state.consents.find(c => c.type == type && c.category == category) ||
        ({} as Consent);
      return consent.status === "accepted";
    }
  }
});
