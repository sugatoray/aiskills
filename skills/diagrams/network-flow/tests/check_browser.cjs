const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
const example=process.argv[2]||path.join(__dirname,'../examples/rag.html');
const screenshots=process.env.NETWORK_FLOW_SCREENSHOTS;
if(screenshots)fs.mkdirSync(screenshots,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.NETWORK_FLOW_CHROMIUM,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:1100},deviceScaleFactor:1});const requests=[];page.on('request',r=>{if(!r.url().startsWith('file:'))requests.push(r.url());});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.resolve(example)).href);await page.waitForSelector('#network-flow[data-ready=true]');
await page.clock.install();
const sizes=[1280,820,390,320];
for(const width of sizes){await page.setViewportSize({width,height:1100});await page.clock.runFor(100);
const report=await page.evaluate(()=>{const r=document.querySelector('#network-flow'),nodes=[...r.querySelectorAll('[data-node]')],boxes=nodes.map(n=>{const b=n.getBoundingClientRect();return{id:n.dataset.node,x:b.x,y:b.y,w:b.width,h:b.height}});const board=r.querySelector('.rf-board').getBoundingClientRect();let collisions=[];for(const g of r.querySelectorAll('[data-edge]')){const values=[...g.querySelector('path').getAttribute('d').matchAll(/[ML]([\d.-]+),([\d.-]+)/g)].map(m=>[Number(m[1])+board.x,Number(m[2])+board.y]);for(let i=1;i<values.length;i++){const p=values[i-1],q=values[i];if(p[0]!==q[0]&&p[1]!==q[1])collisions.push('not orthogonal '+g.dataset.edge);for(const n of boxes){const l=n.x+2,rr=n.x+n.w-2,t=n.y+2,bt=n.y+n.h-2;const hit=p[0]===q[0]?p[0]>l&&p[0]<rr&&Math.max(p[1],q[1])>t&&Math.min(p[1],q[1])<bt:p[1]>t&&p[1]<bt&&Math.max(p[0],q[0])>l&&Math.min(p[0],q[0])<rr;if(hit)collisions.push(g.dataset.edge+' hits '+n.id);}}}return{overflow:document.documentElement.scrollWidth>innerWidth,collisions,count:nodes.length,clipped:nodes.filter(n=>n.scrollHeight>n.clientHeight+1||n.scrollWidth>n.clientWidth+1).map(n=>n.dataset.node)};});
assert.equal(report.count,14);assert.equal(report.overflow,false,`${width}: horizontal overflow`);assert.deepEqual(report.collisions,[],`${width}: routing`);assert.deepEqual(report.clipped,[],`${width}: text clipping`);console.log('PASS layout',width);
if(width===390&&screenshots)await page.screenshot({path:path.join(screenshots,'mobile.png'),fullPage:true});}
await page.setViewportSize({width:1280,height:1100});await page.clock.runFor(100);
const packet=page.locator('[data-edge=parse] .rf-packet');let a=await packet.evaluate(p=>p.style.strokeDashoffset);await page.clock.runFor(500);let b=await packet.evaluate(p=>p.style.strokeDashoffset);assert.notEqual(a,b);console.log('PASS packet motion');
await page.getByRole('button',{name:'Pause',exact:true}).click();a=await packet.evaluate(p=>p.style.strokeDashoffset);await page.clock.runFor(700);b=await packet.evaluate(p=>p.style.strokeDashoffset);assert.equal(a,b);await page.getByRole('button',{name:'Resume',exact:true}).click();console.log('PASS pause / resume');
for(const scene of ['ingest','answer','retry']){await page.locator(`button[data-scene=${scene}]`).click();assert.equal(await page.locator('#network-flow').getAttribute('data-scene'),scene);assert.equal(await page.locator(`button[data-scene=${scene}]`).getAttribute('aria-pressed'),'true');}
await page.clock.runFor(5400);assert.match(await page.locator('.rf-caption').textContent(),/No evidence/);await page.clock.runFor(23000);assert.match(await page.locator('.rf-caption').textContent(),/Recovered answer/);await page.clock.runFor(2700);assert.match(await page.locator('.rf-caption').textContent(),/abstain/);console.log('PASS failure, recovery, and abstention timeline');
await page.getByRole('button',{name:'Replay',exact:true}).click();assert.equal(await page.locator('#network-flow').getAttribute('data-step'),'0');console.log('PASS replay');
await page.locator('button[data-scene=all]').click();await page.locator('[data-node=retrieve]').click();assert.equal(await page.locator('[data-node=retrieve]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-edge=deliver]').getAttribute('class'),'rf-edge rf-dim');assert.match(await page.locator('.rf-detail h3').textContent(),/Retrieve/);await page.keyboard.press('Escape');assert.equal(await page.locator('#network-flow').getAttribute('data-selected'),'');console.log('PASS node tracing and keyboard clear');
await page.emulateMedia({reducedMotion:'reduce'});await page.clock.runFor(100);assert.equal(await packet.evaluate(p=>getComputedStyle(p).display),'none');await page.emulateMedia({reducedMotion:'no-preference'});console.log('PASS reduced motion');
assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);console.log('PASS offline playback');await page.clock.runFor(500);if(screenshots)await page.screenshot({path:path.join(screenshots,'desktop.png'),fullPage:true});console.log('PASS no runtime errors');await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
