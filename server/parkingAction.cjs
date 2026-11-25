const {plate,assertReservation,transition,fail}=require('./domain.cjs');
const {balance,topupAmount,debit,credit,settlement,profileFields}=require('./wallet.cjs');
function createParkingAction(db,FieldValue){
 const users=db.collection('sp_users'),slots=db.collection('sp_slots'),sessions=db.collection('sp_sessions'),topups=db.collection('sp_topups'),ledger=db.collection('sp_wallet_events');
 function id(v){if(typeof v!=='string'||!/^[-_a-zA-Z0-9]{1,80}$/.test(v))fail('invalid-argument','Mã không hợp lệ.');return v;}
 const event=(tx,s,key,action,uid,extra={})=>tx.create(s.collection('events').doc(key),{action,actorId:uid,at:FieldValue.serverTimestamp(),...extra});
 const entry=(tx,key,userId,kind,deltaVnd,balanceVnd,actorId,refId,now)=>tx.create(ledger.doc(key),{userId,kind,deltaVnd,balanceVnd,actorId,refId,createdAtMs:now});
 return async function parkingAction(req){
  if(!req.auth)fail('unauthenticated','Vui lòng đăng nhập.');
  const uid=req.auth.uid,actor={uid,staff:req.auth.token.parkingStaff===true},data=req.data||{},op=data.op,u=users.doc(uid);
  if(op==='init')return db.runTransaction(async tx=>{const snap=await tx.get(u);if(!snap.exists)tx.create(u,{email:req.auth.token.email||'',licensePlate:'',displayName:'',phone:'',balanceVnd:0,activeSessionId:null,settings:{notifications:true},createdAt:FieldValue.serverTimestamp()});else if(snap.data().balanceVnd===undefined)tx.update(u,{balanceVnd:0});return {ok:true};});
  if(['savePlate','saveSettings','saveProfile'].includes(op))return db.runTransaction(async tx=>{const p=(await tx.get(u)).data();if(!p)fail('failed-precondition','Chưa tạo hồ sơ.');if(op==='savePlate'){if(p.activeSessionId)fail('failed-precondition','Không đổi biển số khi có vé.');tx.update(u,{licensePlate:plate(data.plate)});}else if(op==='saveProfile'){tx.update(u,profileFields(data));}else{if(typeof data.notifications!=='boolean')fail('invalid-argument','Tùy chọn không hợp lệ.');tx.update(u,{settings:{notifications:data.notifications}});}return {ok:true};});
  if(op==='requestTopup'){
   const amountVnd=topupAmount(data.amountVnd),t=topups.doc(id(data.requestId));
   return db.runTransaction(async tx=>{const [us,ts]=await Promise.all([tx.get(u),tx.get(t)]);const profile=us.data(),existing=ts.data();if(!profile)fail('failed-precondition','Chưa tạo hồ sơ.');if(existing){if(existing.userId!==uid||existing.amountVnd!==amountVnd)fail('failed-precondition','Mã nạp đã được sử dụng.');return {requestId:t.id,state:existing.state};}if(profile.pendingTopupId)fail('failed-precondition','Bạn đã có yêu cầu nạp tiền đang chờ.');tx.create(t,{userId:uid,email:profile.email||'',amountVnd,state:'pending',createdAtMs:Date.now()});tx.update(u,{pendingTopupId:t.id});return {requestId:t.id,state:'pending'};});
  }
  if(op==='confirmTopup'||op==='cancelTopup'){
   if(op==='confirmTopup'&&!actor.staff)fail('permission-denied','Chỉ nhân viên được xác nhận tiền thật.');const t=topups.doc(id(data.requestId));
   return db.runTransaction(async tx=>{const x=(await tx.get(t)).data();if(!x)fail('not-found','Không tìm thấy yêu cầu nạp.');if(!actor.staff&&x.userId!==uid)fail('permission-denied','Không có quyền.');if(op==='confirmTopup'&&x.userId===uid)fail('permission-denied','Không tự xác nhận nạp tiền cho mình.');const target=op==='confirmTopup'?'confirmed':'cancelled';if(x.state===target)return {state:target};if(x.state!=='pending')fail('failed-precondition','Yêu cầu đã được xử lý.');if(op==='confirmTopup'&&data.amountVnd!==x.amountVnd)fail('failed-precondition','Tiền thực nhận phải khớp yêu cầu.');const owner=users.doc(x.userId),profile=(await tx.get(owner)).data();if(!profile||profile.pendingTopupId!==t.id)fail('failed-precondition','Yêu cầu và hồ sơ không khớp.');const now=Date.now();if(op==='confirmTopup'){const b=credit(profile,x.amountVnd);tx.update(owner,{balanceVnd:b,pendingTopupId:null});entry(tx,'topup-'+t.id,x.userId,'topup',x.amountVnd,b,uid,t.id,now);}else tx.update(owner,{pendingTopupId:null});tx.update(t,{state:target,processedAtMs:now,processedBy:uid});return {state:target};});
  }
  if(op==='reserve'){
   const p=slots.doc(id(data.slotId)),s=sessions.doc(id(data.requestId));
   return db.runTransaction(async tx=>{const [us,ps,ss]=await Promise.all([tx.get(u),tx.get(p),tx.get(s)]);const profile=us.data(),slot=ps.data(),existing=ss.data();if(existing){if(existing.userId!==uid||existing.slotId!==p.id||existing.billingMode!=='prepaid')fail('failed-precondition','Mã đặt chỗ đã được sử dụng.');return {sessionId:s.id,state:existing.state};}if(profile?.activeSessionId){const old=(await tx.get(sessions.doc(profile.activeSessionId))).data();if(old?.slotId===p.id&&old.billingMode==='prepaid'&&['reserved','active','exit_requested'].includes(old.state))return {sessionId:profile.activeSessionId,state:old.state};}assertReservation(profile,slot);const now=Date.now(),b=debit(profile,slot.rateVnd);tx.create(s,{userId:uid,slotId:p.id,zone:slot.zone,licensePlate:profile.licensePlate,rateVnd:slot.rateVnd,billingMode:'prepaid',prepaidVnd:slot.rateVnd,state:'reserved',createdAtMs:now,startAtMs:now,updatedAtMs:now});tx.update(p,{status:'reserved',sessionId:s.id});tx.update(u,{activeSessionId:s.id,balanceVnd:b});entry(tx,'hold-'+s.id,uid,'reservation',-slot.rateVnd,b,uid,s.id,now);event(tx,s,'reserved','reserve',uid,{amountVnd:slot.rateVnd});return {sessionId:s.id,state:'reserved',balanceVnd:b};});
  }
  if(!['cancel','admit','requestExit','quote','confirmCash','release','settleReturn'].includes(op))fail('invalid-argument','Thao tác không hợp lệ.');
  const s=sessions.doc(id(data.sessionId));
  return db.runTransaction(async tx=>{
   const session=(await tx.get(s)).data();if(!session)fail('not-found','Không tìm thấy vé.');
   if(session.billingMode==='prepaid'){
    if(!actor.staff&&session.userId!==uid)fail('permission-denied','Bạn không có quyền.');
    if(['admit','settleReturn'].includes(op)&&!actor.staff)fail('permission-denied','Chỉ nhân viên xác nhận trạng thái xe.');
    if(!['admit','requestExit','settleReturn'].includes(op))fail('failed-precondition','Vé trả trước chỉ hỗ trợ xác nhận xe vào hoặc trả chỗ.');
    if((op==='admit'&&session.state==='active')||(op==='requestExit'&&['exit_requested','closed'].includes(session.state))||(op==='settleReturn'&&session.state==='closed'))return {state:session.state,amountVnd:session.amountVnd??null};
    if((op==='admit'&&session.state!=='reserved')||(op==='requestExit'&&!['reserved','active'].includes(session.state))||(op==='settleReturn'&&session.state!=='exit_requested'))fail('failed-precondition','Trạng thái vé không cho phép thao tác.');
    const p=slots.doc(id(session.slotId)),owner=users.doc(session.userId),[ps,us]=await Promise.all([tx.get(p),tx.get(owner)]),slot=ps.data(),profile=us.data();if(!slot||slot.sessionId!==s.id||profile?.activeSessionId!==s.id)fail('failed-precondition','Dữ liệu vé và chỗ đỗ không khớp.');const now=Date.now();
    if(op==='admit'){tx.update(p,{status:'occupied'});tx.update(s,{state:'active',admittedAtMs:now,updatedAtMs:now});event(tx,s,'active',op,uid);return {state:'active'};}
    if(op==='requestExit'){tx.update(s,{state:'exit_requested',exitRequestedAtMs:now,updatedAtMs:now});event(tx,s,'exit_requested',op,uid);return {state:'exit_requested'};}
    const {amountVnd,due,balanceVnd}=settlement(session,profile,now);tx.update(owner,{activeSessionId:null,balanceVnd});tx.update(p,{status:'free',sessionId:null});tx.update(s,{state:'closed',amountVnd,additionalVnd:due,paidAtMs:now,closedAtMs:now,updatedAtMs:now,paymentMethod:'prepaid',paidBy:uid});entry(tx,'close-'+s.id,session.userId,'settlement',-due,balanceVnd,uid,s.id,now);event(tx,s,'closed',op,uid,{amountVnd,additionalVnd:due});return {state:'closed',amountVnd,balanceVnd};
   }
   // Preserve existing V4 tickets and their original cash contract.
   const changes=transition(op,session,actor,Date.now());if(op==='confirmCash'&&data.amountVnd!==session.amountVnd)fail('failed-precondition','Số tiền nhận không khớp hóa đơn.');if(!changes)return {state:session.state,amountVnd:session.amountVnd??null};const p=slots.doc(id(session.slotId)),owner=users.doc(session.userId),[ps,us]=await Promise.all([tx.get(p),tx.get(owner)]);if(!ps.data()||ps.data().sessionId!==s.id||us.data()?.activeSessionId!==s.id)fail('failed-precondition','Dữ liệu vé và chỗ đỗ không khớp.');if(op==='release'||op==='cancel'){tx.update(p,{status:'free',sessionId:null});tx.update(owner,{activeSessionId:null});}else if(op==='admit')tx.update(p,{status:'occupied'});tx.update(s,changes);event(tx,s,changes.state,op,uid,op==='confirmCash'?{amountVnd:session.amountVnd}:{});return {state:changes.state,amountVnd:changes.amountVnd??session.amountVnd??null};
  });
 };
}
module.exports={createParkingAction};
