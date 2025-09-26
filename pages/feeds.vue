<template>
  <h1>Categories &amp; feeds</h1>
  <Nav />
  <template v-for="category in data" :key="category.id">
    <h2>{{ category.name }}</h2>
    <table>
      <thead>
        <tr>
          <th>Feed</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="feed in category.feeds" :key="feed.id">
          <td>
            <div>
              <a :href="feed.htmlUrl" target="_blank" rel="noopener noreferrer">{{ feed.title }}</a>
            </div>
            <div>
              <small>{{ feed.xmlUrl }}</small>
            </div>
          </td>
          <td>
            <RefreshFeed :feedId="feed.id" />
          </td>
        </tr>
      </tbody>
    </table>
  </template>
</template>

<script setup>
const { data } = await useFetch("/api/categories");
</script>
