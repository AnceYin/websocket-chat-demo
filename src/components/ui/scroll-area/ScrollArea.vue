<script setup>
import { ref, computed, onMounted } from "vue";
import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaViewport,
} from "radix-vue";
import ScrollBar from "./ScrollBar.vue";
import { cn } from "@/lib/utils";

const props = defineProps({
  type: { type: String, required: false },
  dir: { type: String, required: false },
  scrollHideDelay: { type: Number, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
});

const emits = defineEmits(['onViewport'])
const scroll = ref(null)

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

onMounted(() => {
	emits('onViewport', scroll.value.viewport)
})
</script>

<template>
  <ScrollAreaRoot
    v-bind="delegatedProps"
    ref="scroll"
    :class="cn('relative overflow-hidden', props.class)"
  >
    <ScrollAreaViewport class="h-full w-full rounded-[inherit]">
      <slot />
    </ScrollAreaViewport>
    <ScrollBar />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
