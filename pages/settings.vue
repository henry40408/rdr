<template>
  <header>
    <h1>Settings</h1>
    <Nav />
  </header>
  <main>
    <h2>Background jobs</h2>
    <div v-if="jobsData">
      <table>
        <thead>
          <tr>
            <th>Job</th>
            <th>Last Run</th>
            <th>Next Run</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="job in jobsData" :key="job.name">
            <td>
              <div>{{ job.name }}</div>
              <div>
                <small>{{ job.description }}</small>
              </div>
            </td>
            <td>
              <ClientDateTime v-if="job.lastDate" :datetime="job.lastDate" />
              <span v-else>never</span>
            </td>
            <td>
              <ClientDateTime v-if="job.nextDate" :datetime="job.nextDate" />
              <span v-else>never</span>
            </td>
            <td>
              <button @click="triggerJob(job.name)" :disabled="triggeringJobs.has(job.name)">
                {{ triggeringJobs.has(job.name) ? "Triggering..." : "Trigger" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<script setup>
const { data: jobsData } = await useFetch("/api/jobs");

const triggeringJobs = ref(new Set());

/**
 * @param {string} name
 */
async function triggerJob(name) {
  if (triggeringJobs.value.has(name)) return;
  triggeringJobs.value.add(name);
  try {
    await $fetch(`/api/jobs/${name}/run`, { method: "POST" });
  } catch (err) {
    console.error("Failed to run job", err);
  } finally {
    triggeringJobs.value.delete(name);
  }
}
</script>
