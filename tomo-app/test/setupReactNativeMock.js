import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const React = require('react');
globalThis.React = React;
const Module = require('module');

const mockPath = path.resolve(__dirname, 'mocks/react-native.js');
const codegenMockPath = path.resolve(__dirname, 'mocks/codegenNativeComponent.js');

const origResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.includes('codegenNativeComponent')) {
    return codegenMockPath;
  }
  if (request === 'react-native' || request.startsWith('react-native/')) {
    return mockPath;
  }
  return origResolveFilename.call(this, request, parent, isMain, options);
};
