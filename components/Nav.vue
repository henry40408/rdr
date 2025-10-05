<template>
  <nav>
    <ul>
      <li>
        <NuxtLink to="/"> &#x1F3E0; Home</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/feeds"> &#x1F5E8; Feeds</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/settings">&#x1F6E0; Settings</NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
nav ul {
  display: flex;
  gap: 1rem;
  list-style: none;
  padding: 0;
  justify-content: center;
}
</style>
