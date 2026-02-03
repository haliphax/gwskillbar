<script lang="ts" setup>
const props = defineProps<{
	name: string;
	class?: string;
}>();
</script>

<template>
	<img
		v-show="name != 'None'"
		:alt="`[${name} profession icon]`"
		:class="(props.class ?? 'vam') + ' prof-icon'"
		:src="`images/professions/${name}.png`"
	/>
</template>
