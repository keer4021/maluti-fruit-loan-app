// Shared data store, helpers and page shell (header, navigation, global search)
// for every page of the Maluti Fruit Loan App. Each page loads this file first,
// then its own js/<page>.js, which defines renderPage() and calls render().
// In the desktop app, use Electron dialogs so inputs keep working after alert/confirm.
if(window.desktopDialog){window.alert=desktopDialog.alert;window.confirm=desktopDialog.confirm}
const APP_VERSION='26.20';
const KEY='loanReconDataV5';
const SETTINGS_KEY='loanAppSettingsV2601',ADMIN_KEY='loanAppAdminSessionV2601';
const PAGES=[['index','Dashboard'],['employees','Employees'],['loans','Loans'],['loan-types','Loan Types'],['transactions','Transactions'],['loan-payments','Loan Payments'],['agreement','Agreement'],['imports','Data Import'],['reports','Reports'],['settings','Settings'],['audit','Audit Trail'],['backup','Backup']];

// One-time data resets carried over from earlier versions.
const emptyData=()=>JSON.stringify({employees:[],loans:[],payroll:[],pastel:[]});
if(!localStorage.getItem('loanReconDataV5-empty-20260911')){localStorage.setItem(KEY,emptyData());localStorage.setItem('loanReconDataV5-empty-20260911','yes')}
if(!localStorage.getItem('loanReconDataV5-cleared-20260828')){localStorage.setItem(KEY,emptyData());localStorage.setItem('loanReconDataV5-cleared-20260828','yes')}
if(!localStorage.getItem('loanReconDataV5-imports-cleared-20260911')){try{let imported=JSON.parse(localStorage.getItem(KEY)||'{}');imported.payroll=[];imported.pastel=[];localStorage.setItem(KEY,JSON.stringify(imported));localStorage.setItem('loanReconDataV5-imports-cleared-20260911','yes')}catch{}}

// Sample data used only when the stored data cannot be read.
const NEW_SEED=[
['1','2025-07-14','202030','NICO VAN VUREN',500,500,'2025-07','ADVANCE ON SALARY','KONTANT OM TANDARTS TE GAAN','Aktief','',''],['2','2025-07-08','300409','SIMON NHLAPO',500,500,'2025-07','ADVANCE ON SALARY','ADVANCE OP SALARY','Aktief','',''],['3','2025-07-28','305130','THABANG MOKOENA',500,500,'2025-08','LOAN 1','ADVANCE ON SALARY','Aktief','',''],['4','2025-07-30','300142','DAVID MOLELETSANE',1000,500,'2025-08','ADVANCE ON SALARY','ADVANCE ON SALARY','Aktief','',''],['5','2025-07-01','202001','DAVID MOFOKENG',500,500,'2025-07','ADVANCE ON SALARY','ADVANCE ON SALARY','Aktief','',''],['6','2025-09-02','300409','SIMON NHLAPO',500,500,'2025-09','LOAN 1','ADVANCE ON SALARY','Aktief','',''],['7','2025-09-05','305130','THABANG MOKOENA',700,700,'2025-09','LOAN 1','Geld vir siek kind','Aktief','',''],['8','2025-09-11','300167','SHADRACK PHUNGULA',1000,500,'2025-10','LOAN 1','ADVANCE ON SALARY','Aktief','',''],['9','2025-09-23','202001','DAVID MOFOKENG',100,100,'2025-09','LOAN 1','ADVANCE ON SALARY','Aktief','',''],['10','2025-10-07','202030','NICO VAN VUREN',2000,2000,'2025-10','LOAN 1','ADVANCE ON SALARY','Aktief','',''],['11','2025-11-13','202018','MORENA NHLAPHO',1000,1000,'2025-11','LOAN 1','Herstel van Huis','Aktief','',''],['12','2025-11-26','202030','NICO VAN VUREN',9000,9000,'2026-01','LOAN 2','DEPOSITO - R7750, ADMIN FEE - R850, KEY DEPOSITO - R400','Aktief','',''],['13','2026-01-19','202030','NICO VAN VUREN',4480,746.67,'2026-01','STUDY LOAN','STUDIE LENING','Aktief','',''],['14','2026-02-02','305130','THABANG MOKOENA',500,500,'2026-02','LOAN 1','School','Aktief','',''],['15','2026-02-06','300142','DAVID MOLELETSANE',1500,500,'2026-02','LOAN 1','VIR DEPOSITO VIR HUUR','Aktief','',''],['16','2026-02-16','202018','MORENA NHLAPHO',3000,1000,'2026-02','LOAN 1','LOAN FOR FIX OF CAR','Aktief','',''],['17','2026-04-07','300409','SIMON NHLAPO',1000,500,'2026-04','LOAN 1','LOAN','Aktief','',''],['18','2026-05-08','202033','MARIANNA ROSS-ALLEN',7000,3500,'2026-05','LOAN 1','LOAN','Aktief','',''],['19','2026-05-14','202030','NICO VAN VUREN',6000,6000,'2026-05','LOAN 1','VOORSKOT OP SALARIS','Aktief','',''],['20','2026-05-20','300167','SHADRACK PHUNGULA',1000,335,'2026-05','LOAN 1','Loan','Aktief','',''],['21','2026-05-29','202018','MORENA NHLAPHO',19258.83,1500,'2026-06','LOAN 1','Hy betaal R1500 per maand tot Nov 2026 en dan Dec 2026 R10258.83. Dar is op 28/05/2026 Deposito van R15300 betaal','Aktief','',''],['22','2025-06-04','202030','NICO VAN VUREN',4000,4000,'2025-06','LOAN 1','VOORSKOT OP SALARIS','Aktief','',''],['23','2026-06-08','202018','MORENA NHLAPHO',3300,550,'2026-06','LOAN 2','R3300 betaal om nuwe pistons vir sy motor','Aktief','',''],['24','2026-06-17','300142','DAVID MOLELETSANE',2000,500,'2026-06','LOAN 1','Loan for medical expenses','Aktief','',''],['25','2026-07-14','300409','SIMON NHLAPO',1000,500,'2026-07','LOAN 1','Loan','Aktief','',''],['26','2026-07-14','202018','MORENA NHLAPHO',500,250,'2026-07','LOAN 3','Loan','Aktief','',''],['27','2026-07-16','305130','THABANG MOKOENA',500,500,'2026-07','LOAN 1','ADVANCE ON SALARY','Aktief','',''],['28','2026-08-05','300167','SHADRACK PHUNGULA',1000,334,'2026-08','LOAN 1','Loan','Aktief','',''],['29','2026-08-13','202001','DAVID MOFOKENG',300,300,'2026-08','LOAN 1','loan','Aktief','',''],['30','2026-07-01','202030','NICO VAN VUREN',3360,560,'2026-07','STUDY LOAN','Study loan','Aktief','','']
];
const EMPLOYEE_SEED=[['202001','LEHOLO DAVID MOFOKENG','6612075291084',true,''],['202003','MELITA MANTJA MOTSITSI','7804070725088',true,''],['202004','HATLA JOHANNES LETSIA','7801035242084',true,''],['202005','MANTWETSI VIOLET DHLAMINI','8006160969084',true,''],['202018','MORENA NHLAPHO','7109275653089',true,''],['202030','NICOLAAS JOHANNES VAN VUREN','7105275131084',true,''],['202031','ALBERT JANSE VAN RENSBURG','7002095016084',true,''],['202032','CHARLOTTE GOUS','8304260113087',false,'Terminated 2025/10/24'],['202033','MARIANNA ROSS ALLEN','6207010024086',true,''],['300142','TELLO DAVID MOLELETSANE','7804165304088',true,''],['300167','SIPHIWE SHADRACK PHUNGULA','7804015773086',true,''],['300409','SIMON MOHLOPHEHI NHLAPO','7808075511088',true,''],['305130','THABANG BIGBOY MOKOENA','9704195801087',true,'']];

// ---------- Data ----------
function addEmployees(d){d.employees=d.employees||[];d.loanTypes=Array.isArray(d.loanTypes)?d.loanTypes:[];if(!d.loanTypes.length){let names=[...new Set((d.loans||[]).map(x=>x.type).filter(Boolean))];if(!names.length)names=['Loan','Salary Advance','Study Loan'];d.loanTypes=names.map(name=>({id:crypto.randomUUID(),name,active:true}))}d.loanTypes.forEach(x=>{if(!x.id)x.id=crypto.randomUUID();if(x.active===undefined)x.active=true});d.employees.forEach(e=>{if(e.active===undefined)e.active=true});d.loans.forEach(l=>{if(!d.employees.some(e=>e.employeeNo===l.employeeNo))d.employees.push({id:crypto.randomUUID(),employeeNo:l.employeeNo,employeeName:l.employeeName,idNumber:'',department:'',active:true})});(d.payroll||[]).forEach(x=>{if(!x.id)x.id=crypto.randomUUID();if(x.accepted===undefined)x.accepted=false});(d.pastel||[]).forEach(x=>{if(!x.id)x.id=crypto.randomUUID();if(x.accepted===undefined)x.accepted=false});return d}
function fresh(){return addEmployees({employees:EMPLOYEE_SEED.map(x=>({id:crypto.randomUUID(),employeeNo:x[0],employeeName:x[1],idNumber:x[2],active:x[3],department:x[4]})),loans:NEW_SEED.map(x=>({id:crypto.randomUUID(),applicationNo:x[0],applicationDate:x[1],employeeNo:x[2],employeeName:x[3],amount:x[4],payment:x[5],firstPeriod:x[6],type:x[7],notes:x[8],status:'Active',cancelReason:'',cancelMonth:'',rate:0,months:Math.ceil(x[4]/x[5]),created:new Date().toISOString()})),payroll:[],pastel:[]})}
function load(){try{let d=JSON.parse(localStorage.getItem(KEY));return d?addEmployees(d):fresh()}catch{return fresh()}}
let db=load();
// Every loan carries its own repayment list.
if(db.loans.some(loan=>!Array.isArray(loan.repayments))){db.loans.forEach(loan=>{if(!Array.isArray(loan.repayments))loan.repayments=[]});localStorage.setItem(KEY,JSON.stringify(db))}
// Existing reversals take the date of the payment they reverse.
if(!localStorage.getItem('loanReconDataV5-reversal-dates-20261020')){db.loans.forEach(loan=>loan.repayments.forEach(r=>{let o=r.reversalOf&&loan.repayments.find(p=>p.id===r.reversalOf);if(o&&o.date){r.date=o.date;r.period=o.period||o.date.slice(0,7)}}));localStorage.setItem(KEY,JSON.stringify(db));localStorage.setItem('loanReconDataV5-reversal-dates-20261020','yes')}
// ---------- Audit trail ----------
// Every save() is compared with the previously saved data and the differences are logged.
const AUDIT_KEY='loanAppAuditTrailV1',AUDIT_MAX=10000;
let auditBase=localStorage.getItem(KEY)||JSON.stringify(db);
function getAudit(){try{return JSON.parse(localStorage.getItem(AUDIT_KEY))||[]}catch{return []}}
function auditValue(v){let s=typeof v==='object'&&v!==null?JSON.stringify(v):String(v??'');return s.length>80?s.slice(0,77)+'...':s}
function auditFields(a,b,skip=[]){return [...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>!skip.includes(k)&&JSON.stringify(a[k])!==JSON.stringify(b[k])).map(k=>`${k}: ${auditValue(a[k])||'(blank)'} → ${auditValue(b[k])||'(blank)'}`).join('; ')}
function auditDiff(before,after){
  let out=[],add=(entity,action,ref,details)=>out.push({entity,action,ref,details});
  let byId=list=>new Map((list||[]).map(x=>[x.id,x]));
  let labels={employees:e=>`${e.employeeNo} - ${e.employeeName}`,loans:l=>`Loan ${l.applicationNo||''} - ${l.employeeNo} ${l.employeeName||''}`,loanTypes:t=>t.name};
  let names={employees:'Employee',loans:'Loan',loanTypes:'Loan Type'};
  Object.keys(labels).forEach(key=>{
    let a=byId(before[key]),b=byId(after[key]),label=labels[key];
    b.forEach((x,id)=>{let old=a.get(id);
      if(!old){add(names[key],'Added',label(x),auditFields({},x,['id','repayments','created']));(x.repayments||[]).forEach(p=>add('Payment','Posted',label(x),`${p.date||''} ${p.source||''} ${money(p.amount)}${p.note?' - '+p.note:''}`));return}
      let changes=auditFields(old,x,['repayments']);if(changes)add(names[key],'Changed',label(x),changes);
      if(key==='loans'){let pa=byId(old.repayments),pb=byId(x.repayments);
        pb.forEach((p,pid)=>{let op=pa.get(pid);if(!op)add('Payment',p.source==='Reversal'?'Reversed':'Posted',label(x),`${p.date||''} ${p.source||''} ${money(p.amount)}${p.note?' - '+p.note:''}`);else{let c=auditFields(op,p,['balanceAfter']);if(c)add('Payment','Changed',label(x),c)}});
        pa.forEach((p,pid)=>{if(!pb.has(pid))add('Payment','Removed',label(x),`${p.date||''} ${p.source||''} ${money(p.amount)}`)})}
    });
    a.forEach((x,id)=>{if(!b.has(id))add(names[key],'Deleted',label(x),'')});
  });
  [['payroll','Payroll Import'],['pastel','Pastel Import']].forEach(([key,name])=>{
    let a=byId(before[key]),b=byId(after[key]),added=0,changed=0,removed=0;
    b.forEach((x,id)=>{let o=a.get(id);if(!o)added++;else if(JSON.stringify(o)!==JSON.stringify(x))changed++});
    a.forEach((x,id)=>{if(!b.has(id))removed++});
    if(added||changed||removed)add(name,'Changed','',`${added} rows added, ${changed} rows changed, ${removed} rows removed`);
  });
  return out;
}
function recordAudit(){
  let now=JSON.stringify(db);if(now===auditBase)return;
  let changes;try{changes=auditDiff(JSON.parse(auditBase||'{}'),db)}catch{changes=[]}
  auditBase=now;if(!changes.length)return;
  let at=new Date().toISOString(),user=isAdmin()?'Admin':'User',page=document.body?.dataset.page||'';
  let log=getAudit().concat(changes.map(c=>({id:crypto.randomUUID(),at,user,page,...c})));
  if(log.length>AUDIT_MAX)log=log.slice(-AUDIT_MAX);
  try{localStorage.setItem(AUDIT_KEY,JSON.stringify(log))}catch{}
}
function save(){recordAudit();localStorage.setItem(KEY,JSON.stringify(db));let state=document.getElementById('saveState');if(state)state.textContent='Saved '+new Date().toLocaleTimeString('en-ZA');render()}
// Re-renders the current page; each page script defines renderPage().
function render(){updateLoanStatuses();if(typeof renderPage==='function')renderPage()}

// ---------- Formatting and files ----------
const money=n=>(Number(n)||0).toLocaleString('en-ZA',{style:'currency',currency:'ZAR'});
function localToday(){let d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
function payment(a,r,n){a=+a;r=(+r/100)/12;n=+n;if(!a||!n)return 0;return r?a*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):a/n}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function download(name,text,type){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
async function downloadWithPicker(name,text,type,pickerOptions){
  if(window.showSaveFilePicker){
    try{
      let handle=await window.showSaveFilePicker(Object.assign({suggestedName:name},pickerOptions||{}));
      let writable=await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return true;
    }catch(e){
      if(e&&e.name==='AbortError')return false;
    }
  }
  download(name,text,type);
  return true;
}
function csvCell(v){return '"'+String(v??'').replaceAll('"','""')+'"'}
function csvText(rows){return rows.map(r=>r.map(csvCell).join(',')).join('\n')}
function backupTimestamp(){let d=new Date(),pad=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'_'+pad(d.getHours())+'-'+pad(d.getMinutes())+'-'+pad(d.getSeconds())}
function backupFileName(){return 'maluti-fruit-loan-app-backup-'+backupTimestamp()+'.json'}
function pageUrl(page,params){let query=params?'?'+new URLSearchParams(params):'';return page+'.html'+query}
function pageParam(name){return new URLSearchParams(location.search).get(name)||''}

// ---------- Loan balances and status ----------
function loanPaidTotal(loan){return (loan.repayments||[]).reduce((sum,item)=>sum+(Number(item.amount)||0),0)}
function loanBalance(loan){return Math.max(0,(Number(loan.amount)||0)-loanPaidTotal(loan))}
function loanStatus(loan){if(loan.status==='Cancelled')return 'Cancelled';let paid=loanPaidTotal(loan),balance=loanBalance(loan);return balance<=.01?'Fully Paid':paid>.005?'Partial Paid':'New'}
function recalcLoanBalances(loan){
  let entries=(loan.repayments||[]).slice().sort((a,b)=>String(a.date||a.postedAt||'').localeCompare(String(b.date||b.postedAt||'')));
  let running=Number(loan.amount)||0;
  entries.forEach(item=>{running-=(Number(item.amount)||0);item.balanceAfter=Math.max(0,running)});
}
// Stores the derived status on the loan; returns true when it changed.
function normaliseLoanStatus(loan){
  if(loan.status==='Cancelled')return false;
  let before=loan.status;
  loan.status=loanStatus(loan);
  if(loan.status==='Fully Paid'&&!loan.paidUpPeriod){
    let last=(loan.repayments||[]).slice().sort((a,b)=>String(a.date||a.period||'').localeCompare(String(b.date||b.period||''))).pop();
    loan.paidUpPeriod=(last?.date||last?.period||localToday()).slice(0,7);
  }
  return before!==loan.status;
}
function updateLoanStatuses(){let changed=false;db.loans.forEach(loan=>{if(normaliseLoanStatus(loan))changed=true});if(changed)localStorage.setItem(KEY,JSON.stringify(db))}
function statusLabel(loan){normaliseLoanStatus(loan);return loan.status}
function statusClass(status){return status==='Fully Paid'?'good':status==='Partial Paid'?'warn':status==='Cancelled'?'bad':'good'}
function loanDate(loan){return loan.applicationDate||String(loan.created||'').slice(0,10)||''}
function itemDate(item){return item.date||item.paymentDate||String(item.postedAt||'').slice(0,10)||item.period||''}
function inRange(value,from,to){if(!value)return false;let d=String(value).slice(0,10);return (!from||d>=from)&&(!to||d<=to)}
function employeeOptions(activeOnly=false){return '<option value="">-- Select Employee --</option>'+db.employees.filter(x=>!activeOnly||x.active).slice().sort((a,b)=>a.employeeName.localeCompare(b.employeeName)).map(x=>`<option value="${x.id}">${esc(x.employeeName)} (${esc(x.employeeNo)})${x.active?'':' - Inactive'}</option>`).join('')}

// ---------- Settings, admin login and backups ----------
const getSettings=()=>{try{return JSON.parse(localStorage.getItem(SETTINGS_KEY))||{}}catch{return {}}};
const putSettings=s=>localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));
const isAdmin=()=>sessionStorage.getItem(ADMIN_KEY)==='1';
const backupDisplay=value=>value?new Date(value).toLocaleString('en-ZA'):'No backup recorded';
async function hashText(text){
  let digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
// Downloads a backup and records the backup date for the reminder.
function createBackupAndMark(onDone){
  downloadWithPicker(backupFileName(),JSON.stringify(db,null,2),'application/json',{types:[{description:'JSON Backup',accept:{'application/json':['.json']}}]}).then(()=>{
    let s=getSettings();s.lastBackupAt=new Date().toISOString();putSettings(s);if(onDone)onDone();
  });
}

// ---------- Payment history modal (Loans, Transactions, Loan Payments) ----------
let pendingPaymentReversal=null;
function ensurePaymentModal(){
  if(document.getElementById('paymentHistoryModal'))return;
  let modal=document.createElement('div');
  modal.id='paymentHistoryModal';
  modal.className='payment-history-modal hide';
  modal.innerHTML='<div class="payment-history-panel"><div class="admin-banner"><h2 id="paymentHistoryTitle">Payment History</h2><button class="btn" type="button" id="closePaymentHistory">Close</button></div><p class="muted" id="paymentHistoryNote"></p><div class="tablebox"><table><thead><tr><th>Date</th><th>Period</th><th>Source</th><th>Amount</th><th>Balance After</th><th>Note</th><th>Action</th></tr></thead><tbody id="paymentHistoryRows"></tbody></table></div></div>';
  document.body.appendChild(modal);
  closePaymentHistory.onclick=()=>paymentHistoryModal.classList.add('hide');
  let reversalModal=document.createElement('div');
  reversalModal.id='paymentReversalModal';
  reversalModal.className='payment-history-modal hide';
  reversalModal.innerHTML='<form class="payment-history-panel" id="paymentReversalForm"><h2>Reverse Payment</h2><p class="muted">Choose the date the reversal took place. This date will be used in payment history and reports.</p><label for="paymentReversalDate">Reversal Date *</label><input id="paymentReversalDate" type="date" required><div class="actions"><button class="btn" type="button" id="cancelPaymentReversal">Cancel</button><button class="btn danger" type="submit">Reverse Payment</button></div><p id="paymentReversalStatus" class="muted"></p></form>';
  document.body.appendChild(reversalModal);
  cancelPaymentReversal.onclick=()=>{reversalModal.classList.add('hide');pendingPaymentReversal=null};
  paymentReversalForm.onsubmit=event=>{
    event.preventDefault();
    let date=paymentReversalDate.value;
    if(!date){paymentReversalStatus.textContent='Choose a reversal date.';paymentReversalStatus.className='bad pill';return}
    let {loanId,paymentId}=pendingPaymentReversal||{};
    let loan=db.loans.find(l=>l.id===loanId),item=loan&&(loan.repayments||[]).find(p=>p.id===paymentId);
    if(!loan||!item){paymentReversalStatus.textContent='This payment could not be found.';paymentReversalStatus.className='bad pill';return}
    if(!confirm(`Reverse payment of ${money(item.amount)} on loan ${loan.applicationNo} dated ${date}?`))return;
    let newBalance=loanBalance(loan)+(Number(item.amount)||0);
    loan.repayments.push({id:crypto.randomUUID(),date,period:date.slice(0,7),amount:-(Number(item.amount)||0),source:'Reversal',note:`Reversal of payment ${item.date||item.period||paymentId}`,balanceAfter:newBalance,reversalOf:item.id,postedAt:new Date().toISOString()});
    recalcLoanBalances(loan);
    normaliseLoanStatus(loan);
    save();
    reversalModal.classList.add('hide');
    pendingPaymentReversal=null;
    showLoanPaymentHistory(loanId);
  };
}
// Reversal state of one repayment: already reversed, a reversal itself, or still reversible.
function paymentState(loan,item){
  let reversed=(loan.repayments||[]).some(r=>r.reversalOf===item.id),isReversal=item.source==='Reversal';
  return {reversed,isReversal,canEdit:!isReversal&&!reversed,canReverse:Number(item.amount)>0&&!reversed&&!isReversal};
}
function showLoanPaymentHistory(loanId){
  ensurePaymentModal();
  let loan=db.loans.find(l=>l.id===loanId);
  if(!loan)return;
  paymentHistoryTitle.textContent=`Payment History - Loan ${loan.applicationNo||''}`;
  paymentHistoryNote.textContent=`${loan.employeeNo} - ${loan.employeeName} • ${loan.type||'Loan'} • Outstanding ${money(loanBalance(loan))}`;
  let rows=(loan.repayments||[]).slice().sort((a,b)=>String(b.date||b.period||b.postedAt||'').localeCompare(String(a.date||a.period||a.postedAt||'')));
  paymentHistoryRows.innerHTML=rows.length?rows.map(item=>{
    let {reversed,canReverse}=paymentState(loan,item);
    return `<tr><td>${esc(item.date||String(item.postedAt||'').slice(0,10)||'')}</td><td>${esc(item.period||'')}</td><td>${esc(item.source||'Payment')}</td><td>${money(item.amount)}</td><td>${money(item.balanceAfter)}</td><td>${esc(item.note||item.reference||item.payrollReference||'')}</td><td>${canReverse?`<button class="btn danger" onclick="reverseLoanPayment('${loan.id}','${item.id}')">Reverse</button>`:reversed?'<span class="pill warn">Reversed</span>':'—'}</td></tr>`;
  }).join(''):'<tr><td colspan="7" class="empty">No payments posted for this loan yet.</td></tr>';
  paymentHistoryModal.classList.remove('hide');
}
function reverseLoanPayment(loanId,paymentId){
  if(!isAdmin()){alert('Login as admin in Settings before reversing a payment.');return}
  let loan=db.loans.find(l=>l.id===loanId),item=loan&&(loan.repayments||[]).find(p=>p.id===paymentId);
  if(!loan||!item)return;
  ensurePaymentModal();
  pendingPaymentReversal={loanId,paymentId};
  paymentReversalDate.value=localToday();
  paymentReversalStatus.textContent='';
  paymentReversalStatus.className='muted';
  paymentReversalModal.classList.remove('hide');
  paymentReversalDate.focus();
}
// Button that opens the payment history for one loan.
const paymentsButton=loan=>`<button class="btn" type="button" onclick="showLoanPaymentHistory('${loan.id}')">Payments</button>`;

// ---------- Page shell ----------
(function renderShell(){
  let current=document.body.dataset.page,shell=document.getElementById('appShell');
  shell.innerHTML=`<header><div><h1>Staff Loans &amp; Reconciliation <span class="app-version">Version ${APP_VERSION}</span></h1><small>Local computer application</small></div><small id="saveState">${isAdmin()?'Admin mode active':'Data is stored locally'}</small></header><nav id="nav">${PAGES.map(([page,label])=>`<a href="${pageUrl(page)}"${page===current?' class="active" aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
  if(current==='backup')return;
  let search=document.createElement('div');
  search.id='globalSearchShell';
  search.innerHTML='<input id="globalSearch" type="search" placeholder="Search employee, loan number, ID or loan type..."><div id="globalSearchResults" class="hide"></div>';
  shell.appendChild(search);
  globalSearch.oninput=()=>{
    let q=globalSearch.value.trim().toLowerCase();
    if(q.length<2){globalSearchResults.classList.add('hide');globalSearchResults.innerHTML='';return}
    let employeeHits=db.employees.filter(e=>[e.employeeNo,e.employeeName,e.idNumber,e.department].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,6);
    let loanHits=db.loans.filter(l=>[l.applicationNo,l.employeeNo,l.employeeName,l.type,l.notes].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,8);
    let links=[
      ...employeeHits.map(e=>`<button type="button" data-href="${esc(pageUrl('transactions',{employee:e.id}))}"><b>${esc(e.employeeNo)} - ${esc(e.employeeName)}</b><br><span class="muted">Employee • ${esc(e.idNumber||'No ID')}</span></button>`),
      ...loanHits.map(l=>`<button type="button" data-href="${esc(pageUrl('loans',{edit:l.id}))}"><b>Loan ${esc(l.applicationNo||'')} - ${esc(l.employeeName)}</b><br><span class="muted">${esc(l.type||'Loan')} • ${money(l.amount)} • ${esc(loanStatus(l))}</span></button>`)
    ];
    globalSearchResults.innerHTML=links.length?links.join(''):'<button type="button">No matches found.</button>';
    globalSearchResults.classList.remove('hide');
    globalSearchResults.querySelectorAll('button[data-href]').forEach(b=>b.onclick=()=>{location.href=b.dataset.href});
  };
})();
