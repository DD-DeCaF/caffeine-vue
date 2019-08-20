<template>
  <v-container>
    <v-layout column align-center>
      <v-flex>
        <div class="headline my-3">Reset your password</div>
      </v-flex>
      <v-flex>
        <v-card :width="400">
          <div v-if="!isRequestingResetLink">
            <v-layout column align-center>
              <v-flex>
                <div class="pa-4">
                  Enter your email address and we will send you a link to reset
                  your password.
                </div>
                <v-flex>
                  <v-text-field
                    v-model="email.value"
                    label="Enter your email address"
                    single-line
                    solo
                    type="text"
                    class="mx-3"
                  ></v-text-field></v-flex></v-flex
              ><v-flex
                ><v-btn color="primary" class="mb-3" @click="requestResetLink()"
                  >Send password reset email</v-btn
                ></v-flex
              ></v-layout
            >
          </div>
          <v-layout column align-center
            ><v-flex
              ><v-progress-circular
                v-if="isRequestingResetLink"
                indeterminate
                color="primary"
                size="170"
              ></v-progress-circular></v-flex></v-layout></v-card
      ></v-flex>
      <v-snackbar
        color="error"
        v-model="hasResetRequestError"
        :timeout="9000"
        bottom
      >
        {{ resetRequestErrorMessage }}
      </v-snackbar>
      <v-snackbar
        color="success"
        v-model="isResetRequestSuccess"
        :timeout="9000"
        bottom
      >
        {{ resetRequestSuccessMessage }}
      </v-snackbar>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";

export default Vue.extend({
  name: "ResetRequest",
  data: () => ({
    email: {
      value: null,
      rules: [
        (v: string) => /.+@.+/.test(v) || "E-mail must be a valid address"
      ]
    },
    isResetRequestSuccess: false,
    resetRequestSuccessMessage: null,
    hasResetRequestError: false,
    resetRequestErrorMessage: null,
    isRequestingResetLink: false
  }),
  methods: {
    requestResetLink() {
      this.isRequestingResetLink = true;
      axios
        .post(`${settings.apis.iam}/password/reset-request`, {
          email: this.email.value
        })
        .then((response: AxiosResponse) => {
          this.resetRequestSuccessMessage = response.data;
          this.isResetRequestSuccess = true;
        })
        .catch(error => {
          if (error.response) {
            this.resetRequestErrorMessage = error.response.data;
          } else {
            this.resetRequestErrorMessage = `We were unable to send the email. 
              Please check your internet connection, or try again in a few minutes.`;
          }
          this.hasResetRequestError = true;
        })
        .then(() => (this.isRequestingResetLink = false));
    }
  }
});
</script>
