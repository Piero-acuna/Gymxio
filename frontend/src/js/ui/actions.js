// Gymxio · src/js/ui/actions.js
document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-su'))showLogin('up');
  else if(b.hasAttribute('data-li'))showLogin('in');
  else if(b.id=='out'){await sb.auth.signOut();location.reload()}
  else if(b.dataset.pe){const p=Object.values(PL).find(x=>x.id==b.dataset.pe),n=prompt('Nuevo precio (S/)',p.p);if(n===null)return;const pr=parseFloat(n);
    if(!(pr>=0))return toast('Precio no válido','bad');
    const{error}=await sb.from('plans').update({price:pr}).eq('id',p.id);if(error)return toast(error.message,'bad');await pull();render();toast('Precio actualizado','ok')}
});
document.addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,k=f.dataset.k,v=Object.fromEntries(new FormData(f));
  try{
    if(k=='login'){const{error}=await sb.auth.signInWithPassword({email:v.email,password:v.pw});if(error)throw error;return boot()}
    if(k=='signup'){const{data,error}=await sb.auth.signUp({email:v.email,password:v.pw});if(error)throw error;try{localStorage.setItem('gx_pending',v.gym)}catch(x){}
      return data.session?boot():showLogin('in','Revisa tu correo para confirmar la cuenta y luego entra.')}
    if(k=='new'){await rpc('register_member',{p_name:v.n.trim(),p_dni:v.dni,p_phone:v.ph||'',p_plan:PL[v.pl].id,p_method:v.me});toast('Miembro registrado','ok')}
    if(k=='ed'){const{error}=await sb.from('members').update({name:v.n.trim(),dni:v.dni,phone:v.ph}).eq('id',f.dataset.id);if(error)throw error;toast('Cambios guardados','ok')}
    if(k=='ren'){const ne=await rpc('renew_member',{p_member:+f.dataset.id,p_plan:PL[v.pl].id,p_method:v.me});toast('Renovado hasta '+fd(ne),'ok')}
    if(k=='new'||k=='ed'||k=='ren'){$('#m').innerHTML='';await pull();render()}
  }catch(err){toast(err.code=='23505'?'Ya existe un miembro con ese DNI.':(err.message||'Error'),'bad')}
});
