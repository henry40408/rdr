<template>
  <slot v-if="loggedIn" />
  <q-layout v-else view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center">
        <q-card style="width: 80vw">
          <q-card-section header class="text-h6">Login / Sign up</q-card-section>
          <q-card-section v-if="error" class="bg-negative text-white">
            {{ error }}
          </q-card-section>
          <q-separator />
          <q-card-section>
            <ClientOnly>
              <q-btn
                icon="key"
                color="primary"
                :loading="loading"
                label="Login with WebAuthn"
                :disable="!isWebAuthnSupported"
                @click="loginWithWebAuthn"
              />
            </ClientOnly>
          </q-card-section>
          <q-separator />
          <q-form @submit="login">
            <q-card-section class="q-gutter-md">
              <q-input v-model="username" outlined required label="Username" autocomplete="username" />
              <q-input
                v-model="password"
                outlined
                required
                type="password"
                label="Password"
                autocomplete="current-password"
              />
            </q-card-section>
            <q-card-actions align="right">
              <q-btn
                flat
                label="Sign Up"
                icon="person_add"
                :loading="loading"
                :disable="!store.canSignup"
                @click="signup"
              />
              <q-btn
                icon="login"
                label="Login"
                type="submit"
                color="primary"
                :loading="loading"
                :disable="!store.canLogin"
              />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
const $q = useQuasar();
const store = useSystemSettingsStore();
const { loggedIn, fetch: fetchSession } = useUserSession();
const { authenticate, isSupported } = useWebAuthn();

const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const isWebAuthnSupported = computed(() => store.canLogin && isSupported.value);

async function login() {
  error.value = "";
  loading.value = true;
  try {
    await $fetch("/api/login", {
      method: "POST",
      body: { username: username.value, password: password.value },
    });
    await fetchSession();
    $q.notify({
      type: "positive",
      message: "Log in successfully.",
    });
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
    await fetchSession();
    $q.notify({
      type: "positive",
      message: "Authenticate with WebAuthn successfully.",
    });
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
      body: { username: username.value, password: password.value },
    });
    await fetchSession();
    $q.notify({
      type: "positive",
      message: "Sign up successfully.",
    });
  } catch (err) {
    error.value = String(err);
  } finally {
    loading.value = false;
  }
}
</script>
