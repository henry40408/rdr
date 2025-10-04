<template>
  <header>
    <h1>Settings</h1>
    <Nav />
  </header>
  <main>
    <h2>Export OPML</h2>
    <p><a href="/api/opml">Download</a></p>
    <h2>Background jobs</h2>
    <div v-if="jobsData">
      <table>
        <thead>
          <tr>
            <th>Job</th>
            <th>Last Run</th>
            <th>Next Run</th>
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
              <ClientSideDateTime v-if="job.lastDate" :datetime="job.lastDate" />
              <span v-else>never</span>
            </td>
            <td>
              <ClientSideDateTime v-if="job.nextDate" :datetime="job.nextDate" />
              <span v-else>never</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<script setup>
const { data: jobsData } = await useFetch("/api/jobs");
</script>
