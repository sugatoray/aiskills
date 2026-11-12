"""Add step callouts, keyboard navigation and a version stamp to the page
that the network-flow renderer produces. Development only: build.py calls
enhance(); nothing here runs when a user invokes /scrolls-explainer.

Each change is an exact, single-occurrence text swap on the renderer's
output, so a renderer change that moves one of these anchors fails the
build loudly instead of producing a half-enhanced page.
"""
from __future__ import annotations

STEP_MS_OLD = "duration=2600"
STEP_MS_NEW = "duration=5200"  # slower than the renderer's default, so callouts can be read

OVERVIEW_OLD = ("'All connections. Select any block to trace its immediate neighbors. "
                "Failure branches are alternatives.'")
OVERVIEW_NEW = ("'Every command and file at once. Pick a command tab to watch what it does, "
                "or select a block to trace its links.'")

CSS = """
#network-flow .rf-callout{position:absolute;z-index:5;width:300px;max-width:calc(100% - 16px);padding:13px 15px 14px;border:1px solid var(--co,#4F9DFF);border-radius:10px;background:rgba(9,12,16,.97);box-shadow:0 12px 34px rgba(0,0,0,.6),0 0 0 4px color-mix(in srgb,var(--co,#4F9DFF) 14%,transparent);opacity:0;transform:translateY(6px);transition:opacity .3s,transform .3s,left .35s,top .35s;pointer-events:none}
#network-flow .rf-callout.on{opacity:1;transform:none;pointer-events:auto}
#network-flow .rf-co-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
#network-flow .rf-co-step{font:10px/1.4 ui-monospace,monospace;letter-spacing:1.4px;color:var(--co,#4F9DFF);text-transform:uppercase;white-space:nowrap}
#network-flow .rf-co-nav{display:flex;gap:4px}
#network-flow .rf-co-nav button{width:28px;height:26px;border:1px solid #394451;border-radius:6px;background:#141a20;color:var(--text);font-size:15px;line-height:1;padding:0}
#network-flow .rf-co-nav button:hover{background:#1f2730}
#network-flow .rf-co-title{display:block;font-size:15px;font-weight:600;letter-spacing:-.2px;margin-bottom:5px;color:var(--text)}
#network-flow .rf-co-text{margin:0;font-size:12.5px;line-height:1.6;color:#c6ced8}
#network-flow .rf-co-dots{display:flex;gap:4px;margin-top:10px}
#network-flow .rf-co-dots i{flex:1;height:3px;border-radius:2px;background:#26303a}
#network-flow .rf-co-dots i.done{background:color-mix(in srgb,var(--co) 45%,#26303a)}
#network-flow .rf-co-dots i.now{background:var(--co)}
#network-flow .rf-co-arrow{position:absolute;width:12px;height:12px;background:rgba(9,12,16,.97);border:1px solid var(--co,#4F9DFF);transform:rotate(45deg)}
#network-flow .rf-callout[data-side=right] .rf-co-arrow{left:-7px;border-top:0;border-right:0}
#network-flow .rf-callout[data-side=left] .rf-co-arrow{right:-7px;border-bottom:0;border-left:0}
#network-flow .rf-callout[data-side=below] .rf-co-arrow{top:-7px;border-bottom:0;border-right:0}
#network-flow .rf-callout[data-side=above] .rf-co-arrow{bottom:-7px;border-top:0;border-left:0}
#network-flow .rf-node.rf-anchor{outline:2px dashed var(--accent);outline-offset:4px}
#network-flow .rf-keys{display:flex;flex-wrap:wrap;gap:6px 14px;padding:10px 30px 0;font:11px/1.6 ui-monospace,monospace;color:var(--muted)}
#network-flow kbd{display:inline-block;min-width:20px;padding:1px 5px;border:1px solid #394451;border-bottom-width:2px;border-radius:4px;background:#141a20;color:var(--text);font:11px/1.4 ui-monospace,monospace;text-align:center}
#network-flow .rf-keys button{border:0;background:none;color:var(--teal);padding:0;font:inherit;text-decoration:underline;text-underline-offset:3px}
#network-flow .rf-help{position:fixed;inset:0;z-index:50;display:none;align-items:center;justify-content:center;background:rgba(3,5,8,.72);padding:16px}
#network-flow .rf-help.on{display:flex}
#network-flow .rf-help-box{width:min(440px,100%);max-height:calc(100vh - 32px);overflow:auto;border:1px solid #394451;border-radius:12px;background:#0b0f13;padding:20px 22px;box-shadow:0 20px 60px rgba(0,0,0,.6)}
#network-flow .rf-help-box h3{margin:0 0 12px;font-size:16px;font-weight:600}
#network-flow .rf-help-box table{width:100%;border-collapse:collapse;font-size:13px;color:#c6ced8}
#network-flow .rf-help-box td{padding:6px 0;border-top:1px solid #1d2630;vertical-align:top}
#network-flow .rf-help-box td:first-child{white-space:nowrap;padding-right:16px}
#network-flow .rf-help-box p{margin:12px 0 0;font-size:12px;color:var(--muted)}
@media (prefers-reduced-motion:reduce){#network-flow .rf-callout{transition:none}}
"""

JS = r"""
const co=document.createElement('div');co.className='rf-callout';co.setAttribute('role','note');co.setAttribute('aria-live','polite');
co.innerHTML='<div class="rf-co-head"><span class="rf-co-step"></span><span class="rf-co-nav"><button type="button" data-co="prev" aria-label="Previous step">&#8249;</button><button type="button" data-co="next" aria-label="Next step">&#8250;</button></span></div><strong class="rf-co-title"></strong><p class="rf-co-text"></p><div class="rf-co-dots"></div><i class="rf-co-arrow"></i>';
board.appendChild(co);
const allTab=root.querySelector('button[data-scene=all]');allTab.lastChild.textContent='Overview';allTab.parentNode.insertBefore(allTab,allTab.parentNode.firstChild);
root.querySelectorAll('.rf-tab small').forEach((s,i)=>{s.textContent=String(i).padStart(2,'0');});
function seek(k){const n=scenes[scene].steps.length;if(!n)return;k=((k%n)+n)%n;elapsed=k*duration+duration*.08;if(!paused)$('[data-action=pause]').click();renderMotion();}
co.querySelector('[data-co=prev]').addEventListener('click',()=>seek(stepIndex-1));
co.querySelector('[data-co=next]').addEventListener('click',()=>seek(stepIndex+1));
let coKey='',anchorEl=null;
function placeCallout(){const sc=scenes[scene];
 if(scene==='all'||stepIndex<0){if(coKey){co.classList.remove('on');coKey='';if(anchorEl)anchorEl.classList.remove('rf-anchor');}return;}
 const key=scene+':'+stepIndex+':'+board.clientWidth+':'+board.clientHeight;if(key===coKey)return;coKey=key;
 const st=sc.steps[stepIndex],e=edgeById[st.edge],a=byId[st.at||e.to];
 co.style.setProperty('--co',colors[e.kind]);
 co.querySelector('.rf-co-step').textContent='Step '+(stepIndex+1)+' / '+sc.steps.length;
 co.querySelector('.rf-co-title').textContent=st.title||'';co.querySelector('.rf-co-text').textContent=st.text;
 co.querySelector('.rf-co-dots').innerHTML=sc.steps.map((_,i)=>'<i class="'+(i<stepIndex?'done':i===stepIndex?'now':'')+'"></i>').join('');
 $('.rf-caption').textContent=sc.summary||'';
 if(anchorEl)anchorEl.classList.remove('rf-anchor');anchorEl=a.el;anchorEl.classList.add('rf-anchor');
 const bw=board.clientWidth,bh=board.clientHeight,nl=a.el.offsetLeft,nt=a.el.offsetTop,nw=a.el.offsetWidth,nh=a.el.offsetHeight,cw=co.offsetWidth,ch=co.offsetHeight,gap=16;
 let side,x,y;
 if(nl+nw+gap+cw<=bw){side='right';x=nl+nw+gap;}else if(nl-gap-cw>=0){side='left';x=nl-gap-cw;}
 if(side){y=Math.max(0,Math.min(nt+nh/2-ch/2,bh-ch));}
 else{x=Math.max(8,Math.min(nl+nw/2-cw/2,bw-cw-8));if(nt+nh+gap+ch<=bh+40){side='below';y=nt+nh+gap;}else{side='above';y=nt-gap-ch;}}
 co.dataset.side=side;co.style.left=x+'px';co.style.top=y+'px';
 const ar=co.querySelector('.rf-co-arrow');
 if(side==='right'||side==='left'){ar.style.top=Math.max(12,Math.min(nt+nh/2-y-6,ch-24))+'px';ar.style.left=side==='right'?'-7px':'';}
 else{ar.style.top=side==='below'?'-7px':'';ar.style.left=Math.max(12,Math.min(nl+nw/2-x-6,cw-24))+'px';}
 co.classList.add('on');}
const tabBtns=()=>[...root.querySelectorAll('.rf-tab')];
const keys=document.createElement('div');keys.className='rf-keys';
keys.innerHTML='<span><kbd>&larr;</kbd> <kbd>&rarr;</kbd> step</span><span><kbd>[</kbd> <kbd>]</kbd> or <kbd>Shift</kbd>+<kbd>&larr;</kbd><kbd>&rarr;</kbd> tab</span><span><kbd>0</kbd>&ndash;<kbd>8</kbd> jump to tab</span><span><kbd>Space</kbd> pause</span><span><kbd>R</kbd> replay</span><span><button type="button" data-keys-help>all shortcuts (<kbd>?</kbd>)</button></span>';
$('.rf-nav').after(keys);
const help=document.createElement('div');help.className='rf-help';help.setAttribute('role','dialog');help.setAttribute('aria-modal','true');help.setAttribute('aria-label','Keyboard shortcuts');
help.innerHTML='<div class="rf-help-box" tabindex="-1"><h3>Keyboard shortcuts</h3><table>'+[
 ['<kbd>&rarr;</kbd> / <kbd>&larr;</kbd>','Next / previous step (pauses so you can read)'],
 ['<kbd>Home</kbd> / <kbd>End</kbd>','First / last step of this tab'],
 ['<kbd>]</kbd> / <kbd>[</kbd>','Next / previous tab'],
 ['<kbd>Shift</kbd>+<kbd>&rarr;</kbd> / <kbd>&larr;</kbd>','Next / previous tab'],
 ['<kbd>0</kbd> &ndash; <kbd>8</kbd>','Jump to a tab (0 = Overview)'],
 ['<kbd>Space</kbd> or <kbd>P</kbd>','Pause / resume autoplay'],
 ['<kbd>R</kbd>','Replay this tab from step 1'],
 ['<kbd>Tab</kbd>, <kbd>Enter</kbd>','Move between and press buttons or blocks'],
 ['<kbd>Esc</kbd>','Close this panel, or clear a selected block'],
 ['<kbd>?</kbd>','Show or hide this panel']].map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>').join('')+'</table><p>Shortcuts are ignored while Ctrl, Alt or Cmd is held.</p></div>';
root.appendChild(help);
let helpReturn=null;
function toggleHelp(on){on=on===undefined?!help.classList.contains('on'):on;if(on){helpReturn=document.activeElement;help.classList.add('on');help.firstChild.focus();}else{help.classList.remove('on');if(helpReturn&&helpReturn.focus)helpReturn.focus();}}
help.addEventListener('click',e=>{if(e.target===help)toggleHelp(false);});
keys.querySelector('[data-keys-help]').addEventListener('click',()=>toggleHelp(true));
function goTab(i){const t=tabBtns();i=((i%t.length)+t.length)%t.length;setScene(t[i].dataset.scene);t[i].scrollIntoView({block:'nearest',inline:'nearest'});}
function curTab(){return tabBtns().findIndex(b=>b.dataset.scene===scene);}
function showCallout(){if(!co.classList.contains('on'))return;const top=board.getBoundingClientRect().top+parseFloat(co.style.top),h=co.offsetHeight,m=12;if(top<m||top+h>innerHeight-m){scrollBy({top:top+h/2-innerHeight/2,behavior:reduced?'auto':'smooth'});}}
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 const tag=(e.target.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea'||e.target.isContentEditable)return;
 const k=e.key,helpOn=help.classList.contains('on');
 if(k==='?'){e.preventDefault();toggleHelp();return;}
 if(helpOn){if(k==='Escape'){e.preventDefault();toggleHelp(false);}else if(k==='Tab'){e.preventDefault();}return;}
 const n=scenes[scene].steps.length;let handled=true;
 if((k==='ArrowRight'||k==='ArrowLeft')&&e.shiftKey)goTab(curTab()+(k==='ArrowRight'?1:-1));
 else if(k===']'||k==='[')goTab(curTab()+(k===']'?1:-1));
 else if(/^[0-9]$/.test(k)&&+k<tabBtns().length)goTab(+k);
 else if(k==='ArrowRight'&&n){seek(stepIndex+1);showCallout();}
 else if(k==='ArrowLeft'&&n){seek(stepIndex-1);showCallout();}
 else if(k==='Home'&&n){seek(0);showCallout();}
 else if(k==='End'&&n){seek(n-1);showCallout();}
 else if(k===' '||k==='p'||k==='P')$('[data-action=pause]').click();
 else if(k==='r'||k==='R')$('[data-action=replay]').click();
 else handled=false;
 if(handled)e.preventDefault();
});
const baseRender=renderMotion;renderMotion=function(){baseRender();placeCallout();};
"""


def _swap(page: str, old: str, new: str) -> str:
    count = page.count(old)
    if count != 1:
        raise ValueError(f"expected exactly one {old[:60]!r} in the rendered page, found {count}")
    return page.replace(old, new)


def enhance(page: str, version: str) -> str:
    """Return the rendered network-flow page with the explainer additions."""
    page = _swap(page, STEP_MS_OLD, STEP_MS_NEW)
    page = _swap(page, OVERVIEW_OLD, OVERVIEW_NEW)
    page = _swap(page, '<meta charset="utf-8">',
                 f'<meta charset="utf-8"><meta name="scrolls-explainer-version" content="{version}">')
    page = _swap(page, '<script type="application/json" id="network-flow-data">',
                 '<style>' + CSS + '</style><script type="application/json" id="network-flow-data">')
    page = _swap(page, 'function tick(time){', JS + 'function tick(time){')
    return page
