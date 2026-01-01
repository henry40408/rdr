<template>
  <q-expansion-item>
    <template #header>
      <q-item-section side>
        <q-toggle
          :model-value="enabled"
          :disable="user.username === session?.user?.username || toggling"
          @update:model-value="toggleUser"
        />
      </q-item-section>
      <q-item-section>
        <q-item-label>
          {{ user.username }}
          <q-badge v-if="user.username === session?.user?.username">You</q-badge>
        </q-item-label>
      </q-item-section>
    </template>

    <q-list>
      <q-item>
        <q-item-section>
          <q-item-label caption>Role</q-item-label>
          <q-item-label>
            <q-badge v-if="user.isAdmin" color="accent">Admin</q-badge>
            <q-badge v-else color="secondary">User</q-badge>
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label caption>Disabled at</q-item-label>
          <q-item-label>
            <DateTime v-if="user.disabledAt" :datetime="user.disabledAt" />
            <span v-else>-</span>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-expansion-item>
</template>

<script setup lang="ts">
const $q = useQuasar();

const props = defineProps<{
  user: {
    id: number;
    username: string;
    isAdmin: boolean;
    disabledAt?: string;
  };
}>();

const { session } = useUserSession();
const store = useUserStore();

const enabled = ref(!props.user.disabledAt);

const toggling = ref(false);
async function toggleUser() {
  const oldVal = enabled.value;
  try {
    toggling.value = true;
    await $fetch(`/api/users/${props.user.id}/toggle`, { method: "PUT" });
    $q.notify({
      type: "positive",
      message: `User "${props.user.username}" has been ${oldVal ? "disabled" : "enabled"}.`,
    });
    enabled.value = !oldVal;
    store.load();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to ${enabled.value ? "enable" : "disable"} user "${props.user.username}": ${err}`,
    });
    enabled.value = oldVal; // revert toggle on error
  } finally {
    toggling.value = false;
  }
}
</script>
