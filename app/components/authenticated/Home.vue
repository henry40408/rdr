<template>
  <div class="flex h-screen">
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-full p-2 flex flex-col space-y-4',
        'border-r dark:border-gray-700',
        'transition-transform duration-200 ease-in-out',
        'md:static md:w-1/4 md:h-screen',
        'bg-gray-100 dark:bg-gray-800',
        leftDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ]"
    >
      <div class="flex justify-between items-center">
        <div class="font-bold">
          <a href="/" class="hover:underline">rdr</a>
        </div>
        <button class="md:hidden hover:underline border py-1 px-3" @click="leftDrawerOpen = false">&times;</button>
      </div>
      <div class="font-bold">Navigation</div>
      <nav class="space-y-2">
        <a href="#" class="block hover:underline">Home</a>
        <a href="#" class="block hover:underline">Feeds</a>
        <a href="#" class="block hover:underline">Settings</a>
      </nav>
      <div class="font-bold">Categories &amp; Feeds</div>
      <HomeCategoryListOptions />
      <div class="flex-1 overflow-y-auto">
        <HomeCategoryList />
      </div>
      <div class="text-sm">
        <div>
          Logged in as <strong>{{ session?.user?.username }}</strong>
        </div>
        <div>Logged in at <DateTime :datetime="session?.loggedInAt" /></div>
      </div>
      <LogoutButton class="w-full" />
    </aside>

    <main class="flex-1 flex flex-col h-screen overflow-hidden">
      <div class="p-4 space-y-4">
        <div class="flex items-center gap-2">
          <button class="md:hidden hover:underline border py-1 px-3" @click="leftDrawerOpen = true">&#9776;</button>
          <HomeEntryListHeader />
        </div>
        <HomeEntryListToggles />
      </div>
      <div class="flex-1 overflow-y-auto">
        <HomeEntryList />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const categoryStore = useCategoryStore();
const entryStore = useEntryStore();
const { session } = useUserSession();

await callOnce(() => Promise.all([categoryStore.load(), entryStore.load()]));
const countLabel = computed(() => {
  const count = entryStore.count;
  if (count > 999) return "999+";
  return count.toString();
});
useHead({ title: () => `(${countLabel.value}) rdr` });

const leftDrawerOpen = ref(false);
</script>
