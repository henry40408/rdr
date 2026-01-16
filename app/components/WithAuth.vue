<template>
  <slot v-if="loggedIn" />
  <div v-else class="mx-auto max-w-md min-h-screen w-1/2 p-4 justify-center flex items-center">
    <div class="border p-4 space-y-2">
      <div class="text-lg font-semibold">Login / Sign up</div>
      <form class="space-y-2" @submit.prevent="login">
        <div v-if="error" class="p-2 bg-red-500 text-white">{{ error }}</div>
        <input v-model="username" required type="text" placeholder="Username" class="w-full p-2 border" />
        <input v-model="password" required type="password" placeholder="Password" class="w-full p-2 border" />
        <div class="text-right space-x-2">
          <XButton
            type="button"
            variant="secondary"
            :pending="signingUp"
            :disabled="!systemSettings.canSignup"
            @click="signup"
          >
            Sign Up
          </XButton>
          <XButton type="submit" variant="primary" :pending="loggingIn" :disabled="!systemSettings.canLogin"
            >Login</XButton
          >
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const { loggedIn, fetch: fetchSession } = useUserSession();

const systemSettings = useSystemSettings();
await callOnce(() => systemSettings.load());

const error = ref("");
const username = ref("");
const password = ref("");
const loggingIn = ref(false);
const signingUp = ref(false);

async function login() {
  error.value = "";
  loggingIn.value = true;
  try {
    await $fetch("/api/login", {
      method: "POST",
      body: { username: username.value, password: password.value },
    });
    username.value = "";
    password.value = "";
    await fetchSession();
  } catch (e) {
    error.value = String(e);
  } finally {
    loggingIn.value = false;
  }
}

async function signup() {
  error.value = "";
  signingUp.value = true;
  try {
    await $fetch("/api/signup", {
      method: "POST",
      body: { username: username.value, password: password.value },
    });
    username.value = "";
    password.value = "";
    await fetchSession();
  } catch (e) {
    error.value = String(e);
  } finally {
    signingUp.value = false;
  }
}
</script>
