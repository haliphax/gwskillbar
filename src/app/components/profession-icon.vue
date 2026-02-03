<script lang="ts" setup>
const props = defineProps<{
	name: string;
	class?: string;
	size?: number;
}>();
</script>

<template>
	<img
		v-show="name != 'None'"
		:alt="`[${name} profession icon]`"
		:class="props.class ?? 'vam'"
		:height="size ?? 48"
		:src="`images/professions/${name}.png`"
		:width="size ?? 48"
	/>
</template>
