# Development
VITE_API_URL=http://localhost:3000

# Production
# VITE_API_URL=https://your-production-api.com
```

---

Now here's the complete folder structure we'll build:
```
src/
├── assets/
│   └── vue.svg
├── components/
│   ├── ui/                        ← reusable primitives
│   │   ├── BaseButton.vue
│   │   ├── BaseInput.vue
│   │   ├── BaseModal.vue
│   │   ├── BaseSpinner.vue
│   │   └── BaseToast.vue
│   ├── layout/
│   │   ├── AppHeader.vue          ← enhanced existing
│   │   └── AppFooter.vue          ← existing
│   ├── home/
│   │   ├── HeroBanner.vue         ← enhanced existing
│   │   ├── SpotlightCarousel.vue  ← enhanced existing
│   │   ├── MovieRow.vue           ← enhanced existing
│   │   ├── FeaturedCategory.vue   ← enhanced existing
│   │   └── GenreGrid.vue          ← enhanced existing
│   ├── movie/
│   │   ├── MovieCard.vue          ← enhanced existing
│   │   ├── MovieHoverCard.vue     ← new (Netflix-style hover)
│   │   └── ReviewCard.vue         ← new
│   └── admin/
│       ├── StatsCard.vue
│       ├── UploadProgress.vue
│       └── charts/
│           ├── ViewsChart.vue
│           └── GenreChart.vue
├── composables/
│   ├── useApi.js                  ← existing (will enhance)
│   ├── useAuth.js                 ← new
│   ├── useMovies.js               ← new
│   └── useToast.js                ← new
├── services/
│   ├── api.js                     ← existing (will replace)
│   ├── auth.service.js            ← new
│   ├── movie.service.js           ← new
│   ├── user.service.js            ← new
│   ├── upload.service.js          ← new
│   └── stream.service.js          ← new
├── stores/
│   ├── auth.store.js              ← new (Pinia)
│   ├── movies.store.js            ← new
│   └── ui.store.js                ← new (toasts, modals)
├── views/
│   ├── HomeView.vue               ← replaces App.vue logic
│   ├── BrowseView.vue
│   ├── MovieDetailView.vue
│   ├── PlayerView.vue
│   ├── AuthView.vue               ← login + register tabs
│   ├── ProfileView.vue
│   ├── SettingsView.vue
│   └── admin/
│       ├── AdminDashboardView.vue
│       ├── AdminMoviesView.vue
│       └── AdminUploadView.vue
├── router/
│   └── index.js                   ← new
├── App.vue                        ← simplified to router-view
├── main.js                        ← updated
└── style.css                      ← existing