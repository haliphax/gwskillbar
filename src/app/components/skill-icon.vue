<script lang="ts" setup>
const props = defineProps<{
	class?: string;
	name: string;
	size?: number;
}>();
</script>

<template>
	<img
		:alt="`[${name} skill icon]`"
		:class="props.class ?? 'vam'"
		:src="`/images/skills/${name}.jpg`"
		:height="size ?? 16"
		:width="size ?? 16"
	/>
</template>

<style lang="less" scoped>
/* ... */
</style>
