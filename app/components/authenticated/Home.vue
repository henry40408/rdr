<template>
  <div class="flex min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <aside
      :class="[
        'bg-gray-100 dark:bg-gray-800 p-4 border-r dark:border-gray-700',
        'fixed md:static inset-y-0 left-0 z-50 w-full md:w-1/4',
        'transform transition-transform duration-200 ease-in-out',
        'flex flex-col space-y-4',
        leftDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ]"
    >
      <div class="flex justify-between items-center">
        <div class="font-bold dark:text-white">rdr</div>
        <button
          class="md:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border rounded-full py-1 px-3"
          @click="leftDrawerOpen = false"
        >
          &times;
        </button>
      </div>
      <div class="font-bold dark:text-white">Navigation</div>
      <nav class="space-y-2">
        <a href="#" class="block text-gray-700 dark:text-gray-300 hover:underline">Home</a>
        <a href="#" class="block text-gray-700 dark:text-gray-300 hover:underline">Profile</a>
        <a href="#" class="block text-gray-700 dark:text-gray-300 hover:underline">Settings</a>
      </nav>
      <div class="flex-1" />
      <div class="text-sm dark:text-gray-400">
        <div>
          Logged in as <strong>{{ session?.user?.username }}</strong>
        </div>
        <div>Logged in at <DateTime :datetime="session?.loggedInAt" /></div>
      </div>
      <LogoutButton class="w-full" />
    </aside>

    <main class="flex-1 p-4">
      <div class="flex items-center gap-2">
        <button
          class="md:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border rounded-full py-1 px-3"
          @click="leftDrawerOpen = true"
        >
          &#9776;
        </button>
        <h1 class="text-2xl font-bold dark:text-white">Unread</h1>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { session } = useUserSession();

const leftDrawerOpen = ref(false);
</script>
