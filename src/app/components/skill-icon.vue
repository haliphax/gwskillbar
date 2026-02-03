<script lang="ts" setup>
const props = defineProps<{
	class?: string;
	name: string;
	allegianceSkill?: boolean;
}>();
</script>

<template>
	<span :class="'icon ib ' + (allegianceSkill ? 'ally' : '')">
		<img
			:alt="`[${name} skill icon]`"
			:class="props.class"
			:src="`images/skills/${name.replace(/ \(PvP\)$/, '')}.jpg`"
			:height="allegianceSkill ? '200%' : '100%'"
			width="100%"
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
