<template>
  <div>
    <template v-if="isAuthenticated">
      <v-btn color="secondary" depressed @click="logout">
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
        <v-container grid-list-lg text-md-center v-if="!isLoading">
          <v-layout fill-height row wrap>
            <v-flex md6>
              <v-layout fill-height column>
                <v-flex>
                  Log in with your social account
                </v-flex>
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
                <v-flex>
                  Or you can
                  <a href="mailto:niso@biosustain.dtu.dk">contact us</a> and we
                  provide you with credentials
                </v-flex>
                <v-flex>
                  <v-form @keyup.native.enter="emailLogin">
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
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import * as settings from "@/settings";
import { JWT } from "@/store/modules/session";
import firebase from "firebase/app";
import "firebase/auth";

export default Vue.extend({
  name: "LoginDialog",
  data: () => ({
    isLoginSuccess: false,
    isLogoutSuccess: false,
    isInvalidCredentials: false,
    isLoading: false,
    isLoginDialogVisible: false,
    hasLoginError: false,
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
  methods: {
    emailLogin() {
      this.isInvalidCredentials = false;
      this.login(
        { email: this.email.value, password: this.password.value },
        "local"
      );
    },
    login(params: object, type: string) {
      this.isLoading = true;
      axios
        .post(`${settings.apis.iam}/authenticate/${type}`, params)
        .then((response: AxiosResponse<JWT>) => {
          this.$store.commit("session/login", response.data);
          this.isLoginDialogVisible = false;
          this.isLoginSuccess = true;
          this.$store.dispatch("fetchAllData");
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
      this.isLogoutSuccess = true;
      this.$store.dispatch("fetchAllData");
      this.$router.replace({ name: "home" });
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
              this.login(credentials, "firebase");
            });
        })
        .catch(error => {
          this.hasLoginError = true;
        });
    }
  },
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
  }
});
</script>
