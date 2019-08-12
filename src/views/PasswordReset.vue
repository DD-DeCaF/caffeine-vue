<template>
  <v-container>
    <v-layout column align-center>
      <v-flex>
        <div class="headline my-3">Change your password</div>
      </v-flex>
      <v-flex>
        <v-card :width="400" class="pt-4 px-4">
          <div v-if="!isRequestingPasswordChange">
            <v-form v-model="isValid">
              <v-text-field
                label="Password"
                v-model="password.value"
                single-line
                solo
                :rules="[
                  password.rules,
                  passwordConfirmationRules(
                    password.value,
                    confirmedPassword.value
                  )
                ]"
                :type="passwordFieldType"
                :append-icon="visibilityIcon"
                @click:append="switchVisibility()"
              ></v-text-field>
              <v-text-field
                label="Confirm password"
                v-model="confirmedPassword.value"
                single-line
                solo
                :rules="[
                  confirmedPassword.rules,
                  passwordConfirmationRules(
                    password.value,
                    confirmedPassword.value
                  )
                ]"
                :type="passwordFieldType"
                :append-icon="visibilityIcon"
                @click:append="switchVisibility()"
              ></v-text-field></v-form
            ><v-layout column align-center>
              <v-flex>
                <v-btn
                  color="primary"
                  class="mb-3"
                  :disabled="!isValid"
                  @click="changePassword()"
                  >Change password</v-btn
                >
              </v-flex></v-layout
            >
          </div>
          <v-layout column align-center
            ><v-flex
              ><v-progress-circular
                v-if="isRequestingPasswordChange"
                indeterminate
                color="primary"
                size="170"
              ></v-progress-circular></v-flex></v-layout></v-card
      ></v-flex>
      <v-snackbar color="error" v-model="isTokenInvalid" :timeout="9000" bottom>
        This link is no longer valid. Please request another password reset
        email.
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
  name: "PasswordReset",
  data: () => ({
    token: null,
    isTokenInvalid: false,
    isValid: true,
    passwordFieldType: "password",
    visibilityIcon: "visibility",
    isRequestingPasswordChange: false,
    password: {
      value: null,
      rules: v => {
        if (!v) {
          return "Enter your password";
        }
        if (v.length < 8) {
          return "Password should be at least 8 characters long";
        }
        return true;
      }
    },
    confirmedPassword: {
      value: null,
      rules: v => {
        if (!v) {
          return "Confirm your password";
        }
        return true;
      }
    }
  }),
  created() {
    this.token = this.$route.params.token;
    // Verify token validity
    axios
      .get(`${settings.apis.iam}/password_reset/${this.token}`)
      .catch(error => {
        this.isTokenInvalid = true;
      });
  },
  methods: {
    passwordConfirmationRules(password, confirmedPassword) {
      if (password && confirmedPassword && password !== confirmedPassword) {
        return "Passwords don't match";
      }
      return true;
    },
    switchVisibility() {
      this.passwordFieldType =
        this.passwordFieldType === "password" ? "text" : "password";
      this.visibilityIcon =
        this.visibilityIcon === "visibility_off"
          ? "visibility"
          : "visibility_off";
    },
    changePassword() {
      this.isRequestingPasswordChange = true;
      axios
        .post(`${settings.apis.iam}/password_reset/${this.token}`, {
          password: this.password.value
        })
        .then((response: AxiosResponse) => {
          this.$router.push({ name: "home" });
          this.$store.commit("setPasswordResetSuccess", true);
        })
        .catch(error => {
          this.isTokenInvalid = true;
        })
        .then(() => (this.isRequestingPasswordChange = false));
    }
  }
});
</script>
