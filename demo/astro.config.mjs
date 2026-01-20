// @ts-check
import { defineConfig } from 'astro/config';
import photosuite from 'photosuite';

// https://astro.build/config
export default defineConfig({
  server: {
    port: 6666
  },
  preview: {
    port: 6666
  },
  integrations: [
    photosuite({
      scope: '#main',
      imageBase: "https://cos.lhasa.icu/"
    })
  ]
});
