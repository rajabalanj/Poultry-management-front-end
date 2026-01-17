// postcss.config.js
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const autoprefixer = require('autoprefixer');
const purgecssModule = require('@fullhuman/postcss-purgecss');

// This handles cases where the CJS/ESM interop puts the export on a 'default' property
const purgecss = purgecssModule.default || purgecssModule;

const purgecssConfig = purgecss({
  content: [
    '`./index.html`',
    '`./src`/**/*.html',
    '`./src`/**/*.tsx',
    '`./src`/**/*.ts',
    '`./src`/**/*.js',
    '`./src`/**/*.jsx',
  ],
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
});

export default {
  plugins: [
    autoprefixer,
    ...(process.env.NODE_ENV === 'production' ? [purgecssConfig] : []),
  ],
};