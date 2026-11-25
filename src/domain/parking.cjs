const labels={reserved:'Đã giữ chỗ',active:'Đang đỗ',exit_requested:'Chờ nhân viên chốt phí',quoted:'Chờ thu tiền',paid:'Đã thu tiền · chờ xe ra',closed:'Đã hoàn tất',cancelled:'Đã hủy',free:'Trống',occupied:'Có xe'};
const money=n=>Number.isFinite(n)?`${n.toLocaleString('vi-VN')} đ`:'—';
const date=n=>Number.isFinite(n)?new Date(n).toLocaleString('vi-VN'):'—';
function fee(rate,start,now=Date.now()){return Number.isFinite(start)&&Number.isFinite(rate)?rate*Math.max(1,Math.ceil(Math.max(0,now-start)/3600000)):null;}
function duration(start,now=Date.now()){if(!Number.isFinite(start))return '—';const s=Math.max(0,Math.floor((now-start)/1000));return `${Math.floor(s/3600)}g ${Math.floor(s%3600/60)}p ${s%60}s`;}
module.exports={labels,money,date,fee,duration};
