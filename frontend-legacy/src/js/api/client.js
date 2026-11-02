// Gymxio · src/js/api/client.js
const sb=supabase.createClient(CFG.url,CFG.key);
const rpc=async(n,a)=>{const{data,error}=await sb.rpc(n,a);if(error)throw error;return data};
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
