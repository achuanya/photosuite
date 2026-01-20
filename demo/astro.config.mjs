// @ts-check
import { defineConfig } from 'astro/config';
import photosuite from 'photosuite';

// https://astro.build/config
export default defineConfig({
  integrations: [
    photosuite({
      scope: '#main',
      imageBase: "https://cos.lhasa.icu/"
    })
  ]
});
