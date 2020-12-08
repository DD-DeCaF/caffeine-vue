<template>
  <div>
    <template v-if="isAuthenticated">
      <v-btn color="primary" depressed @click="logout">
        <v-icon>power_settings_new</v-icon>
        Log Out
      </v-btn>
    </template>
    <template v-else>
      <v-btn
        depressed
        color="secondary"
        @click.native.stop="isLoginDialogVisible = true"
      >
        <v-icon>lock</v-icon>
        Log In
      </v-btn>
    </template>
    <v-dialog v-model="isLoginDialogVisible" width="650">
      <v-card class="pa-2">
        <div class="text-xs-center pa-4" v-if="isLoading">
          <v-progress-circular
            indeterminate
            color="primary"
            size="80"
          ></v-progress-circular>
        </div>
        <v-container grid-list-lg text-md-center v-if="!isLoading" pb-2>
          <v-layout fill-height row wrap>
            <v-flex md6>
              <v-layout fill-height column>
                Log in with your social account
                <v-flex>
                  <v-btn
                    color="black"
                    block
                    dark
                    @click="socialLogin('github')"
                  >
                    <v-icon>$vuetify.icons.github</v-icon>
                    Github
                  </v-btn>
                  <v-btn color="red" block dark @click="socialLogin('google')">
                    <v-icon>$vuetify.icons.google_plus</v-icon>
                    Google
                  </v-btn>
                  <v-btn
                    color="blue"
                    block
                    dark
                    @click="socialLogin('twitter')"
                  >
                    <v-icon>$vuetify.icons.twitter</v-icon>
                    Twitter
                  </v-btn>
                </v-flex>
              </v-layout>
            </v-flex>
            <v-flex md6>
              <v-layout fill-height column>
                <v-flex mt-3>
                  <v-form ref="form" @keyup.native.enter="onEnter">
                    <v-text-field
                      v-model="email.value"
                      :rules="email.rules"
                      prepend-icon="email"
                      name="email"
                      label="Email"
                      type="text"
                    ></v-text-field>
                    <v-text-field
                      v-model="password.value"
                      :rules="password.rules"
                      prepend-icon="lock"
                      name="password"
                      label="Password"
                      id="password"
                      type="password"
                    ></v-text-field>
                  </v-form>
                </v-flex>
                <v-btn flat small color="primary" @click="forgotPassword()"
                  >Forgot your password?</v-btn
                >
                <v-btn
                  @click.stop="isRegisterDialogVisible = true"
                  flat
                  small
                  color="primary"
                  >Create an account<RegisterDialog
                    v-model="isRegisterDialogVisible"
                    @register-success="onRegister"
                /></v-btn>
              </v-layout>
            </v-flex>
          </v-layout>
        </v-container>

        <v-divider class="my-2"></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="secondary"
            flat
            @click="isLoginDialogVisible = false"
            :disabled="isLoading"
          >
            Cancel
          </v-btn>
          <v-btn color="primary" @click="emailLogin" :disabled="isLoading"
            >Login</v-btn
          >
        </v-card-actions>

        <div v-if="!isLoading" ref="disclaimer">
          <small class="mb-0 pl-2">
            By creating an account you agree to the
            <router-link to="terms-of-service">
              <span @click="isLoginDialogVisible = false">
                Terms of Service
              </span>
            </router-link>
            and
            <router-link to="privacy-policy">
              <span @click="isLoginDialogVisible = false">
                Privacy policy</span
              ></router-link
            >.
          </small>
        </div>
      </v-card>

      <v-snackbar
        color="error"
        v-model="isInvalidCredentials"
        bottom
        :timeout="3000"
      >
        Invalid credentials, please try again.
      </v-snackbar>

      <v-snackbar color="error" v-model="hasLoginError" bottom :timeout="3000">
        There was a problem contacting the authentication server.<br />
        Please try again in a few moments.
      </v-snackbar>
    </v-dialog>

    <v-snackbar color="success" v-model="isLoginSuccess" bottom :timeout="3000">
      Welcome! You are now logged in.
    </v-snackbar>

    <v-snackbar
      color="success"
      v-model="isLogoutSuccess"
      bottom
      :timeout="3000"
    >
      You are now logged out.
    </v-snackbar>

    <v-snackbar
      color="success"
      v-model="isRegisterSuccess"
      bottom
      :timeout="6000"
    >
      Yon have been successfully registered and logged in.
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/utils/settings";
import { JWT } from "@/store/modules/session";
import firebase from "firebase/app";
import "firebase/auth";
import RegisterDialog from "@/components/RegisterDialog.vue";
import ResetRequest from "@/views/ResetRequest.vue";

export default Vue.extend({
  name: "LoginDialog",
  components: {
    RegisterDialog
  },
  data: () => ({
    isLoginSuccess: false,
    isLogoutSuccess: false,
    isInvalidCredentials: false,
    isLoading: false,
    isLoginDialogVisible: false,
    hasLoginError: false,
    isRegisterDialogVisible: false,
    isRegisterSuccess: false,
    email: {
      value: null,
      rules: [
        (v: string) => /.+@.+/.test(v) || "E-mail must be a valid address"
      ]
    },
    password: {
      value: null,
      rules: [(v: string) => !!v || "Enter your password"]
    },
    firebaseProviders: {
      github: new firebase.auth.GithubAuthProvider(),
      google: new firebase.auth.GoogleAuthProvider(),
      twitter: new firebase.auth.TwitterAuthProvider()
    }
  }),
  computed: {
    isAuthenticated() {
      return this.$store.state.session.isAuthenticated;
    }
  },
  beforeCreate() {
    firebase.initializeApp({
      apiKey: "AIzaSyApbLMKp7TprhjH75lpcmJs514uI11fEIo",
      authDomain: "dd-decaf-cfbf6.firebaseapp.com",
      databaseURL: "https://dd-decaf-cfbf6.firebaseio.com",
      projectId: "dd-decaf-cfbf6",
      storageBucket: "dd-decaf-cfbf6.appspot.com",
      messagingSenderId: "972933293195"
    });
  },
  methods: {
    onEnter() {
      if (this.$refs.form.validate()) {
        this.emailLogin();
      }
    },
    emailLogin() {
      this.isInvalidCredentials = false;
      this.login(
        { email: this.email.value, password: this.password.value },
        "local"
      ).then(() => {
        if (!this.isLoginSuccess) {
          return;
        }
        this.$store.dispatch("analytics/login", {
          signInMethod: "email",
          isNewUser: false
        });
      });
    },
    login(params: { [x: string]: any }, type: string) {
      this.isLoading = true;
      return axios
        .post(`${settings.apis.iam}/authenticate/${type}`, params)
        .then((response: AxiosResponse<JWT>) => {
          this.$store.commit("session/login", response.data);
          this.isLoginDialogVisible = false;
          this.isLoginSuccess = true;
          this.$store.dispatch("consents/addConsentsFromLocalStorage");
          this.$store.dispatch("fetchAllData");
          this.$store.dispatch("analytics/identifyUser", {
            registeredEmail: params.email,
            internalId: params.id,
            firebaseId: params.uid
          });
        })
        .catch(error => {
          if (error.response && error.response.status === 401) {
            this.isInvalidCredentials = true;
          } else {
            this.hasLoginError = true;
          }
        })
        .then(() => {
          this.isLoading = false;
        });
    },
    logout() {
      this.$store.commit("session/logout");
      this.$store.commit("consents/clearConsents");
      this.isLogoutSuccess = true;
      this.$store.dispatch("fetchAllData");
      this.$router.replace({ name: "home" });
      this.$store.dispatch("analytics/logout");
    },
    socialLogin(providerKey) {
      firebase.auth().signOut();
      const provider = this.firebaseProviders[providerKey];
      if (providerKey === "github") {
        provider.addScope("user:email");
      } else if (providerKey === "google") {
        provider.addScope("email");
      }
      return firebase
        .auth()
        .signInWithPopup(provider)
        .then((result: any) => {
          return firebase
            .auth()
            .currentUser!.getIdToken(true)
            .then(idToken => {
              const credentials = { uid: result.user.uid, token: idToken };
              this.login(credentials, "firebase").then(() => {
                if (!this.isLoginSuccess) {
                  return;
                }
                if (result.additionalUserInfo.isNewUser) {
                  this.$store.dispatch("consents/acceptGdprConsent", {
                    category: "registration",
                    message: this.$refs.disclaimer.textContent,
                    source: "web"
                  });
                }
                // Email is not passed to the login function, so we have to
                // identify user by email here.
                const email =
                  result.user.email || result.additionalUserInfo.profile.email;
                // Note: identifyUser and updateUser are not guarded by the
                // isNewUser check as we want to capture the information even
                // if it is not the first time the user logged in.
                const identifyPromise = email
                  ? this.$store.dispatch("analytics/identifyUser", {
                      registeredEmail: email
                    })
                  : Promise.resolve();
                identifyPromise.then(() => {
                  this.$store.dispatch("analytics/updateUser", {
                    email,
                    displayName: result.user.displayName,
                    photoUrl: result.user.photoURL,
                    phone: result.user.phoneNumber,
                    username: result.additionalUserInfo.username,
                    firstName: result.additionalUserInfo.profile.given_name,
                    lastName: result.additionalUserInfo.profile.family_name,
                    dateJoined: result.user.metadata.a // creation time timestamp
                  });
                });
                this.$store.dispatch("analytics/login", {
                  signInMethod: providerKey,
                  isNewUser: result.additionalUserInfo.isNewUser
                });
              });
            });
        })
        .catch(error => {
          this.hasLoginError = true;
        });
    },
    onRegister(params) {
      this.isLoginDialogVisible = false;
      this.isRegisterSuccess = true;

      this.$store.dispatch("consents/acceptGdprConsent", {
        category: "registration",
        message: this.$refs.disclaimer.textContent,
        source: "web"
      });
      this.$store
        .dispatch("analytics/identifyUser", {
          registeredEmail: params.email
        })
        .then(() => {
          this.$store.dispatch("analytics/updateUser", {
            ...params,
            password: undefined, // Hide user's password
            dateJoined: new Date().getTime()
          });
        });
      this.$store.dispatch("analytics/login", {
        signInMethod: "email",
        isNewUser: true
      });
    },
    forgotPassword() {
      this.isLoginDialogVisible = false;
      this.$router.push({ name: "resetRequest" });
    }
  }
});
</script>
