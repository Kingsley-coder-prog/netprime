import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.store";

const routes = [
  {
    path: "/",
    component: () => import("../components/layout/AppLayout.vue"),
    children: [
      {
        path: "",
        name: "home",
        component: () => import("../views/HomeView.vue"),
      },
      {
        path: "browse",
        name: "browse",
        component: () => import("../views/BrowseView.vue"),
      },
      {
        path: "movie/:id",
        name: "movie-detail",
        component: () => import("../views/MovieDetailView.vue"),
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("../views/ProfileView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "settings",
        name: "settings",
        component: () => import("../views/SettingsView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "watchlist",
        name: "watchlist",
        component: () => import("../views/WatchlistView.vue"),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: "/watch/:id",
    name: "player",
    component: () => import("../views/PlayerView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/auth",
    name: "auth",
    component: () => import("../views/AuthView.vue"),
    meta: { requiresGuest: true },
  },
  {
    path: "/admin",
    component: () => import("../components/layout/AdminLayout.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: "",
        name: "admin-dashboard",
        component: () => import("../views/admin/AdminDashboardView.vue"),
      },
      {
        path: "movies",
        name: "admin-movies",
        component: () => import("../views/admin/AdminMoviesView.vue"),
      },
      {
        path: "upload",
        name: "admin-upload",
        component: () => import("../views/admin/AdminUploadView.vue"),
      },
      {
        path: "users",
        name: "admin-users",
        component: () => import("../views/admin/AdminUsersView.vue"),
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../views/NotFoundView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: "smooth" };
    return { top: 0, behavior: "smooth" };
  },
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Initialize auth on first load
  if (!authStore.initialized) {
    await authStore.initialize();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: "auth", query: { redirect: to.fullPath } });
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next({ name: "home" });
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next({ name: "home" });
  }

  next();
});

export default router;
