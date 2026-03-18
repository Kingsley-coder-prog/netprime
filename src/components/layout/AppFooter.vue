<template>
  <footer class="bg-black text-netflix-light-gray py-12 px-8">
    <div class="container mx-auto">
      <div class="flex space-x-4 mb-6">
        <a href="#" class="hover:text-white transition-colors">
          <Icon icon="mdi:facebook" width="24" />
        </a>
        <a href="#" class="hover:text-white transition-colors">
          <Icon icon="mdi:instagram" width="24" />
        </a>
        <a href="#" class="hover:text-white transition-colors">
          <Icon icon="mdi:twitter" width="24" />
        </a>
        <a href="#" class="hover:text-white transition-colors">
          <Icon icon="mdi:youtube" width="24" />
        </a>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div v-for="(column, index) in footerLinks" :key="index" class="mb-3">
          <ul>
            <li v-for="link in column" :key="link" class="mb-3">
              <a href="#" class="text-sm hover:underline">{{ link }}</a>
            </li>
          </ul>
        </div>
      </div>
      <button
        class="border border-netflix-light-gray px-4 py-2 text-sm mb-6 hover:text-white"
      >
        Service Code
      </button>
      <p class="text-xs">2026 Netprime. Made with ❤️ by Pichichi.</p>
    </div>
  </footer>
</template>

<script setup>
const footerLinks = [
  ["Audio Description", "Investor Relations", "Legal Notices"],
  ["Help Center", "Jobs", "Cookie Preferences"],
  ["Gift Cards", "Terms of Use", "Corporate Information"],
  ["Media Center", "Privacy", "Contact Us"],
];
</script>

<style>
</style>