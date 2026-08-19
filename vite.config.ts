import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const dataFile = fileURLToPath(new URL('./data/biodata.json', import.meta.url));

interface BiodataShape {
  personal?: { name?: string };
  education?: { degree?: string };
  career?: { job?: string };
  theme?: { mode?: string; accent?: string };
}

function readBiodata(): BiodataShape {
  try {
    return JSON.parse(readFileSync(dataFile, 'utf8')) as BiodataShape;
  } catch {
    return {};
  }
}

/** Escapes a value for use inside an HTML attribute or text node. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Writes values from `data/biodata.json` into `index.html` at build time.
 *
 * Two things need to be correct before any JavaScript runs: the SEO/Open Graph
 * tags (crawlers and WhatsApp previews never execute the app) and the theme, so
 * the page does not flash the wrong palette. Both are therefore baked into the
 * HTML rather than set from React.
 */
function biodataHtmlPlugin(): Plugin {
  return {
    name: 'biodata-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const biodata = readBiodata();

        const name = biodata.personal?.name?.trim() || 'Marriage Biodata';
        const title = `${name} | Marriage Biodata`;
        const description =
          `Digital marriage biodata of ${name}` +
          [biodata.education?.degree, biodata.career?.job].filter(Boolean).join(', ').replace(/^(.)/, ' — $1') +
          '.';

        const replacements: Record<string, string> = {
          '%BIODATA_NAME%': escapeHtml(name),
          '%BIODATA_TITLE%': escapeHtml(title),
          '%BIODATA_DESCRIPTION%': escapeHtml(description),
          '%BIODATA_THEME_MODE%': escapeHtml(biodata.theme?.mode ?? 'light'),
          '%BIODATA_ACCENT%': escapeHtml(biodata.theme?.accent ?? 'champagne'),
        };

        return Object.entries(replacements).reduce(
          (output, [token, value]) => output.split(token).join(value),
          html,
        );
      },
    },
    /** A published change to the JSON should refresh the dev server too. */
    configureServer(server) {
      server.watcher.add(dataFile);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), biodataHtmlPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Keep the public biodata bundle small: the router and the animation
        // library are split out so first paint of "/" is not held up by them.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
