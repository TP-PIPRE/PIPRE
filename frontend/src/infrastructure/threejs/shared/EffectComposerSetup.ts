import * as THREE from "three";
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from "postprocessing";

export interface BloomConfig {
  intensity?: number;
  luminanceThreshold?: number;
  luminanceSmoothing?: number;
  mipmapBlur?: boolean;
}

export function createEffectComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  bloomConfig: BloomConfig = {}
): EffectComposer {
  const {
    intensity = 0.6,
    luminanceThreshold = 0.4,
    luminanceSmoothing = 0.3,
    mipmapBlur = true,
  } = bloomConfig;

  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
  });

  composer.addPass(new RenderPass(scene, camera));

  const bloomEffect = new BloomEffect({
    intensity,
    luminanceThreshold,
    luminanceSmoothing,
    mipmapBlur,
  });

  composer.addPass(new EffectPass(camera, bloomEffect));

  return composer;
}

export const BLOOM_PRESETS: Record<string, BloomConfig> = {
  battle: {
    intensity: 0.7,
    luminanceThreshold: 0.35,
    luminanceSmoothing: 0.25,
  },
  space: {
    intensity: 0.5,
    luminanceThreshold: 0.4,
    luminanceSmoothing: 0.3,
  },
  maze: {
    intensity: 0.8,
    luminanceThreshold: 0.3,
    luminanceSmoothing: 0.2,
  },
  obstacle: {
    intensity: 0.55,
    luminanceThreshold: 0.4,
    luminanceSmoothing: 0.3,
  },
  default: {
    intensity: 0.5,
    luminanceThreshold: 0.45,
    luminanceSmoothing: 0.35,
  },
};
