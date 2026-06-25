<template>
  <div class="app-container"></div>
</template>

<script setup>
const router = useRouter()

onMounted(() => {
  router.replace('/vote/activity')
})
</script>
