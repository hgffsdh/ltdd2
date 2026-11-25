import React,{createContext,useState,useEffect,useRef} from 'react';
import {auth} from '../services/firebaseConfig';
import {signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut as firebaseSignOut,onIdTokenChanged,sendPasswordResetEmail} from 'firebase/auth';
import * as service from '../services/parkingService';
import {notifyParking} from '../services/NotificationService';
export const AuthContext=createContext();
const errorText=e=>e?.message?.replace(/^Firebase: /,'')||'Không thể kết nối máy chủ.';
export function AuthProvider({children}){
 const [user,setUser]=useState(null),[staff,setStaff]=useState(false),[loading,setLoading]=useState(true),[userData,setUserData]=useState(null),[slots,setSlots]=useState([]),[history,setHistory]=useState([]),[staffQueue,setStaffQueue]=useState([]),[dataError,setDataError]=useState(''),[cached,setCached]=useState({profile:true,slots:true,history:true,staff:true}),[busy,setBusy]=useState(false),[refresh,setRefresh]=useState(0);const lock=useRef(false),lastUid=useRef(null);
 useEffect(()=>onIdTokenChanged(auth,async u=>{if(lastUid.current!==u?.uid){setStaff(false);lastUid.current=u?.uid;}setUser(u);if(!u){setStaff(false);setLoading(false);return;}try{const token=await u.getIdTokenResult();if(auth.currentUser?.uid===u.uid)setStaff(token.claims.parkingStaff===true);}catch(e){setDataError(errorText(e));}finally{setLoading(false);}}),[]);
 useEffect(()=>{setUserData(null);setSlots([]);setHistory([]);setStaffQueue([]);setCached({profile:true,slots:true,history:true,staff:true});setDataError('');if(!user)return;let alive=true;const fail=e=>{if(alive)setDataError(errorText(e));};const mark=(key,value)=>setCached(prev=>({...prev,[key]:value}));const a=service.watchProfile(user.uid,(v,c)=>{if(alive){setUserData(v);mark('profile',c);}},fail);const b=service.watchSlots((v,c)=>{if(alive){setSlots(v);mark('slots',c);}},fail);const c=service.watchSessions(user.uid,false,(v,cache)=>{if(alive){setHistory(v);mark('history',cache);}},fail);const d=staff?service.watchSessions(user.uid,true,(v,cache)=>{if(alive){setStaffQueue(v);mark('staff',cache);}},fail):()=>{};service.action('init').catch(fail);return()=>{alive=false;a();b();c();d();};},[user?.uid,staff,refresh]);
 const signIn=async({email,password})=>{try{await signInWithEmailAndPassword(auth,email.trim(),password);return {ok:true};}catch(e){return {ok:false,error:errorText(e)};}};
 const register=async({email,password})=>{try{await createUserWithEmailAndPassword(auth,email.trim(),password);return {ok:true};}catch(e){return {ok:false,error:errorText(e)};}};
 const resetPassword=async email=>{try{await sendPasswordResetEmail(auth,email.trim());return {ok:true};}catch(e){return {ok:false,error:errorText(e)};}};
 const online=!!userData&&!cached.profile&&!cached.slots&&!cached.history&&!dataError;
 async function run(op,data={}){if(lock.current)throw Error('Đang xử lý giao dịch.');lock.current=true;setBusy(true);try{const r=await service.action(op, ['reserve','requestTopup'].includes(op) ? {...data,requestId:data.requestId||service.newRequestId()} : data);if(['reserve','requestExit','cancel'].includes(op)&&userData?.settings?.notifications!==false)notifyParking('Smart Parking','Yêu cầu đã được máy chủ ghi nhận.').catch(()=>{});return r;}catch(e){throw Error(errorText(e));}finally{lock.current=false;setBusy(false);}}
 return <AuthContext.Provider value={{user,staff,userData,loading,slots,history,staffQueue,dataError,online,staffOnline:online&&!cached.staff,busy,signIn,register,resetPassword,signOut:()=>firebaseSignOut(auth),savePlate:plate=>run('savePlate',{plate}),saveSettings:s=>run('saveSettings',s),run,retry:()=>setRefresh(n=>n+1)}}>{children}</AuthContext.Provider>;
}
export default AuthProvider;
