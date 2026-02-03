<script lang="ts" setup>
import { onBeforeMount, ref, watch } from "vue";

const props = defineProps<{ path: string; title?: string }>();
const cleanPath = ref();

const clean = () => (cleanPath.value = props.path.replace(/ /g, "_"));

watch(() => props.path, clean);
onBeforeMount(clean);
</script>

<template>
	<a :href="`https://wiki.guildwars.com/wiki/${cleanPath}`" :title="title">
		<slot></slot>
	</a>
</template>
