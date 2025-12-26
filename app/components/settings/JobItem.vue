<template>
  <q-expansion-item>
    <template #header>
      <q-item-section side>
        <q-icon v-if="job.lastError" name="error" color="negative" />
        <q-icon v-else name="schedule" :color="job.pausedAt ? 'negative' : 'positive'" />
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ job.name }}</q-item-label>
        <q-item-label caption>{{ job.description }}</q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-toggle :disable="toggling" :model-value="enabled" @update:model-value="toggleJob" />
      </q-item-section>
    </template>

    <q-list>
      <q-item>
        <q-item-section>
          <q-item-label caption>Paused at</q-item-label>
          <q-item-label>
            <DateTime v-if="job.pausedAt" :datetime="job.pausedAt" />
            <span v-else>Not paused</span>
          </q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label caption>Last run</q-item-label>
          <q-item-label>
            <DateTime v-if="job.lastDate" :datetime="job.lastDate" />
            <span v-else>Never</span>
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label caption>Last error</q-item-label>
          <q-item-label>
            <span v-if="job.lastError">{{ job.lastError }}</span>
            <span v-else>None</span>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-expansion-item>
</template>

<script setup lang="ts">
const $q = useQuasar();

const props = defineProps<{
  job: {
    name: string;
    description: string;
    lastDate?: string;
    lastError?: string;
    pausedAt?: string;
  };
}>();

const enabled = ref(!props.job.pausedAt);

const store = useJobStore();

const toggling = ref(false);
async function toggleJob() {
  const oldVal = enabled.value;
  enabled.value = !oldVal;
  try {
    await $fetch(`/api/jobs/${props.job.name}/toggle`, { method: "PUT" });
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
  } finally {
    toggling.value = false;
  }
}
</script>
