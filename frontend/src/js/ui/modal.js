// Gymxio · src/js/ui/modal.js
function modal(h){$('#m').innerHTML=`<div class="ov"><div class="md">${h}</div></div>`}
const opts=s=>Object.keys(PL).map(n=>`<option ${n==s?'selected':''}>${n}</option>`).join('');
