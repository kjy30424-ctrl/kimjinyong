/* Educational annual model; amounts in KRW 10,000. No market data or API dependency. */
(function(root){
'use strict';
function calculate(v){
 const {annual,years,totalReturn,distribution,kind,isaType,age,creditAnnual}=v;
 if(![annual,years,totalReturn,distribution,age,creditAnnual].every(Number.isFinite))throw Error('모든 숫자 항목을 입력해 주세요.');
 if(annual<=0||annual>2000||years<1||years>40||!Number.isInteger(years)||totalReturn<0||totalReturn>20||distribution<0||distribution>totalReturn||age<55||age>100||creditAnnual<0||creditAnnual>Math.min(600,annual))throw Error('입력 범위를 확인해 주세요. 분배율은 총수익률 이하, 세액공제 원금은 연 600만원 및 납입액 이하여야 합니다.');
 if(!['domestic','other'].includes(kind)||!['standard','preferential'].includes(isaType))throw Error('ETF 유형과 ISA 유형을 선택해 주세요.');
 const r=totalReturn/100,d=distribution/100,price=r-d;
 let gross=0,normal=0,basis=0,normalPaid=0,grossDiv=0;const path=[];
 for(let y=1;y<=years;y++){
  gross+=annual;normal+=annual;basis+=annual;
  const dividend=gross*d,nd=normal*d;
  grossDiv+=dividend;normalPaid+=nd*.154;basis+=nd*(1-.154);
  gross*=1+r;normal*=1+price+d*(1-.154);
  path.push({year:y,gross,normal,principal:annual*y});
 }
 const principal=annual*years,normalGain=Math.max(0,normal-basis),saleTax=kind==='domestic'?0:normalGain*.154;
 const isaBase=kind==='domestic'?grossDiv:Math.max(0,gross-principal),isaTax=Math.max(0,isaBase-(isaType==='standard'?200:400))*.099;
 const pensionRate=age<70?.055:age<80?.044:.033,pensionBase=creditAnnual*years+Math.max(0,gross-principal),pensionTax=pensionBase*pensionRate;
 return {principal,gross,path,normal:{net:normal-saleTax,tax:normalPaid+saleTax,saleTax,divTax:normalPaid},isa:{valid:years>=3&&principal<=10000,net:gross-isaTax,tax:isaTax,base:isaBase,reason:years<3?'의무가입기간 3년 미만':'누적 납입 1억원 초과 — 재가입·만기연장 별도 검토'},pension:{valid:annual<=1800&&years>=5,net:gross-pensionTax,tax:pensionTax,base:pensionBase,rate:pensionRate,reason:annual>1800?'연금계좌 합산 연 1,800만원 한도 초과':'신규 가입 후 5년 경과 요건 미충족'}};
}
function credit(pension,irp,rate){if(![pension,irp,rate].every(Number.isFinite)||pension<0||irp<0||pension+irp>1800||![.165,.132].includes(rate))throw Error('연금저축·IRP 합산 납입액은 0~1,800만원 범위로 입력해 주세요.');return Math.min(900,Math.min(600,pension)+irp)*rate;}
root.SeoulTax={calculate,credit};if(typeof module!=='undefined')module.exports=root.SeoulTax;
})(typeof window!=='undefined'?window:globalThis);
