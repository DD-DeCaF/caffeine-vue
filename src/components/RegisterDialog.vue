<template>
  <div>
    <v-dialog v-model="showDialog" width="500">
      <v-card class="pa-2">
        <div class="text-xs-center pa-4" v-if="isLoading">
          <v-progress-circular
            indeterminate
            color="primary"
            size="80"
          ></v-progress-circular>
        </div>
        <div v-if="!isLoading">
          <div class="pl-4 pt-4 title">Register form</div>
          <v-container grid-list-lg text-md-center>
            <v-layout fill-height row wrap>
              <v-flex>
                <v-layout fill-height column>
                  <v-flex>
                    <v-form ref="form" v-model="isValid">
                      <v-text-field
                        v-model="firstName.value"
                        :rules="firstName.rules"
                        prepend-icon="perm_identity"
                        label="First name"
                        type="text"
                      ></v-text-field>
                      <v-text-field
                        v-model="lastName.value"
                        :rules="lastName.rules"
                        prepend-icon="perm_identity"
                        label="Last name"
                        type="text"
                      ></v-text-field>
                      <v-text-field
                        v-model="email.value"
                        :rules="email.rules"
                        prepend-icon="email"
                        label="Email"
                        type="text"
                      ></v-text-field>
                      <v-text-field
                        v-model="password.value"
                        :rules="[
                          password.rules,
                          passwordConfirmationRules(
                            password.value,
                            confirmedPassword.value
                          )
                        ]"
                        prepend-icon="lock"
                        label="Password"
                        :type="passwordFieldType"
                        :append-icon="visibilityIcon"
                        @click:append="switchVisibility()"
                      ></v-text-field>
                      <v-text-field
                        v-model="confirmedPassword.value"
                        :rules="[
                          confirmedPassword.rules,
                          passwordConfirmationRules(
                            password.value,
                            confirmedPassword.value
                          )
                        ]"
                        prepend-icon="lock"
                        label="Confirm password"
                        :type="passwordFieldType"
                        :append-icon="visibilityIcon"
                        @click:append="switchVisibility()"
                      ></v-text-field>
                    </v-form>
                  </v-flex>
                </v-layout>
              </v-flex>
            </v-layout>
          </v-container>
        </div>

        <v-divider class="my-2"></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="secondary"
            flat
            @click="showDialog = false"
            :disabled="isLoading"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="register()"
            :disabled="!isValid || isLoading"
            >Register</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar
      color="error"
      v-model="isUserRegisterError"
      bottom
      :timeout="10000"
    >
      {{ userRegisterErrorMessage }}.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import { JWT } from "@/store/modules/session";

export default Vue.extend({
  name: "RegisterDialog",
  props: ["value"],
  data: () => ({
    isValid: true,
    isUserRegisterSuccess: false,
    isUserRegisterError: false,
    isLoading: false,
    userRegisterErrorMessage: null,
    passwordFieldType: "password",
    visibilityIcon: "visibility_off",
    firstName: {
      value: null,
      rules: [(v: string) => !!v || "First name is required"]
    },
    lastName: {
      value: null,
      rules: [(v: string) => !!v || "Last name is required"]
    },
    email: {
      value: null,
      rules: [
        (v: string) => /.+@.+/.test(v) || "E-mail must be a valid address"
      ]
    },
    password: {
      value: null,
      rules: v => {
        if (!v && v !== 0) {
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
        if (!v && v !== 0) {
          return "Confirm your password";
        }
        return true;
      }
    }
  }),
  computed: {
    showDialog: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("input", value);
      }
    }
  },
  methods: {
    register() {
      this.isLoading = true;
      const params = {
        first_name: this.firstName.value,
        last_name: this.lastName.value,
        email: this.email.value,
        password: this.password.value
      };
      axios
        .post(`${settings.apis.iam}/user`, params)
        .then((response: AxiosResponse<JWT>) => {
          this.$store.commit("session/login", response.data);
          this.isUserRegisterSuccess = true;
          this.showDialog = false;
          this.$emit("register-success");
        })
        .catch(error => {
          this.userRegisterErrorMessage = error.response.data;
          this.isUserRegisterError = true;
        })
        .then(() => (this.isLoading = false));
    },
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
    }
  }
});
</script>
