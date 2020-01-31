<template>
  <CookieLaw
    v-if="$store.state.consents.enableConsents"
    v-bind="$attrs"
    class="elevation-6"
  >
    <template v-slot="{ accept, close }">
      <template v-if="isCookieOptionsVisible">
        <v-container class="mt-auto px-4 pb-3 pt-0">
          <v-checkbox
            v-for="(item, index) in $store.state.consents.cookieOptions"
            :key="index"
            v-model="cookies[item.category]"
            :disabled="!item.canOptOut"
            :label="item.label"
            :messages="item.message"
            color="primary"
          ></v-checkbox>
        </v-container>
        <v-btn
          color="secondary"
          class="mb-4 mt-auto"
          flat
          @click="isCookieOptionsVisible = false"
          >Back</v-btn
        >
        <v-btn
          color="primary"
          class="mb-4 mt-auto"
          @click="submitCookies({ accept, close })"
          >Accept Cookies</v-btn
        >
      </template>

      <template v-else>
        <v-container class="mt-auto px-4 pb-3 pt-0">
          Our website uses cookies to ensure you get the best experience. By
          clicking on the Accept button, you agree with the use of these
          cookies. If you change your mind or want more information please see
          <router-link to="privacy-policy">Privacy policy</router-link>.
        </v-container>
        <v-btn
          color="primary-2"
          class="mb-4 mt-auto"
          @click="isCookieOptionsVisible = true"
          >Choose Cookies</v-btn
        >
        <v-btn
          color="primary"
          class="mb-4 mt-auto"
          @click="submitCookies({ accept, close })"
          >Accept Cookies</v-btn
        >
      </template>
    </template>
  </CookieLaw>
</template>

<script lang="ts">
import Vue from "vue";
import CookieLaw from "vue-cookie-law";
import { Consent, CookieOption } from "@/store/modules/consents";

export default Vue.extend({
  name: "CookieConsent",
  components: {
    CookieLaw
  },
  data: () => ({
    isCookieOptionsVisible: false,
    shouldShowBanner: true,
    cookies: {
      strictlyNecessary: false,
      preferences: false,
      statistics: false,
      marketing: false
    }
  }),
  computed: {
    showBanner() {
      return this.$store.state.consents.enableConsents && this.shouldShowBanner;
    }
  },
  created() {
    this.$store.state.consents.consentsPromise.then(() => {
      // Check if user has any cookies consents. If so, we assume they've seen
      // the banner before even if that info is not stored in localStorage
      if (this.$store.state.consents.consents.find(c => c.type === "cookie")) {
        this.showShowBanner = false;
        return;
      }
      // Otherwise, load up checkbox values from default and user's
      // consent values
      this.$store.state.consents.cookieOptions.forEach(
        (option: CookieOption) => {
          this.cookies[option.category] = option.default;
        }
      );
      this.$store.state.consents.consents
        .filter(({ category }: Consent) => category !== "strictly_necessary")
        .forEach((consent: Consent) => {
          if (this.cookies.hasOwnProperty(consent.category)) {
            this.cookies[consent.category] = this.$store.getters[
              "consents/isConsentAccepted"
            ](consent);
          }
        });
    });
  },
  methods: {
    submitCookies({ accept, close }) {
      this.$store.state.consents.cookieOptions.forEach(
        ({ category, message }: CookieOption) => {
          this.$store.dispatch("consents/addCookieConsent", {
            category: category,
            message: message,
            status: this.cookies[category] ? "accepted" : "rejected",
            source: "cookie_consent_banner"
          });
        }
      );
      // Do not set cookie on whether user accepted cookies if 'preferences'
      // cookies is not accepted
      this.cookies.preferences ? accept() : close();
    }
  }
});
</script>
