<template>
  <div
    class="min-h-screen bg-netflix-dark text-white font-sans overflow-x-hidden"
  >
    <AppHeader />
    <HeroBanner :featured="featuredContent" />
    <div
      class="relative z-10 -mt-2 pb-20 space-y-16 max-w-screen overflow-x-hidden"
    >
      <SpotlightCarousel :items="spotlightCarousel" data-aos="fade-up" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import AOS from "aos";
import "aos/dist/aos.css";
import AppHeader from "./components/AppHeader.vue";
import HeroBanner from "./components/HeroBanner.vue";
import SpotlightCarousel from "./components/SpotlightCarousel.vue";

const featuredContent = ref({
  title: "Shang-Chi and the Legend of the Ten Rings",
  description: `Shang-Chi must confront the past he thought he left behind when he is drawn into the web of the mysterious Ten Rings organization.`,
  imageUrl: "/shangchi.webp",
  genres: ["Action", "Adventure", "Sci-Fi"],
  year: 2022,
  seasons: 2,
  rating: 8.9,
});

const spotlightCarousel = ref([
  {
    id: 21,
    title: "Gladiator II",
    imageUrl:
      "https://www.themoviedb.org/t/p/w1280/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
    description:
      "A sequel to the epic historical drama 'Gladiator,' following the journey of a new hero in ancient Rome as they navigate political intrigue and gladiatorial combat.",
  },
  {
    id: 22,
    title: "Pirates",
    imageUrl:
      "https://www.themoviedb.org/t/p/w1280/jGWpG4YhpQwVmjyHEGkxEkeRf0S.jpg",
    description:
      "A swashbuckling adventure following the exploits of a notorious pirate and his crew.",
  },
  {
    id: 23,
    title: "Captain America: Civil War",
    imageUrl:
      "https://www.themoviedb.org/t/p/w1280/rAGiXaUfPzY7CDEyNKUofk3Kw2e.jpg",
    description:
      "Political interference in the Avengers' activities causes a rift between former allies Captain America and Black Widow.",
  },
]);
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