<template>
  <div class="min-h-screen flex items-center justify-center px-6 text-center">
    <div>
      <div class="text-[120px] font-black text-red-600/20 leading-none mb-4">
        404
      </div>
      <h1 class="text-3xl font-black text-white mb-3">Page Not Found</h1>
      <p class="text-white/40 text-sm mb-8 max-w-sm mx-auto">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div class="flex items-center justify-center gap-4">
        <router-link
          to="/"
          class="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Go Home
        </router-link>
        <button
          @click="$router.back()"
          class="text-white/50 hover:text-white border border-white/10 hover:border-white/30 font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
</template>