(function(root){
 'use strict';
 const keys=['seoul-tasks-v1','seoul-crm-preview-v3','seoul-sales-ledger-v1'];
 function validate(b){
  const fail=()=>{throw Error('백업 데이터 형식이 올바르지 않습니다. 기존 데이터는 변경하지 않았습니다.');};
  if(!b||b.format!=='seoul-crm-backup'||b.version!==1||!Array.isArray(b.tasks)||!Array.isArray(b.sales)||!b.crm||typeof b.crm!=='object'||Array.isArray(b.crm)||!Array.isArray(b.crm.app_config))fail();
  for(const t of b.tasks){if(!t||typeof t.id!=='string'||typeof t.title!=='string'||!t.title.trim()||t.title.length>120||!/^\d{4}-\d{2}-\d{2}$/.test(t.date)||!Number.isFinite(Date.parse(t.date+'T'+(t.time||'09:00')+':00+09:00')))fail();}
  for(const s of b.sales){if(!s||typeof s.id!=='string'||typeof s.date!=='string'||typeof s.product!=='string'||typeof s.person!=='string'||typeof s.branch!=='string'||typeof s.createdAt!=='string'||typeof s.amount!=='number'||!Number.isFinite(s.amount)||s.amount<0)fail();}
  for(const [k,v] of Object.entries(b.crm)){if(['__proto__','constructor','prototype'].includes(k)||!Array.isArray(v)||v.some(x=>!x||typeof x!=='object'||Array.isArray(x)))fail();}
  for(const c of b.crm.app_config)if(typeof c.key!=='string')fail();
  return b;
 }
 function restore(b,storage){validate(b);const old=keys.map(k=>storage.getItem(k));const values=[b.tasks,b.crm,b.sales].map(JSON.stringify);try{keys.forEach((k,i)=>storage.setItem(k,values[i]));}catch(e){keys.forEach((k,i)=>{try{old[i]===null?storage.removeItem(k):storage.setItem(k,old[i]);}catch{}});throw Error('저장 공간이 부족하거나 저장이 차단되었습니다. 복원을 완료하지 못했습니다.');}}
 root.SeoulBackup={validate,restore};
 if(typeof module!=='undefined')module.exports=root.SeoulBackup;
})(typeof window!=='undefined'?window:globalThis);
