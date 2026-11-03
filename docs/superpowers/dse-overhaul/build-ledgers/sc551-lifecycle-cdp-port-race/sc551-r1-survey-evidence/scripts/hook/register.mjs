// SC-551 probe: force @wdio/utils' `getPort()` (node.js:387) to return FORCE_PORT, i.e. simulate
// "another process took the number get-port chose, before chromedriver bound it".
import { register } from 'node:module';
register('./resolve.mjs', import.meta.url);
