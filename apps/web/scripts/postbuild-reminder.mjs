#!/usr/bin/env node
/**
 * Printed after `next build`. Production output in .next is not compatible with `next dev`.
 */
console.log('');
console.log('⚠️  Production build finished.');
console.log('   Do NOT keep `next dev` running on the old cache.');
console.log('   From repo root run:  npm run restart:web');
console.log('   Then hard-refresh the browser (Cmd+Shift+R).');
console.log('');
