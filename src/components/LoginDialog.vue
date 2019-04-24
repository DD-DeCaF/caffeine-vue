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
      <v-card>
        <div class="text-xs-center pa-4">
          <v-progress-circular
            indeterminate
            color="primary"
            size="80"
            v-if="isLoading"
          ></v-progress-circular>
        </div>
        <v-container grid-list-md text-md-center v-if="!isLoading">
          <v-layout fill-height row wrap>
            <v-flex md6>
              <v-layout fill-height column>
                <v-flex>
                  Log in with your social account
                </v-flex>
                <v-flex>
                  <v-btn color="black" block dark>
                    <v-icon>$vuetify.icons.github</v-icon>
                    Github
                  </v-btn>
                  <v-btn color="red" block dark @click="loginGoogle">
                    <v-icon>$vuetify.icons.google_plus</v-icon>
                    Google
                  </v-btn>
                  <v-btn color="blue" block dark>
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
                  <v-form>
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

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" flat @click="isLoginDialogVisible = false">
            Cancel
          </v-btn>
          <v-btn color="primary" @click="emailLogin">Login</v-btn>
        </v-card-actions>
      </v-card>

      <v-snackbar v-model="isInvalidCredentials" bottom>
        Invalid credentials, please try again.
        <v-btn color="error" flat @click="isInvalidCredentials = false">
          Close
        </v-btn>
      </v-snackbar>

      <v-snackbar v-model="isLoginError" bottom>
        There was a problem contacting the authentication server.<br />
        Please try again in a few moments.
        <v-btn color="error" flat @click="isLoginError = false">
          Close
        </v-btn>
      </v-snackbar>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import { AxiosResponse } from "axios";
import settings from "@/settings";
import { JWT } from "@/store/session";
import firebase from "firebase";

export default Vue.extend({
  name: "LoginDialog",
  data: () => ({
    isInvalidCredentials: false,
    isLoading: false,
    isLoginDialogVisible: false,
    isLoginError: false,
    email: {
      value: null,
      rules: [
        (v: string) => /.+@.+/.test(v) || "E-mail must be a valid address"
      ]
    },
    password: {
      value: null,
      rules: [(v: string) => !!v || "Enter your password"]
    }
  }),
  computed: {
    isAuthenticated() {
      return this.$store.state.session.isAuthenticated;
    }
  },
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
        })
        .catch(error => {
          if (error.response && error.response.status === 401) {
            this.isInvalidCredentials = true;
          } else {
            this.isLoginError = true;
          }
        })
        .then(() => {
          this.isLoading = false;
        });
    },
    logout() {
      this.$store.commit("session/logout");
    },
    loginGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();

      firebase
        .auth()
        .signInWithPopup(provider)
        .then(result => {})
        .catch(error => {
          if (error.response && error.response.status === 401) {
            this.isInvalidCredentials = true;
          } else {
            this.isLoginError = true;
          }
        });
    }
  }
});
</script>
