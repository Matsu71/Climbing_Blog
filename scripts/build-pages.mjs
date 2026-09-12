import './build.mjs';
import {cp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const dist=resolve(root,'dist');
const docs=resolve(root,'docs');
await rm(docs,{recursive:true,force:true});
await cp(dist,docs,{recursive:true});
console.log('Copied the validated static build from dist/ to docs/ for branch-based GitHub Pages.');
