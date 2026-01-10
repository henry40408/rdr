<template>
  <slot v-if="loggedIn" />
  <div v-else class="mx-auto max-w-md min-h-screen w-1/2 p-4 justify-center flex items-center">
    <div class="border p-4 rounded space-y-2 dark:border-gray-700 dark:bg-gray-800">
      <div class="text-lg font-semibold dark:text-white">Login / Sign up</div>
      <form class="space-y-2" @submit.prevent="login">
        <div v-if="error" class="text-red-600 bg-red-100 p-2 rounded">{{ error }}</div>
        <input
          v-model="username"
          required
          type="text"
          placeholder="Username"
          class="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
        />
        <input
          v-model="password"
          required
          type="password"
          placeholder="Password"
          class="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
        />
        <div class="text-right space-x-2">
          <button
            type="button"
            :disabled="!systemSettings.canSignup"
            class="bg-green-600 text-white p-2 rounded hover:bg-green-700"
            :class="{ 'opacity-50 cursor-not-allowed': !systemSettings.canSignup }"
            @click="signup"
          >
            Sign Up
          </button>
          <button
            type="submit"
            :disabled="!systemSettings.canLogin"
            class="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            :class="{ 'opacity-50 cursor-not-allowed': !systemSettings.canLogin }"
          >
            Login
          </button>
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

async function login() {
  error.value = "";
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
  }
}

async function signup() {
  error.value = "";
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
  }
}
</script>
