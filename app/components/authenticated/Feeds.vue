<template>
  <div class="flex h-screen">
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-full flex flex-col',
        'border-r dark:border-gray-500',
        'transition-transform duration-200 ease-in-out',
        'md:static md:basis-1/4 md:h-screen',
        'bg-gray-300 dark:bg-gray-800',
        'text-sm md:text-base',
        leftDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ]"
    >
      <div class="p-2 space-y-4 border-b dark:border-b-gray-500">
        <div class="flex justify-between items-center">
          <div class="font-bold">
            <a href="/" class="hover:underline">rdr</a>
          </div>
          <button
            class="md:hidden hover:bg-gray-700 border py-1 px-3 hover:cursor-pointer"
            @click="leftDrawerOpen = false"
          >
            &times;
          </button>
        </div>
        <div class="font-bold">Navigation</div>
        <nav class="space-x-4">
          <NuxtLink to="/">Home</NuxtLink>
          <NuxtLink to="/feeds">Feeds</NuxtLink>
        </nav>
        <div class="font-bold">Feeds</div>
      </div>
      <div class="flex-1 overflow-y-auto border-b dark:border-b-gray-500">
        <FeedsSideCategoryList />
      </div>
      <div class="p-2 space-y-2">
        <div class="text-sm">
          <div>
            Logged in as <strong>{{ session?.user?.username }}</strong>
          </div>
          <div>Logged in at <DateTime :datetime="session?.loggedInAt" /></div>
        </div>
        <div class="text-sm">Version: {{ $config.public.version }}</div>
        <LogoutButton class="w-full" />
      </div>
    </aside>

    <main class="md:basis-3/4 flex flex-col h-screen overflow-y-hidden">
      <div class="p-2 border-b border-b-gray-500 dark:border-b-gray-500 space-y-2">
        <div class="flex items-center space-x-2">
          <button
            class="md:hidden hover:bg-gray-700 border py-1 px-3 hover:cursor-pointer"
            @click="leftDrawerOpen = true"
          >
            &#9776;
          </button>
          <div class="text-2xl font-bold">Categories &amp; Feeds</div>
        </div>
        <FeedsCategoryListOptions />
      </div>
      <div class="overflow-y-auto flex-1">
        <FeedsCategoryList />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const store = useCategoryStore();
const { session } = useUserSession();

await callOnce(() => store.load());
useHead({
  title: "Feeds - rdr",
});

const leftDrawerOpen = ref(false);
</script>
