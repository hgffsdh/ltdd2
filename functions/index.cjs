const {initializeApp}=require('firebase-admin/app');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {logger}=require('firebase-functions');
const {plate,assertReservation,transition,fail}=require('./domain.cjs');
initializeApp();const db=getFirestore();
const users=db.collection('sp_users'),slots=db.collection('sp_slots'),sessions=db.collection('sp_sessions');
function id(v){if(typeof v!=='string'||!/^[-_a-zA-Z0-9]{1,80}$/.test(v))fail('invalid-argument','Mã không hợp lệ.');return v;}
exports.parkingAction=onCall({region:'asia-southeast1',maxInstances:10},async req=>{
 if(!req.auth)throw new HttpsError('unauthenticated','Vui lòng đăng nhập.');
 const uid=req.auth.uid, actor={uid,staff:req.auth.token.parkingStaff===true}, data=req.data||{}, op=data.op, u=users.doc(uid);
 try{
  if(op==='init')return await db.runTransaction(async tx=>{const snap=await tx.get(u);if(!snap.exists)tx.create(u,{email:req.auth.token.email||'',licensePlate:'',activeSessionId:null,settings:{notifications:true},createdAt:FieldValue.serverTimestamp()});return {ok:true};});
  if(op==='savePlate'||op==='saveSettings')return await db.runTransaction(async tx=>{const p=(await tx.get(u)).data();if(!p)fail('failed-precondition','Chưa tạo hồ sơ.');if(op==='savePlate'){if(p.activeSessionId)fail('failed-precondition','Không đổi biển số khi có vé.');tx.update(u,{licensePlate:plate(data.plate)});}else{if(typeof data.notifications!=='boolean')fail('invalid-argument','Tùy chọn không hợp lệ.');tx.update(u,{settings:{notifications:data.notifications}});}return {ok:true};});
  if(op==='reserve'){
   const p=slots.doc(id(data.slotId)), s=sessions.doc();
   return await db.runTransaction(async tx=>{const [us,ps]=await Promise.all([tx.get(u),tx.get(p)]);const profile=us.data(),slot=ps.data();if(profile?.activeSessionId){const existing=(await tx.get(sessions.doc(profile.activeSessionId))).data();if(existing?.slotId===p.id&&existing.state==='reserved')return {sessionId:profile.activeSessionId};}assertReservation(profile,slot);const now=Date.now();tx.create(s,{userId:uid,slotId:p.id,zone:slot.zone,licensePlate:profile.licensePlate,rateVnd:slot.rateVnd,state:'reserved',createdAtMs:now,updatedAtMs:now,expiresAtMs:now+15*60000});tx.update(p,{status:'reserved',sessionId:s.id});tx.update(u,{activeSessionId:s.id});tx.create(s.collection('events').doc('reserved'),{action:'reserve',actorId:uid,at:FieldValue.serverTimestamp()});return {sessionId:s.id};});
  }
  if(!['cancel','admit','requestExit','quote','confirmCash','release'].includes(op))fail('invalid-argument','Thao tác không hợp lệ.');
  const s=sessions.doc(id(data.sessionId));
  return await db.runTransaction(async tx=>{const session=(await tx.get(s)).data();const changes=transition(op,session,actor,Date.now());if(op==='confirmCash'&&data.amountVnd!==session.amountVnd)fail('failed-precondition','Số tiền nhận không khớp hóa đơn.');if(!changes)return {state:session.state,amountVnd:session.amountVnd??null};const p=slots.doc(id(session.slotId)), owner=users.doc(session.userId);const [ps,us]=await Promise.all([tx.get(p),tx.get(owner)]);const slot=ps.data(),profile=us.data();if(!slot||slot.sessionId!==s.id||profile?.activeSessionId!==s.id)fail('failed-precondition','Dữ liệu vé và chỗ đỗ không khớp. Liên hệ quản lý.');if(op==='release'||op==='cancel'){tx.update(p,{status:'free',sessionId:null});tx.update(owner,{activeSessionId:null});}else if(op==='admit')tx.update(p,{status:'occupied'});tx.update(s,changes);tx.create(s.collection('events').doc(changes.state),{action:op,actorId:uid,at:FieldValue.serverTimestamp(),...(op==='confirmCash'?{amountVnd:session.amountVnd}:{})});return {state:changes.state,amountVnd:changes.amountVnd??session.amountVnd??null};});
 }catch(e){if(['invalid-argument','not-found','failed-precondition','permission-denied'].includes(e.code))throw new HttpsError(e.code,e.message);logger.error('parking action failed',e);throw new HttpsError('internal','Không thể xử lý. Kiểm tra kết nối và thử lại.');}
});
