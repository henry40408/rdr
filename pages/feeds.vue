<template>
  <h1>Categories &amp; feeds</h1>
  <Nav />
  <ol>
    <template v-for="category in data" :key="category.id">
      <li>{{ category.name }}</li>
      <ol>
        <li v-for="feed in category.feeds" :key="feed.id">
          <a :href="feed.htmlUrl" target="_blank" rel="noopener noreferrer">{{
            feed.title
          }}</a>
        </li>
      </ol>
    </template>
  </ol>
</template>

<script setup>
const { data } = await useFetch("/api/categories");
</script>
