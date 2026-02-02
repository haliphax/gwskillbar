<script lang="ts" setup>
const props = defineProps<{
	name: string;
}>();

const icons: { [p: string]: string } = {
	Assassin: "🥷",
	Dervish: "🌙",
	Elementalist: "🔥",
	Mesmer: "✨",
	Monk: "⛑️",
	Necromancer: "💀",
	Paragon: "👼",
	Ranger: "🏹",
	Ritualist: "⚱️",
	Warrior: "🛡️",
};

const loadIcon = (name: string) => icons[name];
</script>

<template>
	{{ loadIcon(name) }}
</template>

<style lang="less" scoped>
/* ... */
</style>
