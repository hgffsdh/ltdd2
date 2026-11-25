'use strict';
const express=require('express');
const status={unauthenticated:401,'permission-denied':403,'invalid-argument':400,'not-found':404,'failed-precondition':409};
function createApi({verifyToken,parkingAction,projectId}){
 const app=express();app.disable('x-powered-by');
 app.use((req,res,next)=>{res.set('Cache-Control','no-store');res.set('X-Content-Type-Options','nosniff');next();});
 // Native Expo requests do not require CORS. Do not allow arbitrary web origins.
 app.get('/health',(req,res)=>res.json({ok:true,service:'smart-parking-api',projectId}));
 app.post('/api/parking/action',express.json({limit:'16kb',strict:true}),async(req,res)=>{
  const match=/^Bearer ([^\s]+)$/i.exec(req.get('authorization')||'');
  if(!match)return res.status(401).json({error:{code:'unauthenticated',message:'Vui lòng đăng nhập.'}});
  let token;
  try{token=await verifyToken(match[1]);}catch(e){if(!String(e.code||'').startsWith('auth/'))console.error('Token verification failed',e.code||e.name);return res.status(401).json({error:{code:'unauthenticated',message:'Không thể xác thực tài khoản. Đăng nhập lại hoặc kiểm tra máy chủ.'}});}
  if(!token?.uid)return res.status(401).json({error:{code:'unauthenticated',message:'Phiên đăng nhập không hợp lệ.'}});
  if(!req.body||typeof req.body!=='object'||Array.isArray(req.body))return res.status(400).json({error:{code:'invalid-argument',message:'Dữ liệu không hợp lệ.'}});
  try{const result=await parkingAction({auth:{uid:token.uid,token},data:req.body});return res.json({data:result});}
  catch(e){if(Object.hasOwn(status,e.code))return res.status(status[e.code]).json({error:{code:e.code,message:e.message}});console.error('Parking action failed',e.code||e.name);return res.status(500).json({error:{code:'internal',message:'Không thể xử lý. Kiểm tra kết nối máy chủ và thử lại.'}});}
 });
 app.use((req,res)=>res.status(404).json({error:{code:'not-found',message:'Không tìm thấy API.'}}));
 app.use((err,req,res,next)=>{if(err.type==='entity.too.large')return res.status(413).json({error:{code:'invalid-argument',message:'Dữ liệu quá lớn.'}});if(err.type==='entity.parse.failed')return res.status(400).json({error:{code:'invalid-argument',message:'JSON không hợp lệ.'}});console.error('HTTP error',err.code||err.name);return res.status(500).json({error:{code:'internal',message:'Lỗi máy chủ.'}});});
 return app;
}
module.exports={createApi};
