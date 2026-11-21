import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    coverage: {
      include: ['src/**'],
      reporter: ['text', 'html'],
      // Étape 6 : ajouter ici un seuil de couverture (quality gate n°1).
    },
  },
});
