<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center">
        <q-card style="width: 80vw">
          <q-card-section header class="text-h6">Login / Sign up</q-card-section>
          <q-card-section v-if="error" class="bg-negative text-white">
            {{ error }}
          </q-card-section>
          <form @submit.prevent="onSubmit('login')">
            <q-card-section class="q-gutter-md">
              <q-input v-model="username" outlined required label="Username" />
              <q-input v-model="password" outlined required type="password" label="Password" />
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat label="Sign Up" color="secondary" :loading="loading" @click="onSubmit('signup')" />
              <q-btn label="Login" type="submit" color="primary" :loading="loading" />
            </q-card-actions>
          </form>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const { fetch: fetchSession } = useUserSession();

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
    await fetchSession();
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
    await fetchSession();
  } catch (err) {
    error.value = String(err);
  } finally {
    loading.value = false;
  }
}
</script>
