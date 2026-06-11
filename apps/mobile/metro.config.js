// Metro config for an Expo app inside a pnpm monorepo, with NativeWind.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so workspace packages (e.g. @fodmapzen/shared) hot-reload.
config.watchFolders = [workspaceRoot];

// Resolve modules from both the app and the workspace root (pnpm hoisting).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = false;

// expo-sqlite's web build imports a .wasm module — Metro must treat it as an asset.
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// wa-sqlite (expo-sqlite web) runs in a Web Worker that needs SharedArrayBuffer,
// which browsers only allow under cross-origin isolation. Add the headers in dev.
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return middleware(req, res, next);
  };
};

module.exports = withNativeWind(config, { input: './global.css' });
