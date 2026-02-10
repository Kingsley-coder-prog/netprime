<template>
  <div
    class="min-h-screen bg-netflix-dark text-white font-sans overflow-x-hidden"
  >
    <AppHeader />
    <HeroBanner :featured="featuredContent" />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import AOS from "aos";
import "aos/dist/aos.css";
import AppHeader from "./components/AppHeader.vue";
import HeroBanner from "./components/HeroBanner.vue";

const featuredContent = ref({
  title: "Shang-Chi and the Legend of the Ten Rings",
  description: `Shang-Chi must confront the past he thought he left behind when he is drawn into the web of the mysterious Ten Rings organization.`,
  imageUrl: "/shangchi.webp",
  genres: ["Action", "Adventure", "Sci-Fi"],
  year: 2022,
  seasons: 2,
  rating: 8.9,
});

onMounted(() => {
  AOS.init({
    duration: 800,
    easing: "ease-in-out",
    once: true,
    offset: 100,
  });
});
</script>

<style>
</style>