<template>
  <q-item>
    <q-item-section>
      <q-item-label>
        <span v-if="passkey.displayName">{{ passkey.displayName }}</span>
        <q-badge v-else color="secondary">Unnamed</q-badge>
      </q-item-label>
      <q-item-label caption>
        Credential ID: {{ passkey.credentialId }}, Created at:
        <DateTime :datetime="passkey.createdAt" />
      </q-item-label>
    </q-item-section>
    <q-item-section side>
      <q-btn flat round icon="delete" color="negative" @click="onDeletePasskey()" />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
const $q = useQuasar();

const props = defineProps<{
  passkey: {
    id: number;
    credentialId: string;
    createdAt: string;
    displayName?: string;
  };
}>();

const store = usePasskeyStore();

async function onDeletePasskey() {
  $q.dialog({
    title: "Delete Passkey",
    message: `Are you sure you want to delete the passkey "${props.passkey.displayName || props.passkey.credentialId}"? This action cannot be undone.`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(async () => {
    await store.deletePasskey(props.passkey.id);
    await store.load();
  });
}
</script>
