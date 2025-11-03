<template>
  <v-app>
    <v-layout>
      <v-main class="h-screen d-flex justify-center align-center">
        <v-card class="w-75" :loading="loading">
          <v-card-title class="mb-4">Login / Sign up</v-card-title>
          <v-card-text>
            <v-alert v-if="error" class="mb-4" type="error">
              {{ error }}
            </v-alert>
            <v-form @submit.prevent="onSubmit('login')">
              <v-text-field v-model="username" outlined required label="Username"></v-text-field>
              <v-text-field v-model="password" outlined required type="password" label="Password"></v-text-field>
              <div class="flex ga-4 justify-end">
                <v-btn text color="secondary" :loading="loading" @click="onSubmit('signup')">Sign Up</v-btn>
                <v-btn type="submit" color="primary" :loading="loading">Login</v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
const error = ref("");
const loading = ref(false);
const password = ref("");
const username = ref("");

const { fetch: fetchSession } = useUserSession();

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
    await fetchSession();
  } catch (err) {
    error.value = String(err);
  } finally {
    loading.value = false;
  }
}

/** @param {'login' | 'signup'} action */
async function onSubmit(action) {
  if (action === "login") login();
  else signup();
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
    await fetchSession();
  } catch (err) {
    error.value = String(err);
  } finally {
    loading.value = false;
  }
}
</script>
