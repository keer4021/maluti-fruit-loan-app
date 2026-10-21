// Reports: monthly loan pack, loan history, payment history, amortisation
// schedule, summary by loan type and a raw CSV export of all data.
{let style=document.createElement('style');style.textContent=window.loanReportCss;document.head.append(style)}
const monthOf=value=>String(value||'').slice(0,7);
const employeeSelectOptions=()=>'<option value="">All Employees</option>'+db.employees.map(e=>`<option value="${esc(e.employeeNo)}">${esc(e.employeeNo)} - ${esc(e.employeeName)}</option>`).join('');
function refillSelect(select,html){let v=select.value;select.innerHTML=html;select.value=v&&[...select.options].some(o=>o.value===v)?v:''}
function printWith(kind){
  document.body.classList.add('printing-report');
  document.body.dataset.reportPrint=kind;
  window.onafterprint=()=>{document.body.classList.remove('printing-report');delete document.body.dataset.reportPrint;window.onafterprint=null};
  window.print();
}

// ---------- Report heading (title, generated time, employee, date range) ----------
const REPORT_HEADINGS={history:['.history-report-card','Employee Loan History','Review each employee loan, repayments and outstanding balances for the selected period.'],payments:['.payment-history-report-card','Payment History','Review every payment posted against loans, per employee or across all employees.'],summary:['.summary-report-card','Summary by Loan Type','Compare original loan values, repayments and current balances by loan category.'],month:['.management-report-card','Monthly Loan Pack','Use this pack to check new loans, payroll deductions, posted payments, Pastel totals and exceptions.'],amortisation:['.amortisation-report-card','Amortisation Schedule','Follow the planned instalment, paid amount and remaining balance for each loan month by month.']};
function updateLoanReportHeader(kind,from,to,employee){
  const [selector,title,purpose]=REPORT_HEADINGS[kind],card=document.querySelector(selector);
  card.classList.add('report-sheet');
  let heading=card.querySelector('.report-heading');
  if(!heading){heading=document.createElement('div');heading.className='report-heading';card.prepend(heading);let oldTitle=card.querySelector('h3');if(oldTitle)oldTitle.hidden=true}
  heading.innerHTML='<div class="report-brand">MALUTI FRUIT</div><h1></h1><p class="report-purpose"></p><div class="report-meta"></div>';
  heading.querySelector('h1').textContent=title;
  heading.querySelector('.report-purpose').textContent=purpose;
  let footer=card.querySelector('.report-footer');
  if(!footer){footer=document.createElement('footer');footer.className='report-footer';card.append(footer)}
  footer.textContent='Maluti Fruit | '+title+' | Confidential';
  const generated=new Date().toLocaleString('en-GB',{timeZone:'Africa/Johannesburg',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
  let meta=[['Report',title],['Generated (SAST)',generated],['Employee',employee],['Date range',(from||'Beginning of records')+' to '+(to||'Latest records')]];
  if(kind==='month')meta.push(['Balance basis','Current recorded balance']);
  for(const [label,value] of meta){let row=document.createElement('div'),b=document.createElement('b');b.textContent=label;row.append(b,document.createTextNode(value));heading.querySelector('.report-meta').append(row)}
}

// ---------- Report picker ----------
const REPORT_CARDS='.history-report-card,.payment-history-report-card,.summary-report-card,.management-report-card,.amortisation-report-card';
const REPORT_VIEWS={history:['.history-report-card','Shows loan history by employee or all employees, with date filters.'],payments:['.payment-history-report-card','Shows every payment posted to loans, with employee, loan, source, date and balance after payment.'],summary:['.summary-report-card','Shows totals by loan type: original loans, paid and outstanding.'],payroll:['.management-report-card','Monthly management pack for new loans, deductions and outstanding balances.'],amortisation:['.amortisation-report-card','Shows the repayment schedule per employee and loan number.'],raw:['','Exports all stored app data to CSV for Excel checking or backup review.'],all:[REPORT_CARDS,'Shows all report sections on one page.']};
function setReportView(value){
  let [selector,note]=REPORT_VIEWS[value]||['',''];
  recon.querySelectorAll(REPORT_CARDS).forEach(card=>card.style.display='none');
  if(selector)recon.querySelectorAll(selector).forEach(card=>card.style.display='block');
  reportChoiceNote.textContent=note;
}
function exportRawData(){
  let rows=[['section','employee_number','employee_name','employee_id','department','loan_number','loan_date','loan_type','reason_or_reference','loan_amount','instalment','first_deduction','months','loan_status','payment_date','payment_source','payment_amount','payment_note','period','accepted','balance']];
  db.employees.forEach(e=>rows.push(['EMPLOYEE',e.employeeNo,e.employeeName,e.idNumber||'',e.department||'','','','','','','','','',e.active?'Active':'Inactive','','','','','','','']));
  db.loans.forEach(loan=>{
    rows.push(['LOAN',loan.employeeNo,loan.employeeName,'','',loan.applicationNo||'',loanDate(loan),loan.type||'Loan',loan.notes||'',loan.amount||0,loan.payment||0,loan.firstPeriod||'',loan.months||'',loan.status||'','','','','','','',loanBalance(loan)]);
    (loan.repayments||[]).forEach(p=>rows.push(['LOAN_PAYMENT',loan.employeeNo,loan.employeeName,'','',loan.applicationNo||'',loanDate(loan),loan.type||'Loan',loan.notes||'',loan.amount||0,loan.payment||0,loan.firstPeriod||'',loan.months||'',loan.status||'',itemDate(p),p.source||'',p.amount||0,p.note||p.reference||'',p.period||'','',loanBalance(loan)]));
  });
  (db.payroll||[]).forEach(x=>rows.push(['PAYROLL_IMPORT',x.employeeNo,'','','','','','','',x.amount||0,'','','','','','','','',x.reference||'',x.period||'',x.accepted?'YES':'NO','']));
  (db.pastel||[]).forEach(x=>rows.push(['PASTEL_IMPORT',x.employeeNo,'','','','','','','',x.amount||0,'','','','','','','','',x.reference||'',x.period||'',x.accepted?'YES':'NO','']));
  (db.loanTypes||[]).forEach(t=>rows.push(['LOAN_TYPE','','','','','','',t.name||'','','','','','',t.active===false?'Inactive':'Active','','','','','','','']));
  download('maluti-fruit-loan-app-raw-all-data-'+new Date().toISOString().replaceAll(':','-').slice(0,19)+'.csv',csvText(rows),'text/csv');
}
reportTypePicker.onchange=()=>setReportView(reportTypePicker.value);
openSelectedReport.onclick=()=>{
  let value=reportTypePicker.value;
  setReportView(value);
  if(value==='raw')exportRawData();
  if(value==='payroll')renderPack();
  if(value==='history')runHistory();
  if(value==='payments')renderPaymentHistoryReport();
  if(value==='amortisation')renderAmortisation();
  if(value==='summary')runSummary();
};
exportRawAllDataCsv.onclick=exportRawData;

// ---------- Loan history and summary by loan type ----------
function loansForReport(from,to,employeeNo=''){
  return db.loans.filter(loan=>(!employeeNo||loan.employeeNo===employeeNo)&&(inRange(loanDate(loan),from,to)||(loan.repayments||[]).some(item=>inRange(itemDate(item),from,to))));
}
function historyRow(loan,from,to){
  let paidInRange=(loan.repayments||[]).filter(item=>inRange(itemDate(item),from,to)).reduce((sum,item)=>sum+(Number(item.amount)||0),0),status=statusLabel(loan);
  return `<tr><td><b>${esc(loan.employeeNo)}</b><br><span class="muted">${esc(loan.employeeName)}</span></td><td>${esc(loan.applicationNo||'')}</td><td>${esc(loanDate(loan)||'—')}</td><td>${esc(loan.type||'Loan')}</td><td>${money(loan.amount)}</td><td>${money(paidInRange)}</td><td>${money(loanPaidTotal(loan))}</td><td>${money(loanBalance(loan))}</td><td><span class="pill ${statusClass(status)}">${esc(status)}</span></td></tr>`;
}
function runHistory(){
  let from=reportFrom.value,to=reportTo.value,employeeNo=reportEmployee.value,selectedLoan=db.loans.find(l=>l.id===reportLoanNumber.value);
  let loans=selectedLoan?[selectedLoan]:loansForReport(from,to,employeeNo).sort((a,b)=>String(a.employeeNo).localeCompare(String(b.employeeNo))||String(loanDate(a)).localeCompare(String(loanDate(b))));
  updateLoanReportHeader('history',from,to,reportEmployee.selectedOptions[0]?.textContent||'All Employees');
  loanHistoryReportRows.innerHTML=loans.length?loans.map(loan=>historyRow(loan,from,to)).join(''):'<tr><td colspan="9" class="empty">No loans found for the selected filters.</td></tr>';
}
function runSummary(){
  let from=summaryFrom.value||reportFrom.value,to=summaryTo.value||reportTo.value,groups={};
  loansForReport(from,to).forEach(loan=>{
    let type=loan.type||'Loan';
    if(!groups[type])groups[type]={count:0,total:0,paid:0,outstanding:0};
    groups[type].count++;
    if(inRange(loanDate(loan),from,to))groups[type].total+=Number(loan.amount)||0;
    groups[type].paid+=(loan.repayments||[]).filter(item=>inRange(itemDate(item),from,to)).reduce((sum,item)=>sum+(Number(item.amount)||0),0);
    groups[type].outstanding+=loanBalance(loan);
  });
  updateLoanReportHeader('summary',from,to,'All Employees');
  let rows=Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0]));
  loanSummaryReportRows.innerHTML=rows.length?rows.map(([type,x])=>`<tr><td><b>${esc(type)}</b></td><td>${x.count}</td><td>${money(x.total)}</td><td>${money(x.paid)}</td><td>${money(x.outstanding)}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">No loan data found for the selected dates.</td></tr>';
}
runLoanHistoryReport.onclick=runHistory;
runLoanSummaryReport.onclick=runSummary;
printLoanHistoryReport.onclick=()=>{runHistory();printWith('history')};
printLoanSummaryReport.onclick=()=>{runSummary();printWith('summary')};
printAllReports.onclick=()=>{runHistory();runSummary();printWith('all')};
clearReports.onclick=()=>{
  reportEmployee.value='';reportFrom.value='';reportTo.value='';summaryFrom.value='';summaryTo.value='';reportLoanNumber.value='';
  loanHistoryReportRows.innerHTML='<tr><td colspan="9" class="empty">Choose dates and run the report.</td></tr>';
  loanSummaryReportRows.innerHTML='<tr><td colspan="5" class="empty">Choose dates and run the summary.</td></tr>';
  recon.querySelectorAll('.report-heading').forEach(x=>{x.parentElement.querySelector('h3')?.removeAttribute('hidden');x.remove()});
};
reportFrom.onchange=()=>{if(!summaryFrom.value)summaryFrom.value=reportFrom.value};
reportTo.onchange=()=>{if(!summaryTo.value)summaryTo.value=reportTo.value};
reportEmployee.onchange=populateLoanFilters;

// ---------- Amortisation schedule ----------
function buildSchedule(loan){
  let rows=[],amount=Number(loan.amount)||0,monthly=Number(loan.payment)||0,balance=amount,first=loan.firstPeriod||String(loanDate(loan)).slice(0,7),months=Number(loan.months)||Math.ceil(amount/(monthly||amount||1));
  let [y,m]=String(first||localToday().slice(0,7)).split('-').map(Number);
  for(let i=1;i<=months&&balance>0.005;i++){
    let date=new Date(y,(m-1)+(i-1),1),period=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
    let scheduled=Math.min(monthly||balance,balance);
    let paid=(loan.repayments||[]).filter(p=>String(p.period||itemDate(p)).slice(0,7)===period).reduce((s,p)=>s+(Number(p.amount)||0),0);
    balance=Math.max(0,balance-paid);
    rows.push({no:i,period,scheduled,paid,balance});
  }
  return rows;
}
function populateLoanFilters(){
  refillSelect(amortEmployee,employeeSelectOptions());
  let emp=amortEmployee.value||reportEmployee.value,loans=db.loans.filter(l=>!emp||l.employeeNo===emp);
  let options='<option value="">All Loans</option>'+loans.map(l=>`<option value="${esc(l.id)}">${esc(l.applicationNo||'')} - ${esc(l.employeeNo)} - ${esc(l.type||'Loan')} - ${esc(loanDate(l))}</option>`).join('');
  refillSelect(amortLoan,options);refillSelect(reportLoanNumber,options);
}
function renderAmortisation(){
  populateLoanFilters();
  let emp=amortEmployee.value||reportEmployee.value,loanId=amortLoan.value||reportLoanNumber.value,rows=[];
  db.loans.filter(l=>(!emp||l.employeeNo===emp)&&(!loanId||l.id===loanId)).sort((a,b)=>String(a.employeeNo).localeCompare(String(b.employeeNo))||String(a.applicationNo||'').localeCompare(String(b.applicationNo||''))).forEach(loan=>buildSchedule(loan).forEach(line=>rows.push({loan,...line})));
  let periods=rows.map(x=>x.period).filter(Boolean).sort(),name=db.employees.find(x=>x.employeeNo===emp)?.employeeName||emp||'All Employees';
  updateLoanReportHeader('amortisation',periods[0]||'No scheduled dates',periods.at(-1)||'No scheduled dates',name);
  amortisationReportRows.innerHTML=rows.length?rows.map(x=>`<tr><td><b>${esc(x.loan.employeeNo)}</b><br><span class="muted">${esc(x.loan.employeeName)}</span></td><td>${esc(x.loan.applicationNo||'')}</td><td>${esc(x.period)}</td><td>${x.no}</td><td>${money(x.scheduled)}</td><td>${money(x.paid)}</td><td>${money(x.balance)}</td></tr>`).join(''):'<tr><td colspan="7" class="empty">No amortisation data for the selected filters.</td></tr>';
  return rows;
}
function exportAmortisation(){
  let rows=renderAmortisation();
  download('loan-amortisation-report-'+localToday()+'.csv',csvText([['employee_number','employee_name','loan_number','loan_type','period','instalment_number','scheduled_amount','paid_amount','balance'],...rows.map(x=>[x.loan.employeeNo,x.loan.employeeName,x.loan.applicationNo||'',x.loan.type||'Loan',x.period,x.no,x.scheduled,x.paid,x.balance])]),'text/csv');
}
runAmortisationReport.onclick=renderAmortisation;
exportAmortisationCsv.onclick=exportAmortisation;
printAmortisationReport.onclick=()=>{renderAmortisation();printWith('amortisation')};
amortEmployee.onchange=populateLoanFilters;

// ---------- Monthly loan pack for management ----------
function buildPack(from,to){
  let inRange=date=>{date=String(date||'').slice(0,10);return date>=from&&date<=to};
  let fromMonth=from.slice(0,7),toMonth=to.slice(0,7),inMonths=period=>period>=fromMonth&&period<=toMonth;
  let newLoans=db.loans.filter(loan=>inRange(loanDate(loan))).sort((a,b)=>String(a.employeeNo).localeCompare(String(b.employeeNo))||String(loanDate(a)).localeCompare(String(loanDate(b))));
  let payroll=(db.payroll||[]).filter(x=>inMonths(x.period)),pastel=(db.pastel||[]).filter(x=>inMonths(x.period)),posted=[];
  db.loans.forEach(loan=>(loan.repayments||[]).filter(item=>inRange(itemDate(item))).forEach(item=>posted.push({loan,item})));
  let total=(list,value)=>list.reduce((s,x)=>s+(Number(value(x))||0),0);
  let outstanding=db.loans.filter(loan=>loanBalance(loan)>0.005&&loan.status!=='Cancelled').sort((a,b)=>String(a.employeeNo).localeCompare(String(b.employeeNo)));
  let summary={newLoanTotal:total(newLoans,x=>x.amount),payrollTotal:total(payroll,x=>x.amount),postedTotal:total(posted,x=>x.item.amount),pastelTotal:total(pastel,x=>x.amount),outstandingTotal:outstanding.reduce((s,x)=>s+loanBalance(x),0)};
  return{from,to,newLoans,outstanding,summary};
}
function groupedOutstanding(loans){
  let groups=new Map(),result='';
  for(const loan of loans){let key=String(loan.employeeNo||'');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(loan)}
  for(const [number,items] of groups){
    result+=`<tr class="employee-group"><td colspan="5">${esc(number)} · ${esc(items[0].employeeName)}</td></tr>`;
    result+=items.map(x=>`<tr><td>${esc(x.applicationNo)}</td><td>${esc(x.type||'Loan')}</td><td class="num">${money(x.amount)}</td><td class="num">${money(loanPaidTotal(x))}</td><td class="num">${money(loanBalance(x))}</td></tr>`).join('');
    result+=`<tr class="report-subtotal"><td colspan="4">Employee subtotal</td><td class="num">${money(items.reduce((sum,x)=>sum+loanBalance(x),0))}</td></tr>`;
  }
  if(!loans.length)result='<tr><td colspan="5">No outstanding loan balances.</td></tr>';
  return result+`<tr class="report-total"><td colspan="4">GRAND TOTAL (BALANCE)</td><td class="num">${money(loans.reduce((sum,x)=>sum+loanBalance(x),0))}</td></tr>`;
}
// Lays the pack out as a printable management report: totals rows, a second
// "Outstanding loan balances" page grouped per employee, and sign-off lines.
function styleMonthlyLoanPack(pack){
  const card=payrollReconPackCard;
  payrollReconKpis.innerHTML=[['New loans',pack.newLoans.length],['New loan value',money(pack.summary.newLoanTotal)],['Current outstanding',money(pack.summary.outstandingTotal)]].map(([label,value])=>`<div class="recon-kpi"><span>${label}</span><b>${value}</b></div>`).join('');
  payrollNewLoanRows.insertAdjacentHTML('beforeend',`<tr class="report-total"><td colspan="5">TOTAL</td><td class="num">${money(pack.newLoans.reduce((sum,x)=>sum+(Number(x.amount)||0),0))}</td><td class="num">${money(pack.newLoans.reduce((sum,x)=>sum+(Number(x.payment)||0),0))}</td></tr>`);
  payrollNewLoanRows.querySelectorAll('tr').forEach(row=>{if(row.cells.length===7){row.cells[5].classList.add('num');row.cells[6].classList.add('num')}});
  const box=payrollOutstandingRows.closest('.tablebox');
  let section=card.querySelector('.report-continuation');
  if(!section){
    let oldTitle=box.previousElementSibling;if(oldTitle?.tagName==='H4')oldTitle.remove();
    section=document.createElement('section');section.className='report-continuation';box.before(section);section.append(box);
  }
  section.querySelector('.report-heading')?.remove();
  const heading=card.querySelector('.report-heading').cloneNode(true);
  heading.querySelector('h1').textContent='OUTSTANDING LOAN BALANCES';
  section.prepend(heading);
  payrollOutstandingRows.closest('table').querySelector('thead').innerHTML='<tr><th>Loan #</th><th>Type</th><th>Original</th><th>Paid</th><th>Balance</th></tr>';
  payrollOutstandingRows.innerHTML=groupedOutstanding(pack.outstanding);
  let note=section.querySelector('.report-section-note');
  if(!note){note=document.createElement('p');note.className='report-section-note';section.append(note)}
  note.textContent='Outstanding balances reflect current recorded repayments, not a historical month-end snapshot.';
  const signoff=card.querySelector('.signoff-box');
  signoff.innerHTML=['Prepared by','Checked by','Approved by'].map(label=>`<div>${label}<div class="signature-line"></div>Date: <span class="signature-date"></span></div>`).join('');
  section.append(signoff);
}
function renderPack(){
  let from=payrollReconFrom.value,to=payrollReconTo.value;
  if(!from||!to){payrollPackStatus.textContent='Choose a date from and date to first.';payrollPackStatus.className='bad pill';return null}
  if(from>to){payrollPackStatus.textContent='Date from must be on or before date to.';payrollPackStatus.className='bad pill';return null}
  let pack=buildPack(from,to);
  updateLoanReportHeader('month',from,to,'All Employees');
  payrollPackStatus.textContent='Report ready for '+from+' to '+to+'.';payrollPackStatus.className='good pill';
  payrollNewLoanRows.innerHTML=pack.newLoans.length?pack.newLoans.map(loan=>`<tr><td><b>${esc(loan.employeeNo)}</b><br><span class="muted">${esc(loan.employeeName)}</span></td><td>${esc(loan.applicationNo||'')}</td><td>${esc(loanDate(loan))}</td><td>${esc(loan.type||'Loan')}</td><td>${esc(loan.notes||'')}</td><td>${money(loan.amount)}</td><td>${money(loan.payment)}</td></tr>`).join(''):'<tr><td colspan="7" class="empty">No new loans in this period.</td></tr>';
  styleMonthlyLoanPack(pack);
  return pack;
}
function exportPackCsv(){
  let pack=renderPack();if(!pack)return;
  let rows=[['section','employee_number','employee_name','loan_number','application_date','loan_type','reason_or_note','expected_deduction','payroll_amount','posted_amount','loan_amount','total_paid','outstanding_balance','status']];
  pack.newLoans.forEach(loan=>rows.push(['NEW_LOAN',loan.employeeNo,loan.employeeName,loan.applicationNo||'',loanDate(loan),loan.type||'Loan',loan.notes||'',loan.payment||0,'','',loan.amount||0,loanPaidTotal(loan),loanBalance(loan),loan.status||'']));
  pack.outstanding.forEach(loan=>rows.push(['OUTSTANDING_BALANCE',loan.employeeNo,loan.employeeName,loan.applicationNo||'',loanDate(loan),loan.type||'Loan',loan.notes||'','','','',loan.amount||0,loanPaidTotal(loan),loanBalance(loan),loan.status||'']));
  rows.push(['SUMMARY','','','','','','','',pack.summary.payrollTotal,pack.summary.postedTotal,pack.summary.newLoanTotal,'',pack.summary.outstandingTotal,'']);
  download('monthly-loan-pack-'+pack.from+'-to-'+pack.to+'.csv',csvText(rows),'text/csv');
}
runPayrollReconPack.onclick=renderPack;
exportPayrollReconPackCsv.onclick=exportPackCsv;
printPayrollReconPack.onclick=()=>{if(renderPack())printWith('payroll-pack')};

// ---------- Payment history ----------
function paymentReportRows(){
  let employee=paymentReportEmployee.value,from=paymentReportFrom.value,to=paymentReportTo.value,rows=[];
  db.loans.forEach(loan=>(loan.repayments||[]).forEach(item=>{let date=String(item.date||item.paymentDate||item.postedAt||item.period||'').slice(0,10);if((!employee||loan.employeeNo===employee)&&(!from||date>=from)&&(!to||date<=to))rows.push({loan,item,date})}));
  return rows.sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.loan.applicationNo||'').localeCompare(String(a.loan.applicationNo||''),undefined,{numeric:true}));
}
function renderPaymentHistoryReport(){
  refillSelect(paymentReportEmployee,employeeSelectOptions());
  let rows=paymentReportRows();
  paymentReportCount.textContent=rows.length;
  paymentReportTotal.textContent=money(rows.reduce((sum,x)=>sum+(Number(x.item.amount)||0),0));
  paymentReportEmployees.textContent=new Set(rows.map(x=>x.loan.employeeNo)).size;
  updateLoanReportHeader('payments',paymentReportFrom.value,paymentReportTo.value,paymentReportEmployee.selectedOptions[0]?.textContent||'All Employees');
  paymentHistoryReportRows.innerHTML=rows.length?rows.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.item.period||x.date.slice(0,7))}</td><td><b>${esc(x.loan.employeeNo)}</b><br><span class="muted">${esc(x.loan.employeeName)}</span></td><td>${esc(x.loan.applicationNo||'')}</td><td>${esc(x.loan.type||'Loan')}</td><td>${esc(x.item.source||'Payment')}</td><td class="num">${money(x.item.amount)}</td><td class="num">${money(x.item.balanceAfter)}</td><td>${esc(x.item.note||x.item.reference||x.item.payrollReference||'')}</td></tr>`).join(''):'<tr><td colspan="9" class="empty">No payments match the selected filters.</td></tr>';
  return rows;
}
function exportPaymentHistory(){
  let rows=renderPaymentHistoryReport();
  download('payment-history-'+localToday()+'.csv',csvText([['date','period','employee_number','employee_name','loan_number','loan_type','source','amount','balance_after','note'],...rows.map(x=>[x.date,x.item.period||x.date.slice(0,7),x.loan.employeeNo,x.loan.employeeName,x.loan.applicationNo||'',x.loan.type||'Loan',x.item.source||'Payment',x.item.amount,x.item.balanceAfter,x.item.note||x.item.reference||x.item.payrollReference||''])]),'text/csv');
}
runPaymentHistoryReport.onclick=renderPaymentHistoryReport;
exportPaymentHistoryReport.onclick=exportPaymentHistory;
paymentReportEmployee.onchange=renderPaymentHistoryReport;
paymentReportFrom.onchange=renderPaymentHistoryReport;
paymentReportTo.onchange=renderPaymentHistoryReport;

function renderPage(){
  refillSelect(reportEmployee,employeeSelectOptions());
  refillSelect(paymentReportEmployee,employeeSelectOptions());
  populateLoanFilters();
}
payrollReconFrom.value=localToday().slice(0,8)+'01';
payrollReconTo.value=localToday();
setReportView('payroll');
render();
