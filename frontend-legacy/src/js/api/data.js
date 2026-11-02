// Gymxio · src/js/api/data.js
async function pull(){
  const[p,m,y,a,c]=await Promise.all([
    sb.from('plans').select('*').eq('active',true).order('price'),
    sb.from('members').select('*').order('name'),
    sb.from('payments').select('*').gte('paid_on',add(T,-90)).order('paid_on',{ascending:false}).limit(500),
    sb.from('attendance').select('member_id,day,at').gte('day',add(T,-6)).order('at'),
    sb.from('classes').select('*').order('sort')]);
  for(const r of[p,m,y,a,c])if(r.error)throw r.error;
  Object.keys(PL).forEach(k=>delete PL[k]);
  p.data.forEach(x=>PL[x.name]={id:x.id,d:x.days,p:Number(x.price)});
  D={n:0,
    members:m.data.map(x=>({id:x.id,name:x.name,dni:x.dni,phone:x.phone||'',plan:x.plan_name||'',start:x.start_date||T,end:x.end_date||add(T,-1),tk:x.qr_token,bio:x.has_bio?1:0})),
    pays:y.data.map(x=>({id:x.id,mid:x.member_id,plan:x.plan_name,amt:Number(x.amount),d:x.paid_on,met:x.method})),
    att:a.data.map(x=>({mid:x.member_id,d:x.day,t:new Date(x.at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Lima'})}))};
  CL.length=0;c.data.forEach(x=>CL.push([x.days,x.at_time.slice(0,5),x.name,x.coach||'',x.capacity]));
}
async function checkin(id,via='manual',extra=null){
  try{const n=await rpc('check_in',{p_member:id,p_via:via,p_extra:extra});await pull();toast('Ingreso registrado: '+n,'ok');render()}
  catch(e){toast(e.message,'bad')}
}
