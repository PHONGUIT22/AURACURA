/**
 * Custom Node.js 22 ESM loader hook
 * Seamlessly resolves .js imports to .ts files and provides fallback shims for native execution.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'zod') {
    try {
      return await nextResolve(specifier, context);
    } catch {
      const zodShimPath = path.resolve('backend-mcp/src/utils/zod.js');
      return {
        url: pathToFileURL(zodShimPath).href,
        shortCircuit: true,
        format: 'module',
      };
    }
  }

  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.endsWith('.js')) {
      const tsSpecifier = specifier.slice(0, -3) + '.ts';
      return await nextResolve(tsSpecifier, context);
    }
    throw err;
  }
}
