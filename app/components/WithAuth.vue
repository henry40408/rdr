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
          <button
            type="button"
            :disabled="!systemSettings.canSignup"
            :class="{ 'opacity-50 cursor-not-allowed': !systemSettings.canSignup }"
            class="p-2 bg-blue-800 text-white hover:bg-blue-700 hover:cursor-pointer"
            @click="signup"
          >
            Sign Up
          </button>
          <button
            type="submit"
            :disabled="!systemSettings.canLogin"
            :class="{ 'opacity-50 cursor-not-allowed': !systemSettings.canLogin }"
            class="p-2 bg-green-800 text-white hover:bg-green-700 hover:cursor-pointer"
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
