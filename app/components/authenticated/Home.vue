<template>
  <div class="flex h-screen">
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-full flex flex-col',
        'border-r dark:border-gray-500',
        'transition-transform duration-200 ease-in-out',
        'md:static md:w-1/4 md:h-screen',
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
          <NuxtLink href="/">Home</NuxtLink>
          <NuxtLink href="/feeds">Feeds</NuxtLink>
          <NuxtLink href="/settings">Settings</NuxtLink>
        </nav>
        <div class="font-bold">Categories &amp; Feeds</div>
        <HomeCategoryListOptions />
      </div>
      <div class="flex-1 overflow-y-auto border-b dark:border-b-gray-500">
        <HomeCategoryList />
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

    <main class="flex-1 flex flex-col h-screen overflow-hidden">
      <div class="p-2 space-y-2 border-b dark:border-b-gray-500">
        <div class="flex items-center space-x-2">
          <button
            class="md:hidden hover:bg-gray-700 border py-1 px-3 hover:cursor-pointer"
            @click="leftDrawerOpen = true"
          >
            &#9776;
          </button>
          <HomeEntryListHeader />
        </div>
        <HomeEntryListOptions />
      </div>
      <div ref="list" class="flex-1 overflow-y-auto">
        <HomeEntryList />
      </div>
    </main>
  </div>
  <button
    class="fixed bottom-8 right-8 bg-gray-600 hover:bg-gray-500 text-white rounded-full w-16 h-16 text-4xl rounded-full hover:cursor-pointer"
    @click="eventBus.emit(EVENT_COLLAPSE_OPENED)"
  >
    &times;
  </button>
</template>

<script setup lang="ts">
const entryStore = useEntryStore();
const featuresStore = useFeaturesStore();
const { session } = useUserSession();

await callOnce(() => Promise.all([entryStore.load(), featuresStore.load()]));
const countLabel = computed(() => {
  const count = entryStore.count;
  if (count > 999) return "999+";
  return count.toString();
});
useHead({ title: () => `(${countLabel.value}) rdr` });

const leftDrawerOpen = ref(false);

const el = useTemplateRef("list");
useInfiniteScroll(
  el,
  () => {
    entryStore.loadMore();
  },
  {
    canLoadMore: () => entryStore.hasMore && !entryStore.pending,
    distance: 10,
  },
);
</script>
