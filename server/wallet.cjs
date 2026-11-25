const {fail,fee}=require('./domain.cjs');
function balance(p){const n=p?.balanceVnd??0;if(!Number.isSafeInteger(n)||n<0)fail('failed-precondition','Số dư không hợp lệ. Liên hệ quản lý.');return n;}
function topupAmount(n){if(!Number.isSafeInteger(n)||n<10000||n>5000000)fail('invalid-argument','Số tiền nạp từ 10.000 đến 5.000.000 đ.');return n;}
function debit(p,n){const b=balance(p);if(!Number.isSafeInteger(n)||n<0)fail('failed-precondition','Số tiền không hợp lệ.');if(b<n)fail('failed-precondition',`Thiếu ${(n-b).toLocaleString('vi-VN')} đ. Nạp tiền tại quầy rồi thử lại.`);return b-n;}
function credit(p,n){const b=balance(p)+topupAmount(n);if(!Number.isSafeInteger(b))fail('failed-precondition','Số dư vượt giới hạn.');return b;}
function settlement(session,profile,now){const amountVnd=fee(session.rateVnd,session.startAtMs,now),prepaid=session.prepaidVnd;if(!Number.isSafeInteger(prepaid)||prepaid!==session.rateVnd||prepaid>amountVnd)fail('failed-precondition','Khoản trả trước không hợp lệ.');const due=amountVnd-prepaid;return {amountVnd,due,balanceVnd:debit(profile,due)};}
function profileFields(data){const displayName=typeof data.displayName==='string'?data.displayName.trim():'';const phone=typeof data.phone==='string'?data.phone.trim():'';if(displayName.length<2||displayName.length>80|| (phone&&!/^\+?[0-9]{9,15}$/.test(phone)))fail('invalid-argument','Tên 2–80 ký tự, số điện thoại 9–15 chữ số (hoặc bỏ trống).');return {displayName,phone};}
module.exports={balance,topupAmount,debit,credit,settlement,profileFields};
