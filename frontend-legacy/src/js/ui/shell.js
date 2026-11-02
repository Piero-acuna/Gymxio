// Gymxio · src/js/ui/shell.js
function tabs(){const L=[['inicio','Inicio'],['miembros','Miembros'],['asistencia','Asistencia'],['pagos','Pagos'],['planes','Planes'],['clases','Clases']];
$('#nv').innerHTML=L.filter(l=>(ROLE_TABS[ROLE]||[]).includes(l[0])).map(([k,n])=>`<button class="${k==tab?'on':''}" data-go="${k}">${n}</button>`).join('');
const a=D.members.filter(m=>st(m)[0]!='ok').length;$('#al').textContent='⚠ '+a+' alertas'}
function render(){tabs();$('#v').innerHTML=V[tab]();if(tab=='miembros')mt();if(tab=='asistencia')ar()}
const bd=m=>{const[c,t]=st(m);return`<span class="bd ${c}">${t}</span>`};
const who=m=>`<div class="who"><i>${esc(m.name.split(' ').map(w=>w[0]).join('').slice(0,2))}</i><div>${esc(m.name)}<div class="mut mono" style="font-size:12px">${m.dni}</div></div></div>`;
