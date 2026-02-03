<script lang="ts" setup>
const props = defineProps<{
	class?: string;
	name: string;
	size?: number;
	allegianceSkill?: boolean;
}>();
</script>

<template>
	<span
		:class="'icon ib ' + (allegianceSkill ? 'ally' : '')"
		:style="`height: ${size ?? 16}px; width: ${size ?? 16}px;`"
	>
		<img
			:alt="`[${name} skill icon]`"
			:class="props.class"
			:src="`images/skills/${name.replace(/ \(PvP\)$/, '')}.jpg`"
			:height="allegianceSkill ? (size ?? 16) * 2 : (size ?? 16)"
			:width="size ?? 16"
		/>
	</span>
</template>

<style lang="less" scoped>
span {
	overflow: hidden;
	padding: 0;
}

img {
	margin: 0;
}
</style>
