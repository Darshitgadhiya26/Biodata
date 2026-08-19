/**
 * The biodata contract, re-exported for the browser.
 *
 * The schema itself lives in `api/_lib/` so that the serverless functions are
 * a self-contained module graph: Vercel transpiles `api/**` file by file
 * rather than bundling it, so a function reaching outside that directory at
 * runtime is asking for trouble.
 *
 * Vite, by contrast, bundles — so the browser can import across the boundary
 * safely, and this shim keeps every `@/utils/biodata-schema` import in the app
 * working unchanged. One schema, enforced identically on both sides.
 */
export * from '../../api/_lib/biodata-schema';
