<script lang="ts" setup>
import Toggle from "@/app/components/toggle.vue";

const props = defineProps<{
	pvp: boolean;
	id?: string;
}>();

const emit = defineEmits<{
	(e: "change", value: boolean): void;
}>();
</script>

<template>
	<label :for="props.id ?? 'pvp-toggle'">
		<Toggle
			:id="props.id ?? 'pvp-toggle'"
			:checked="props.pvp"
			@update:checked="(next) => emit('change', next)"
		/>
		<span aria-hidden="true" v-show="props.pvp" class="pvp-icon">⚔️ PvP</span>
		<span aria-hidden="true" v-show="!props.pvp" class="pvp-icon">️🧸 PvE</span>
		mode
	</label>
</template>
