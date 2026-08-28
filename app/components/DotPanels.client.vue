<script setup lang="ts">
import {
  Shader,
  DotGrid,
  FilmGrain,
  Grid,
  Perspective,
  ProgressiveBlur,
  RadialGradient
} from 'shaders/vue'

const colorMode = useColorMode()

// Light mode draws only the dots: the canvas stays transparent so the page background shows through.
const dark = computed(() => colorMode.value === 'dark')
const palette = computed(() => dark.value
  ? { a: '#1a1a1a', b: '#050505', grid: '#141414', dots: '#e5e5e5' }
  : { a: '#ffffff', b: '#ffffff', grid: '#ffffff', dots: '#171717' })
</script>

<template>
  <Shader>
    <Perspective
      :center="{
        x: 0.48,
        y: 1
      }"
      edges="mirror"
      :fov="96"
      :offset="{
        x: 0.58,
        y: 0.57
      }"
      :pan="-38"
      :tilt="15"
      :zoom="2.28"
    >
      <RadialGradient
        :center="{
          x: 0.2,
          y: 1
        }"
        :color-a="palette.a"
        :color-b="palette.b"
        color-space="oklab"
        :radius="0.66"
        :visible="dark"
      />
      <Grid
        :cells="6"
        :color="palette.grid"
        :thickness="0"
        :visible="dark"
      />
      <DotGrid
        :color="palette.dots"
        :density="60"
        :dot-size="0.06"
        :twinkle="1"
      />
    </Perspective>
    <ProgressiveBlur
      :center="{
        x: 0.25,
        y: 0.5
      }"
      :falloff="0.68"
      :intensity="76"
    />
    <FilmGrain
      :strength="0.02"
      :visible="dark"
    />
  </Shader>
</template>
