const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(require('path').join(__dirname,'../assets/examples/rag_demo.html'),'utf8');
class E{constructor(){this.children=[];this.attrs={};this.dataset={}} setAttribute(k,v){this.attrs[k]=v} append(...x){this.children.push(...x)} replaceChildren(){this.children=[]} addEventListener(k,f){this.click=f}}
const buttons=['ask','retrieve','answer','cite'].map(x=>Object.assign(new E(),{dataset:{step:x}}));const detail=new E();const document={querySelector:()=>detail,querySelectorAll:()=>buttons,createElement:()=>new E(),createTextNode:(s)=>({textContent:s})};
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],{document});
for(const [index,term] of [[1,'search'],[3,'source']]){buttons[index].click();assert.equal(buttons[index].attrs['aria-pressed'],'true');assert.equal(buttons.filter(b=>b.attrs['aria-pressed']==='true').length,1);assert.match(detail.children[0].children[2].textContent,new RegExp(term,'i'));}
assert.match(html,/name="viewport"/);assert.match(html,/prefers-reduced-motion/);console.log('PASS: retrieve and cite actions change detail and selected state; mobile viewport and reduced-motion rules present');
