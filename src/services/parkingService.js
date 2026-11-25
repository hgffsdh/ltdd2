import {collection,doc,onSnapshot,query,where} from 'firebase/firestore';
import {auth,db} from './firebaseConfig';
const base=(process.env.EXPO_PUBLIC_API_URL||'').trim().replace(/\/+$/,'');
export async function action(op,data={}){
 if(!/^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(base))throw Error('Chưa cấu hình EXPO_PUBLIC_API_URL trong file .env.');
 if(!auth.currentUser)throw Error('Vui lòng đăng nhập.');
 const token=await auth.currentUser.getIdToken();
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);
 try{
  const res=await fetch(`${base}/api/parking/action`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({...data,op}),signal:controller.signal});
  let json;try{json=await res.json();}catch{throw Error('Phản hồi API không hợp lệ. Kiểm tra địa chỉ máy chủ.');}
  if(!res.ok||!json||!Object.prototype.hasOwnProperty.call(json,'data'))throw Error(json?.error?.message||`API trả về HTTP ${res.status}`);
  return json.data;
 }catch(e){if(e.name==='AbortError'||e instanceof TypeError)throw Error('Không kết nối được backend. Kiểm tra Wi-Fi, IP, cổng 3000 và cửa sổ Node.js. Nếu vừa giao dịch, kiểm tra trạng thái trước khi thử lại.');throw e;}
 finally{clearTimeout(timer);}
}
export function watchProfile(uid,next,fail){return onSnapshot(doc(db,'sp_users',uid),{includeMetadataChanges:true},s=>next(s.data()??null,s.metadata.fromCache),fail);}
export function watchSlots(next,fail){return onSnapshot(collection(db,'sp_slots'),{includeMetadataChanges:true},s=>next(s.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>Number(a.id)-Number(b.id)),s.metadata.fromCache),fail);}
export function watchSessions(uid,staff,next,fail){const c=collection(db,'sp_sessions');const q=staff?query(c,where('state','in',['reserved','active','exit_requested','quoted','paid'])):query(c,where('userId','==',uid));return onSnapshot(q,{includeMetadataChanges:true},s=>next(s.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>b.createdAtMs-a.createdAtMs),s.metadata.fromCache),fail);}
export function newRequestId(){return doc(collection(db,'sp_sessions')).id;}
export function watchWallet(uid,next,fail){return onSnapshot(query(collection(db,'sp_wallet_events'),where('userId','==',uid)),s=>next(s.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>b.createdAtMs-a.createdAtMs)),fail);}
export function watchTopups(uid,staff,next,fail){const q=query(collection(db,'sp_topups'),where(staff?'state':'userId','==',staff?'pending':uid));return onSnapshot(q,s=>next(s.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>b.createdAtMs-a.createdAtMs)),fail);}
