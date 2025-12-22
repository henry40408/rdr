<template>
  <q-list padding>
    <q-item-label header>WebAuthn (Passkeys)</q-item-label>
    <q-item>
      <q-btn icon="add" color="primary" label="Add a passkey" @click="onAddPasskey()" />
    </q-item>
    <SettingsPasskeyItem v-for="passkey in store.passkeys" :key="passkey.id" :passkey="passkey" />
  </q-list>
</template>

<script setup lang="ts">
const $q = useQuasar();

const store = usePasskeyStore();

async function onAddPasskey() {
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
    await store.addPasskey(displayName);
    await store.load();
  });
}
</script>
