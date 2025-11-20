<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center">
        <q-card style="width: 80vw">
          <q-card-section header class="text-h6">Login / Sign up</q-card-section>
          <q-card-section v-if="error" class="bg-negative text-white">
            {{ error }}
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-btn
              icon="key"
              color="primary"
              :loading="loading"
              label="Login with WebAuthn"
              :disable="!systemSettings?.canLogin"
              @click="loginWithWebAuthn"
            />
          </q-card-section>
          <q-separator />
          <form @submit.prevent="onSubmit('login')">
            <q-card-section class="q-gutter-md">
              <q-input v-model="username" outlined required label="Username" />
              <q-input v-model="password" outlined required type="password" label="Password" />
            </q-card-section>
            <q-card-actions align="right">
              <q-btn
                flat
                label="Sign Up"
                icon="person_add"
                :loading="loading"
                :disabled="!systemSettings?.canSignup"
                @click="onSubmit('signup')"
              />
              <q-btn
                icon="login"
                label="Login"
                type="submit"
                color="primary"
                :loading="loading"
                :disabled="!systemSettings?.canLogin"
              />
            </q-card-actions>
          </form>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar";

const emit = defineEmits<{ authenticated: [] }>();

const $q = useQuasar();

const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const { authenticate } = useWebAuthn();

const { data: systemSettings } = await useFetch("/api/system-settings");

async function onSubmit(action: "login" | "signup") {
  if (action === "login") login();
  else signup();
}

async function login() {
  error.value = "";
  loading.value = true;
  try {
    await $fetch("/api/login", {
      method: "POST",
      body: {
        username: username.value,
        password: password.value,
      },
    });
    $q.notify({
      type: "positive",
      message: "Log in successfully.",
    });
    emit("authenticated");
  } catch (err) {
    error.value = String(err);
  } finally {
    loading.value = false;
  }
}

async function loginWithWebAuthn() {
  error.value = "";
  loading.value = true;
  try {
    await authenticate();
    $q.notify({
      type: "positive",
      message: "Authenticate with WebAuthn successfully.",
    });
    emit("authenticated");
  } catch (err) {
    error.value = String(err);
  } finally {
    loading.value = false;
  }
}

async function signup() {
  error.value = "";
  loading.value = true;
  try {
    await $fetch("/api/signup", {
      method: "POST",
      body: {
        username: username.value,
        password: password.value,
      },
    });
    $q.notify({
      type: "positive",
      message: "Sign up successfully.",
    });
    emit("authenticated");
  } catch (err) {
    error.value = String(err);
  } finally {
    loading.value = false;
  }
}
</script>
