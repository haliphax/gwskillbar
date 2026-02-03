<script lang="ts" setup>
import { onBeforeMount, ref } from "vue";

const props = defineProps<{ path: string; title?: string }>();
const cleanPath = ref();

onBeforeMount(() => (cleanPath.value = props.path.replace(/ /g, "_")));
</script>

<template>
	<a :href="`https://wiki.guildwars.com/wiki/${cleanPath}`" :title="title">
		<slot></slot>
	</a>
</template>
