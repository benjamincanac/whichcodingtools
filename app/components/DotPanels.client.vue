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
        color-a="#1a1a1a"
        color-b="#050505"
        color-space="oklab"
        :radius="0.66"
      />
      <Grid
        :cells="6"
        color="#141414"
        :thickness="0"
      />
      <DotGrid
        color="#e5e5e5"
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
      :visible="true"
    />
  </Shader>
</template>
