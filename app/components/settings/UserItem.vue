<template>
  <q-item>
    <q-item-section>
      <q-item-label>
        {{ user.username }}
        <span class="q-gutter-xs">
          <q-badge v-if="isCurrentUser">You</q-badge>
          <q-badge v-if="user.isAdmin" color="accent">Admin</q-badge>
          <q-badge v-else color="secondary">User</q-badge>
        </span>
      </q-item-label>
      <q-item-label caption>
        Disabled at:
        <DateTime v-if="user.disabledAt" :datetime="user.disabledAt" />
        <span v-else>-</span>
      </q-item-label>
    </q-item-section>
    <q-item-section side>
      <q-toggle :model-value="enabled" :disable="isCurrentUser || pending" @update:model-value="toggleUser" />
    </q-item-section>
  </q-item>
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

const isCurrentUser = computed(() => props.user.username === session?.value?.user?.username);

const enabled = ref(!props.user.disabledAt);

const { pending, execute, error } = useFetch(`/api/users/${props.user.id}/toggle`, {
  method: "PUT",
  immediate: false,
});
async function toggleUser() {
  const oldVal = enabled.value;
  try {
    await execute();
    if (error.value) throw error.value;
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
  }
}
</script>
