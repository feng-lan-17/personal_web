import {readFile,writeFile} from 'node:fs/promises';
let views=await readFile('public/content-views.js','utf8');views=views.replace('${esc(r.title)} <span class="arrow" aria-hidden="true">↗</span></h3>','${esc(r.title)}</h3>');await writeFile('public/content-views.js',views);
let app=await readFile('public/app.js','utf8');app=app.replace("document.querySelector('.page-head p')?.textContent||d.siteMetadata.description", "document.querySelector('.detail-deck,.page-head p')?.textContent||d.siteMetadata.description");await writeFile('public/app.js',app);
let test=await readFile('qa/verify.mjs','utf8');test=test.replace("page.locator('dialog').isVisible()", "page.locator('#search-dialog').isVisible()");await writeFile('qa/verify.mjs',test);
