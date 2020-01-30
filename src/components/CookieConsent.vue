<template>
  <CookieLaw v-bind="$attrs" class="elevation-6">
    <template v-slot="{ accept, close }">
      <template v-if="isCookieOptionsVisible">
        <v-container class="mt-auto px-4 pb-3 pt-0">
          <v-checkbox
            v-for="(item, index) in $store.state.session.cookieOptions"
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
import { Consent, CookieOption } from "@/store/modules/session";

export default Vue.extend({
  name: "CookieConsent",
  components: {
    CookieLaw
  },
  data: () => ({
    isCookieOptionsVisible: false,
    cookies: {
      strictlyNecessary: false,
      preferences: false,
      statistics: false,
      marketing: false
    }
  }),
  created() {
    this.$store.state.session.cookieOptions.forEach((option: CookieOption) => {
      this.cookies[option.category] = option.default;
    });
    this.$store.state.session.consentsPromise.then(() => {
      this.$store.state.session.consents
        .filter(({ category }: Consent) => category !== "strictly_necessary")
        .forEach((consent: Consent) => {
          if (this.cookies.hasOwnProperty(consent.category)) {
            this.cookies[consent.category] = this.$store.getters[
              "session/isConsentAccepted"
            ](consent);
          }
        });
    });
  },
  methods: {
    submitCookies({ accept, close }) {
      this.$store.state.session.cookieOptions.forEach(
        ({ category, message }: CookieOption) => {
          this.$store.dispatch("session/addCookieConsent", {
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
