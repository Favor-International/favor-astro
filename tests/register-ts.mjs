// Lets `node --test` load the Pages Functions source as it stands. Node strips
// the TypeScript types itself (Node 22.18 and later); this hook adds the
// ".ts" the functions leave off their relative imports.
//
//   node --import ./tests/register-ts.mjs --test "tests/*.test.mjs"

import { register } from 'node:module';

register('./resolve-ts.mjs', import.meta.url);
