<template>
  <div
    class="min-h-screen bg-netflix-dark text-white font-sans overflow-x-hidden"
  >
    <AppHeader />
    <HeroBanner :featured="featuredContent" />
    <div
      class="relative z-10 -mt-32 pb-20 space-y-16 max-w-screen overflow-x-hidden"
    >
      <SpotlightCarousel :items="spotlightCarousel" data-aos="fade-up" />
      <MovieRow
        :title="movieRows[0].title"
        :movies="movieRows[0].movies"
        :size="movieRows[0].size"
        :type="movieRows[0].type"
        data-aos="fade-up"
      />
      <FeaturedCategory
        title="New & Popular"
        :featured="movieRows[1].movies[0]"
        :items="movieRows[1].movies.slice(1, 5)"
        data-aos="fade-up"
      />

      <GenreGrid title="Browse by Genre" :genres="genres" data-aos="fade-up" />

      <MovieRow
        :title="movieRows[2].title"
        :movies="movieRows[2].movies"
        :size="movieRows[2].size"
        :type="movieRows[2].type"
        data-aos="fade-up"
      />
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
import MovieRow from "./components/MovieRow.vue";
import FeaturedCategory from "./components/FeaturedCategory.vue";
import GenreGrid from "./components/GenreGrid.vue";

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

const genres = ref([
  { name: "Action", imageUrl: "/movies/shutterislands.webp" },
  { name: "Comedy", imageUrl: "/movies/moana.webp" },
  { name: "Drama", imageUrl: "/movies/womanking.webp" },
  { name: "Sci-Fi", imageUrl: "/movies/wakanda.webp" },
  { name: "Horror", imageUrl: "/movies/sendhelp.webp" },
  { name: "Documentary", imageUrl: "/movies/titanic.webp" },
]);

const movieRows = ref([
  {
    title: "Continue Watching",
    movies: [
      { id: 1, title: "Captain America", imageUrl: "/movies/captAmerica.webp" },
      { id: 2, title: "Babylon", imageUrl: "/movies/babylon.webp" },
      { id: 3, title: "The Godfather", imageUrl: "/movies/godfather.webp" },
      { id: 4, title: "Nobody", imageUrl: "/movies/nobody.webp" },
      { id: 5, title: "Wakanda Forever", imageUrl: "/movies/wakanda.webp" },
    ],
    size: "medium",
    type: "progress",
  },
  {
    title: "Popular on NetPrime",
    movies: [
      { id: 6, title: "Avatar", imageUrl: "/movies/avatar.webp", rating: 7.8 },
      { id: 7, title: "300", imageUrl: "/movies/300.webp", rating: 7.6 },
      {
        id: 8,
        title: "Oppenheimer",
        imageUrl: "/movies/oppenheimer.webp",
        rating: 8.3,
      },
      {
        id: 9,
        title: "Sinners",
        imageUrl: "/movies/sinners.webp",
        rating: 7.2,
      },
      {
        id: 10,
        title: "Thunderbolts",
        imageUrl: "/movies/thunderbolts.webp",
        rating: 6.9,
      },
    ],
    size: "large",
    type: "rating",
  },
  {
    title: "Ttrending Now",
    movies: [
      { id: 11, title: "Blade", imageUrl: "/movies/blade.webp", rating: 7.8 },
      {
        id: 12,
        title: "The Northman",
        imageUrl: "/movies/northman.webp",
        rating: 7.6,
      },
      {
        id: 13,
        title: "The Bone Temple",
        imageUrl: "/movies/bonetemple.webp",
        rating: 8.3,
      },
      {
        id: 14,
        title: "Killers of the Flower Moon",
        imageUrl: "/movies/killers.webp",
        rating: 7.2,
      },
      {
        id: 15,
        title: "Robinhood",
        imageUrl: "/movies/robinhood.webp",
        rating: 6.9,
      },
    ],
    size: "large",
    type: "rating",
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