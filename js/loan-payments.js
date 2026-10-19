// Loan Payments: post, edit and reverse payments against a specific loan.
const payEmployee=paymentEmployee,payLoan=paymentLoan,payDate=paymentDate,paySource=paymentSource,payAmount=paymentAmount,payOutstanding=paymentOutstanding,payNote=paymentNote,payStatus=loanPaymentStatus;
function recalcLoanBalances(loan){
  let entries=(loan.repayments||[]).slice().sort((a,b)=>String(a.date||a.postedAt||'').localeCompare(String(b.date||b.postedAt||'')));
  let running=Number(loan.amount)||0;
  entries.forEach(item=>{running-=(Number(item.amount)||0);item.balanceAfter=Math.max(0,running)});
}
function loansForEmployee(employeeNo){
  let selectedLoan=payLoan.value;
  return db.loans.filter(loan=>loan.employeeNo===employeeNo&&loan.status!=='Cancelled'&&(loanBalance(loan)>.005||loan.id===selectedLoan)).sort((a,b)=>String(a.firstPeriod||loanDate(a)).localeCompare(String(b.firstPeriod||loanDate(b)))||String(a.applicationNo||'').localeCompare(String(b.applicationNo||''),undefined,{numeric:true}));
}
function renderPaymentEmployees(){
  let selected=payEmployee.value;
  payEmployee.innerHTML='<option value="">-- Select Employee --</option>'+db.employees.filter(e=>e.active!==false).map(e=>`<option value="${esc(e.employeeNo)}">${esc(e.employeeNo)} - ${esc(e.employeeName)}</option>`).join('');
  if(db.employees.some(e=>e.employeeNo===selected))payEmployee.value=selected;
}
function renderPaymentLoans(){
  let employeeNo=payEmployee.value,selectedLoan=payLoan.value;
  if(!employeeNo){payLoan.innerHTML='<option value="">-- Select Employee First --</option>';updateOutstanding();return}
  let loans=loansForEmployee(employeeNo);
  payLoan.innerHTML='<option value="">-- Select Loan --</option>'+loans.map(loan=>`<option value="${loan.id}">${esc(loan.applicationNo||'')} - ${esc(loan.type||'Loan')} - Outstanding ${money(loanBalance(loan))}</option>`).join('');
  if(loans.some(loan=>loan.id===selectedLoan))payLoan.value=selectedLoan;
  updateOutstanding();
}
function updateOutstanding(){
  let loan=db.loans.find(l=>l.id===payLoan.value);
  payOutstanding.value=loan?money(loanBalance(loan)):'';
  if(loan){
    pdType.textContent=loan.type||'Loan';
    pdDate.textContent=loanDate(loan)||'—';
    pdAmount.textContent=money(loan.amount);
    pdMonthly.textContent=money(loan.payment);
    pdPaid.textContent=money(loanPaidTotal(loan));
    pdBalance.textContent=money(loanBalance(loan));
    pdFirst.textContent=loan.firstPeriod||'—';
    pdStatus.textContent=statusLabel(loan);
    pdNotes.textContent=loan.notes?'Reason: '+loan.notes:'';
    paymentLoanDetails.classList.remove('hide');
  }else{
    paymentLoanDetails.classList.add('hide');
  }
}
function resetPaymentForm(){
  payEmployee.value='';renderPaymentLoans();payDate.value=localToday();paySource.value='Payroll';payAmount.value='';payNote.value='';editPaymentId.value='';loanPaymentFormTitle.textContent='Post Payment Against Loan';postLoanPayment.textContent='Post Payment';cancelPaymentEdit.classList.add('hide');payStatus.textContent='';payStatus.className='muted';renderPaymentHistory();renderBulkPayment();
}
function clearFieldsAfterPost(){
  payAmount.value='';payNote.value='';editPaymentId.value='';loanPaymentFormTitle.textContent='Post Payment Against Loan';postLoanPayment.textContent='Post Payment';cancelPaymentEdit.classList.add('hide');
}
function renderPaymentHistory(){
  let employeeNo=payEmployee.value,employee=db.employees.find(e=>e.employeeNo===employeeNo);
  loanPaymentHistoryTitle.textContent=employeeNo?`Loan & Payment History - ${employeeNo}${employee?' - '+employee.employeeName:''}`:'Posted Payment History';
  if(!employeeNo){loanPaymentHistory.innerHTML='<p class="empty">Select an employee to view their loan and payment history.</p>';return}
  let loans=db.loans.filter(loan=>loan.employeeNo===employeeNo).sort((a,b)=>String(loanDate(b)).localeCompare(String(loanDate(a)))||String(b.applicationNo||'').localeCompare(String(a.applicationNo||''),undefined,{numeric:true}));
  if(!loans.length){loanPaymentHistory.innerHTML='<p class="empty">This employee has no loans.</p>';return}
  let totalLoaned=loans.filter(l=>l.status!=='Cancelled').reduce((s,l)=>s+(Number(l.amount)||0),0),totalPaid=loans.reduce((s,l)=>s+loanPaidTotal(l),0),totalOutstanding=loans.filter(l=>l.status!=='Cancelled').reduce((s,l)=>s+loanBalance(l),0);
  let summary=`<div class="grid" style="margin-bottom:12px"><div class="card metric"><span class="muted">Loans</span><b>${loans.length}</b></div><div class="card metric"><span class="muted">Total Loaned</span><b>${money(totalLoaned)}</b></div><div class="card metric"><span class="muted">Total Paid</span><b>${money(totalPaid)}</b></div><div class="card metric"><span class="muted">Total Outstanding</span><b>${money(totalOutstanding)}</b></div></div>`;
  loanPaymentHistory.innerHTML=summary+loans.map(loan=>{
    let status=statusLabel(loan);
    let payments=(loan.repayments||[]).slice().sort((a,b)=>String(b.date||b.postedAt||'').localeCompare(String(a.date||a.postedAt||'')));
    let rows=payments.length?payments.map(item=>{
      let {reversed,canEdit,canReverse}=paymentState(loan,item);
      return `<tr><td>${esc(item.date||String(item.postedAt||'').slice(0,10)||'')}</td><td>${esc(item.source||'Payment')}</td><td>${money(item.amount)}</td><td>${money(item.balanceAfter)}</td><td>${esc(item.note||'')}</td><td>${canEdit?`<button class="btn" onclick="editLoanPaymentEntry('${loan.id}','${item.id}')">Edit</button> `:''}${canReverse?`<button class="btn danger" onclick="reverseLoanPayment('${loan.id}','${item.id}')">Reverse</button>`:reversed?'<span class="pill warn">Reversed</span>':''}</td></tr>`;
    }).join(''):'<tr><td colspan="6" class="empty">No payments posted on this loan yet.</td></tr>';
    return `<div class="card" style="margin-top:12px;background:#f7f9fb"><h3 style="margin-bottom:6px">Loan ${esc(loan.applicationNo||'')} - ${esc(loan.type||'Loan')} <span class="pill ${statusClass(status)}">${esc(status)}</span></h3><p class="muted" style="margin:0 0 8px">Applied ${esc(loanDate(loan)||'—')} • First deduction ${esc(loan.firstPeriod||'—')} • Amount ${money(loan.amount)} • Monthly ${money(loan.payment)} • Paid ${money(loanPaidTotal(loan))} • Outstanding ${money(loanBalance(loan))}${loan.notes?' • Reason: '+esc(loan.notes):''}</p><div class="tablebox"><table><thead><tr><th>Date</th><th>Source</th><th>Amount</th><th>Balance After</th><th>Note</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }).join('');
}
function editLoanPaymentEntry(loanId,paymentId){
  let loan=db.loans.find(l=>l.id===loanId),item=loan&&(loan.repayments||[]).find(p=>p.id===paymentId);
  if(!loan||!item)return;
  renderPaymentEmployees();
  payEmployee.value=loan.employeeNo;
  renderPaymentLoans();
  payLoan.value=loan.id;
  updateOutstanding();
  payDate.value=item.date||String(item.postedAt||'').slice(0,10)||localToday();
  paySource.value=item.source||'Payroll';
  payAmount.value=Number(item.amount||0).toFixed(2);
  payNote.value=item.note||'';
  editPaymentId.value=item.id;
  loanPaymentFormTitle.textContent='Edit Payment';
  postLoanPayment.textContent='Update Payment';
  cancelPaymentEdit.classList.remove('hide');
  payStatus.textContent='';payStatus.className='muted';
  window.scrollTo({top:0,behavior:'smooth'});
}
// Bulk payment: one payment per open loan of the selected employee.
function bulkLoans(){return payEmployee.value?db.loans.filter(loan=>loan.employeeNo===payEmployee.value&&loan.status!=='Cancelled'&&loanBalance(loan)>.005).sort((a,b)=>String(a.firstPeriod||loanDate(a)).localeCompare(String(b.firstPeriod||loanDate(b)))||String(a.applicationNo||'').localeCompare(String(b.applicationNo||''),undefined,{numeric:true})):[]}
function renderBulkPayment(){
  let loans=bulkLoans();
  bulkPaymentCard.classList.toggle('hide',!payEmployee.value);
  bulkPaymentTitle.textContent=`Bulk Payment - ${payEmployee.value}`;
  bulkRows.innerHTML=loans.length?loans.map(loan=>{let bal=loanBalance(loan),def=Math.min(Number(loan.payment)||0,bal);return `<tr><td>${esc(loan.applicationNo||'')}</td><td>${esc(loan.type||'Loan')}</td><td>${money(loan.payment)}</td><td>${money(bal)}</td><td><input class="bulkDate" type="date" value="${esc(bulkDate.value)}"></td><td><input class="bulkAmount" data-loan="${loan.id}" type="number" min="0" step="0.01" value="${def>0?def.toFixed(2):''}"></td><td class="bulkAfter"></td></tr>`}).join(''):'<tr><td colspan="7" class="empty">This employee has no open loans.</td></tr>';
  bulkRows.querySelectorAll('.bulkAmount').forEach(input=>input.oninput=updateBulkTotals);
  updateBulkTotals();
}
function updateBulkTotals(){
  let sum=0;
  bulkRows.querySelectorAll('.bulkAmount').forEach(input=>{let loan=db.loans.find(l=>l.id===input.dataset.loan),amount=Number(input.value)||0,bal=loanBalance(loan);sum+=amount;let cell=input.closest('tr').querySelector('.bulkAfter');cell.textContent=money(Math.max(0,bal-amount));cell.className='bulkAfter'+(amount>bal+.005?' bad':'')});
  bulkSum.textContent=money(sum);
}
function setBulkStatus(text,cls){bulkStatus.textContent=text;bulkStatus.className=cls}
bulkDate.onchange=()=>bulkRows.querySelectorAll('.bulkDate').forEach(input=>input.value=bulkDate.value);
bulkFillMonthly.onclick=()=>{renderBulkPayment();setBulkStatus('','muted')};
bulkClear.onclick=()=>{bulkRows.querySelectorAll('.bulkAmount').forEach(input=>input.value='');bulkTotal.value='';updateBulkTotals();setBulkStatus('','muted')};
bulkAllocate.onclick=()=>{
  let remaining=Number(bulkTotal.value);
  if(!Number.isFinite(remaining)||remaining<=0){setBulkStatus('Enter a total amount to allocate.','bad pill');return}
  bulkRows.querySelectorAll('.bulkAmount').forEach(input=>{let bal=loanBalance(db.loans.find(l=>l.id===input.dataset.loan)),amount=Math.min(bal,remaining);remaining=Math.round((remaining-amount)*100)/100;input.value=amount>0?amount.toFixed(2):''});
  updateBulkTotals();
  setBulkStatus(remaining>.005?`Allocated. ${money(remaining)} exceeds the total outstanding and was not allocated.`:'Allocated oldest loan first.',remaining>.005?'warn pill':'muted');
};
postBulkPayment.onclick=()=>{
  let source=bulkSource.value,note=bulkNote.value.trim(),items=[];
  for(let input of bulkRows.querySelectorAll('.bulkAmount')){
    let loan=db.loans.find(l=>l.id===input.dataset.loan),amount=Number(input.value)||0,date=input.closest('tr').querySelector('.bulkDate').value;
    if(amount<0){setBulkStatus('Amounts cannot be negative.','bad pill');return}
    if(amount>loanBalance(loan)+.005){setBulkStatus(`Amount for loan ${loan.applicationNo} cannot be greater than the outstanding balance of ${money(loanBalance(loan))}.`,'bad pill');return}
    if(amount>0&&!date){setBulkStatus(`Enter a payment date for loan ${loan.applicationNo}.`,'bad pill');return}
    if(amount>0)items.push({loan,amount,date});
  }
  if(!items.length){setBulkStatus('Enter at least one amount.','bad pill');return}
  let total=items.reduce((s,i)=>s+i.amount,0);
  if(!confirm(`Post ${items.length} ${source} payment(s) totalling ${money(total)} for employee ${payEmployee.value}?`))return;
  let now=new Date().toISOString();
  items.forEach(({loan,amount,date})=>{loan.repayments.push({id:crypto.randomUUID(),date,period:date.slice(0,7),amount,source,note,balanceAfter:0,postedAt:now});recalcLoanBalances(loan);normaliseLoanStatus(loan)});
  save();
  bulkTotal.value='';bulkNote.value='';
  renderPaymentLoans();renderPaymentHistory();renderBulkPayment();
  setBulkStatus(`Posted ${items.length} payment(s) totalling ${money(total)}.`,'good pill');
};
function renderPage(){renderPaymentEmployees();renderPaymentLoans();renderPaymentHistory();renderBulkPayment()}
payEmployee.onchange=()=>{payLoan.value='';payAmount.value='';payStatus.textContent='';setBulkStatus('','muted');renderPaymentLoans();renderPaymentHistory();renderBulkPayment()};
payLoan.onchange=()=>{payAmount.value='';updateOutstanding()};
clearLoanPayment.onclick=resetPaymentForm;
cancelPaymentEdit.onclick=resetPaymentForm;
postLoanPayment.onclick=()=>{
  let loan=db.loans.find(l=>l.id===payLoan.value),date=payDate.value,source=paySource.value,amount=Number(payAmount.value),note=payNote.value.trim(),editingId=editPaymentId.value;
  if(!loan){payStatus.textContent='Select a loan first.';payStatus.className='bad pill';return}
  if(!date){payStatus.textContent='Enter a payment date.';payStatus.className='bad pill';return}
  if(!Number.isFinite(amount)||amount<=0){payStatus.textContent='Enter a valid payment amount.';payStatus.className='bad pill';return}
  let currentBalance=loanBalance(loan);
  if(editingId){
    let existing=(loan.repayments||[]).find(p=>p.id===editingId);
    if(!existing){payStatus.textContent='This payment could not be found.';payStatus.className='bad pill';return}
    let balanceExcluding=currentBalance+(Number(existing.amount)||0);
    if(amount>balanceExcluding+.005){payStatus.textContent=`Amount posted cannot be greater than the outstanding balance of ${money(balanceExcluding)}.`;payStatus.className='bad pill';return}
    if(!confirm(`Update this payment to ${money(amount)}?`))return;
    existing.date=date;existing.period=date.slice(0,7);existing.amount=amount;existing.source=source;existing.note=note;
    recalcLoanBalances(loan);
    normaliseLoanStatus(loan);
    save();
    payStatus.textContent=`Payment updated. Balance after payment: ${money(loanBalance(loan))}.`;
    payStatus.className='good pill';
  }else{
    if(amount>currentBalance+.005){payStatus.textContent=`Amount posted cannot be greater than the outstanding balance of ${money(currentBalance)}.`;payStatus.className='bad pill';return}
    if(!confirm(`Post ${money(amount)} ${source} payment to loan ${loan.applicationNo}?`))return;
    let balanceAfter=Math.max(0,currentBalance-amount);
    loan.repayments.push({id:crypto.randomUUID(),date,period:date.slice(0,7),amount,source,note,balanceAfter,postedAt:new Date().toISOString()});
    normaliseLoanStatus(loan);
    save();
    payStatus.textContent=`Payment posted. Balance after payment: ${money(balanceAfter)}.`;
    payStatus.className='good pill';
  }
  clearFieldsAfterPost();
  renderPaymentLoans();
  renderPaymentHistory();
  renderBulkPayment();
};
payDate.value=localToday();bulkDate.value=localToday();
render();
