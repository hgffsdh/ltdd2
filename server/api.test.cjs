const test=require('node:test');const assert=require('node:assert/strict');const {once}=require('node:events');const {createApi}=require('./api.cjs');
test('HTTP API: health, authentication, identity isolation and error responses',async t=>{
 let calls=0;const app=createApi({projectId:'test-only',verifyToken:async token=>{if(token!=='valid')throw Object.assign(Error('bad token'),{code:'auth/invalid-id-token'});return {uid:'actual-user',parkingStaff:false};},parkingAction:async req=>{calls++;assert.equal(req.auth.uid,'actual-user');assert.equal(req.auth.token.parkingStaff,false);if(req.data.op==='admit')throw Object.assign(Error('Không có quyền'),{code:'permission-denied'});return {ok:true};}});
 const server=app.listen(0,'127.0.0.1');t.after(()=>{server.closeAllConnections();server.close();});await once(server,'listening');const url=`http://127.0.0.1:${server.address().port}`;
 const post=(body,token)=>fetch(url+'/api/parking/action',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body});
 assert.equal((await (await fetch(url+'/health')).json()).projectId,'test-only');assert.equal((await post('{"op":"init"}')).status,401);assert.equal((await post('{"op":"init"}','bad')).status,401);assert.equal(calls,0);
 assert.equal((await post('{','valid')).status,400);assert.equal((await post('[]','valid')).status,400);assert.equal((await post('{"op":"admit","uid":"fake","parkingStaff":true}','valid')).status,403);
 const ok=await post('{"op":"init","uid":"fake"}','valid');assert.equal(ok.status,200);assert.deepEqual(await ok.json(),{data:{ok:true}});assert.equal(calls,2);
});
