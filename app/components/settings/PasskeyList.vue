<template>
  <q-list>
    <q-item-label header>WebAuthn (Passkeys)</q-item-label>
    <q-item>
      <q-btn icon="add" color="primary" label="Register a passkey" @click="onRegisterPasskey()" />
    </q-item>
    <SettingsPasskeyItem v-for="passkey in store.passkeys" :key="passkey.id" :passkey="passkey" />
    <q-banner v-if="store.passkeys.length === 0" :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'">
      <q-icon name="info" class="q-mr-sm" />
      You have no registered passkeys. Add one to enhance your account security and enable passwordless login.
    </q-banner>
  </q-list>
</template>

<script setup lang="ts">
const $q = useQuasar();

const store = usePasskeyStore();

async function onRegisterPasskey() {
  $q.dialog({
    title: "Add Passkey",
    message: "Add a new passkey to your account. Give it a display name to help you identify it later.",
    prompt: {
      type: "text",
      model: "",
      label: "Enter a display name for the new passkey",
    },
    cancel: true,
    ok: { label: "Add" },
  }).onOk(async (displayName) => {
    await store.registerPasskey(displayName);
    await store.load();
  });
}
</script>
