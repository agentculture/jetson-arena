// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
//
// jetson-arena owns its domain root — this site is not mounted under a
// path prefix (no `base`), and ships pure static HTML (no `adapter`).
export default defineConfig({
  site: 'https://jetson-arena.com',
  output: 'static',
});
