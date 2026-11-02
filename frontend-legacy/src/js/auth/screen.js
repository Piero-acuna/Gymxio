// Gymxio · src/js/auth/screen.js · login, registro y recuperar contraseña (mismo estilo que Invenxio)
const ico=(p,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC={mail:'<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',lock:'<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',eye:'<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',arrow:'<path d="M5 12h14M12 5l7 7-7 7"/>',gym:'<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',book:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'};
const field=(lab,icon,inner)=>`<label>${lab}</label><div class="au-f">${ico(IC[icon])}${inner}</div>`;
const pw=(name,ph='••••••••',ac='current-password')=>`<input name="${name}" type="password" required minlength="6" placeholder="${ph}" autocomplete="${ac}"><button type="button" class="au-eye" data-eye aria-label="Mostrar u ocultar contraseña">${ico(IC.eye)}</button>`;
function showLogin(mode='in',msg=''){
  const note=msg?`<div class="au-note">${msg}</div>`:'';
  const cta=t=>`<button class="au-cta">${t} ${ico(IC.arrow)}</button>`;
  const V={
   in:{t:'Iniciar Sesión',s:'Accede al panel de tu gimnasio',b:`<form data-k="login">${field('Correo electrónico','mail','<input id="au-email" name="email" type="email" required placeholder="correo@gimnasio.com" autocomplete="username">')}${field('Contraseña','lock',pw('pw'))}<button type="button" class="au-link" data-forgot>¿Olvidaste tu contraseña?</button>${cta('Iniciar Sesión').replace('margin-top:22px','')}</form>`,f:'¿No tienes cuenta? <button class="au-a" data-su>Crear gimnasio nuevo</button>'},
   up:{t:'Crear gimnasio',s:'Configura tu espacio en un minuto',b:`<form data-k="signup">${field('Nombre del gimnasio','gym','<input name="gym" required placeholder="Ej. Iron Fit Lima" autocomplete="organization">')}${field('Correo electrónico','mail','<input name="email" type="email" required placeholder="correo@gimnasio.com" autocomplete="username">')}${field('Contraseña (mínimo 6)','lock',pw('pw','••••••••','new-password'))}${cta('Crear gimnasio')}</form>`,f:'¿Ya tienes cuenta? <button class="au-a" data-li>Iniciar sesión</button>'},
   reset:{t:'Nueva contraseña',s:'Elige una contraseña nueva para tu cuenta',b:`<form data-k="reset">${field('Contraseña nueva','lock',pw('pw','••••••••','new-password'))}${cta('Guardar contraseña')}</form>`,f:''}
  }[mode];
  document.body.classList.add('guest');$('#m').innerHTML='';
  $('#auth').innerHTML=`<div class="au"><div class="au-logo">${ico(IC.gym,34)}</div><h1 class="au-brand">Gym<span>xio</span></h1><p class="au-sub">GESTIÓN DE GIMNASIOS</p>
  <div class="au-card"><h2>${V.t}</h2><p class="au-mut">${V.s}</p>${note}${V.b}${V.f?`<div class="au-or">${V.f}</div>`:''}</div>
  <p class="au-iso">Cada gimnasio tiene su propio espacio aislado de datos</p>
  <div class="au-legal"><a href="legal.html#terminos">Términos y Condiciones</a><a href="legal.html#cambios">Cambios y Devoluciones</a><a href="legal.html#privacidad">Política de Privacidad</a><a class="lr" href="legal.html#reclamaciones">${ico(IC.book,16)} Libro de Reclamaciones</a></div>
  <p class="au-copy">© ${new Date().getFullYear()} Gymxio</p></div>`;
}
