<template>
  <h1>Categories &amp; feeds</h1>
  <Nav />
  <template v-for="category in data" :key="category.id">
    <h2>{{ category.name }}</h2>
    <div>
      <RefreshCategory :categoryId="category.id" @refreshed="refreshAll()" />
    </div>
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
              <img
                v-if="imageExists(feed.id)"
                :src="`/api/feeds/${feed.id}/image`"
                alt="Feed Image"
                class="feed-image"
              />
              <a :href="feed.htmlUrl" target="_blank" rel="noopener noreferrer">{{ feed.title }}</a>
            </div>
            <div>
              <small>{{ feed.xmlUrl }}</small>
            </div>
          </td>
          <td>
            <RefreshFeed :feedId="feed.id" @refreshed="refreshAll()" />
          </td>
        </tr>
      </tbody>
    </table>
  </template>
</template>

<script setup lang="ts">
import { exec } from "child_process";

const { data, execute: refreshCategories } = await useFetch("/api/categories");
const { data: imagePks, execute: refreshImages } = await useFetch<string[]>("/api/feed-image-pks");

async function refreshAll() {
  await refreshCategories();
  await refreshImages();
}

function imageExists(feedId: string): boolean {
  return (imagePks && imagePks.value?.includes(feedId)) || false;
}
</script>

<style scoped>
.feed-image {
  width: 1rem;
  height: 1rem;
  vertical-align: middle;
  margin-right: 0.25rem;
}
</style>
