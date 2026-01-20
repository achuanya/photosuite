// @ts-check
import { defineConfig } from 'astro/config';
import photosuite from 'photosuite';

// https://astro.build/config
export default defineConfig({
  server: {
    allowedHosts: [
      'photosuite.lhasa.icu'
    ],
    port: 4444
  },
  integrations: [
    photosuite({
      scope: '#main',
      imageBase: "https://cos.lhasa.icu/"
    })
  ]
});
