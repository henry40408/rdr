<template>
  <q-item>
    <q-item-section side>
      <q-icon name="schedule" :color="job.pausedAt ? 'negative' : 'positive'" />
    </q-item-section>
    <q-item-section>
      <q-item-label>{{ job.name }}</q-item-label>
      <q-item-label caption>{{ job.description }}</q-item-label>
      <q-item-label caption>
        Paused at: <DateTime v-if="job.pausedAt" :datetime="job.pausedAt" /> <span v-else>Not paused</span>, Last run:
        <DateTime v-if="job.lastDate" :datetime="job.lastDate" />
        <span v-else>Never</span>
      </q-item-label>
    </q-item-section>
    <q-item-section side>
      <q-toggle :disable="pending" :model-value="enabled" @update:model-value="toggleJob" />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
const $q = useQuasar();

const props = defineProps<{
  job: {
    name: string;
    description: string;
    lastDate?: string;
    pausedAt?: string;
  };
}>();

const enabled = ref(!props.job.pausedAt);

const store = useJobStore();

const { pending, execute, error } = useFetch(`/api/jobs/${props.job.name}/toggle`, {
  key: `toggle-job-${props.job.name}`,
  method: "PUT",
  immediate: false,
});
async function toggleJob() {
  const oldVal = enabled.value;
  try {
    await execute();
    if (error.value) throw error.value;
    $q.notify({
      type: "positive",
      message: `Job "${props.job.name}" has been ${oldVal ? "paused" : "resumed"}.`,
    });
    enabled.value = !oldVal;
    store.load();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to update job status: ${err}`,
    });
    enabled.value = oldVal; // revert on failure
  }
}
</script>
