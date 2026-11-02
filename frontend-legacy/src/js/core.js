// Gymxio · src/js/core.js
const $=q=>document.querySelector(q),iso=d=>d.toISOString().slice(0,10),T=iso(new Date(Date.now()-new Date().getTimezoneOffset()*6e4));
const add=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return iso(d)};
const diff=s=>Math.round((new Date(s+'T12:00:00')-new Date(T+'T12:00:00'))/864e5);
const PL={'Pase diario':{d:1,p:10},'Mensual':{d:30,p:80},'Trimestral':{d:90,p:210},'Semestral':{d:180,p:380},'Anual':{d:365,p:650}};
const S=x=>'S/ '+Number(x).toFixed(2),fd=s=>{const[a,b,c]=s.split('-');return c+'/'+b+'/'+a};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CL=[['Lun / Mié / Vie','06:00','Funcional','Carlos',20],['Lun / Mié / Vie','18:30','Spinning','Andrea',15],['Mar / Jue','07:00','Yoga','Lucía',18],['Mar / Jue','19:00','Crossfit','Diego',16],['Sáb','09:00','Zumba','Marisol',25],['Sáb','11:00','Boxeo','Renzo',12]];
let D,tab='inicio',flt='Todos';
const st=m=>{const x=diff(m.end);return x<0?['bad','Vencido']:x<=7?['warn','Por vencer']:['ok','Activo']};
const mem=id=>D.members.find(m=>m.id==id);
function toast(t,c){const e=$('#t');e.textContent=t;e.className=c;e.style.display='block';clearTimeout(e._x);e._x=setTimeout(()=>e.style.display='none',2600)}
