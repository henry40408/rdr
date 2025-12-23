<template>
  <q-item>
    <q-item-section>
      <q-item-label>
        {{ user.username }}
        <span class="q-gutter-xs">
          <q-badge v-if="isCurrentUser">You</q-badge>
          <q-badge v-if="user.isAdmin" color="secondary">Admin</q-badge>
        </span>
      </q-item-label>
    </q-item-section>
    <q-item-section side>
      <q-toggle v-model="enabled" :disable="isCurrentUser" />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
const props = defineProps<{
  user: {
    id: number;
    username: string;
    isAdmin: boolean;
    disabledAt?: string;
  };
}>();

const { session } = useUserSession();

const isCurrentUser = computed(() => props.user.username === session?.value?.user?.username);

const enabled = ref(!props.user.disabledAt);
</script>
