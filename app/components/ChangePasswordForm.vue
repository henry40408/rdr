<template>
  <q-form class="q-gutter-md" @submit.prevent="onSubmit">
    <q-banner v-if="error" class="bg-negative text-white">
      {{ error }}
    </q-banner>
    <q-input v-model="currentPassword" required standout type="password" label="Current Password" />
    <q-input v-model="newPassword" required standout type="password" label="New Password" />
    <q-input v-model="confirmPassword" required standout type="password" label="Confirm New Password" />
    <q-btn type="submit" color="primary" :loading="loading" label="Change Password" />
  </q-form>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar";

const $q = useQuasar();

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");

const loading = ref(false);
const error = ref("");

const { fetch: fetchSession } = useUserSession();

async function onSubmit() {
  loading.value = true;
  try {
    await $fetch("/api/change-password", {
      method: "POST",
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
        confirmPassword: confirmPassword.value,
      },
    });
    fetchSession();
    $q.notify({
      type: "positive",
      message: "Password changed successfully. Please log in again.",
      actions: [{ label: "Close", color: "white" }],
    });
  } catch (err) {
    error.value = String(err);
  } finally {
    loading.value = false;
  }
}
</script>
