// Gymxio · src/js/auth/session.js
function showLogin(mode='in',msg=''){
  modal(mode=='in'
   ?`<h2>Entrar a Gymxio</h2>${msg?`<p class="mut">${msg}</p>`:''}<form data-k="login"><label>Correo</label><input name="email" type="email" required autocomplete="username"><label>Contraseña</label><input name="pw" type="password" required minlength="6" autocomplete="current-password"><div class="acts"><button type="button" class="btn" data-su>Crear gimnasio</button><button class="btn p">Entrar</button></div></form>`
   :`<h2>Crear tu gimnasio</h2><form data-k="signup"><label>Nombre del gimnasio</label><input name="gym" required><label>Correo</label><input name="email" type="email" required><label>Contraseña</label><input name="pw" type="password" required minlength="6"><div class="acts"><button type="button" class="btn" data-li>Ya tengo cuenta</button><button class="btn p">Crear cuenta</button></div></form>`);
}
async function boot(){
  if(CFG.url.includes('TU-PROYECTO'))return modal('<h2>Falta configurar</h2><p class="mut">Edita frontend/config.js con la URL y la clave anon de tu proyecto Supabase.</p>');
  try{
    const{data:{session}}=await sb.auth.getSession();if(!session)return showLogin();
    const{data:pr,error}=await sb.from('profiles').select('role,full_name').eq('user_id',session.user.id).maybeSingle();if(error)throw error;
    if(!pr){let g=null;try{g=localStorage.getItem('gx_pending')}catch(x){}
      if(!g){await sb.auth.signOut();return showLogin('in','Tu usuario no tiene gimnasio asignado. Pide al dueño que te agregue.')}
      await rpc('create_gym',{p_name:g});try{localStorage.removeItem('gx_pending')}catch(x){}return boot()}
    ROLE=pr.role;const nm=pr.full_name||session.user.email;
    $('#un').textContent=nm.split('@')[0];$('#av').textContent=nm[0].toUpperCase();$('#rl').textContent={owner:'Dueño',reception:'Recepción',trainer:'Entrenador'}[ROLE];
    tab=ROLE_TABS[ROLE][0];$('#m').innerHTML='';await pull();await bioCheck();render();
  }catch(e){toast(e.message||'Error de conexión','bad')}
}
