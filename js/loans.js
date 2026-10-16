// Loans: create, edit, preview and cancel loans; loan register per employee.
// Opening loans.html?edit=<loan id> loads that loan into the form.
const employeeSummary=e=>`${e.employeeNo} • ${e.employeeName}${e.idNumber?' • ID: '+e.idNumber:''}`;
function updateEstimatedPayment(){let estimated=payment(amount.value,rate.value,months.value);paymentPreview.textContent='Estimated instalment: '+money(estimated);monthlyDeduction.value=estimated?estimated.toFixed(2):''}
['amount','rate','months'].forEach(id=>document.getElementById(id).oninput=updateEstimatedPayment);
loanApplicationDate.onchange=()=>{if(loanApplicationDate.value)firstPeriod.value=loanApplicationDate.value.slice(0,7)};

function openLoanPreview(x){let setPreview=(id,value)=>document.getElementById(id).textContent=value;setPreview('pLoanNo',x.applicationNo||'');setPreview('pApplicationDate',x.applicationDate||'');setPreview('pEmployeeNo',x.employeeNo||'');setPreview('pEmployeeName',x.employeeName||'');setPreview('pLoanType',x.type||'Loan');setPreview('pLoanAmount',money(x.amount));setPreview('pLoanRate',(Number(x.rate)||0).toFixed(2)+'%');setPreview('pLoanMonths',(x.months||'')+' months');setPreview('pMonthlyDeduction',money(x.payment));setPreview('pFirstDeduction',x.firstPeriod||'');setPreview('pLoanNotes',x.notes||'—');loanPreviewModal.classList.remove('hide')}
previewLoanForm.onclick=()=>{if(!loanForm.checkValidity()){loanForm.reportValidity();return}let emp=db.employees.find(x=>x.id===loanEmployee.value);if(!emp){alert('Select an employee first.');return}openLoanPreview({applicationNo:nextLoanNo.value,applicationDate:loanApplicationDate.value,employeeNo:emp.employeeNo,employeeName:emp.employeeName,type:loanType.value,amount:+amount.value,rate:+rate.value,months:+months.value,payment:+monthlyDeduction.value,firstPeriod:firstPeriod.value,notes:notes.value.trim()})};
function previewSavedLoan(id){let x=db.loans.find(v=>v.id===id);if(x)openLoanPreview(x)}
closeLoanPreview.onclick=()=>loanPreviewModal.classList.add('hide');
printLoanPreview.onclick=()=>{document.body.classList.add('printing-loan-preview');window.print()};
window.addEventListener('afterprint',()=>document.body.classList.remove('printing-loan-preview'));

loanEmployee.onchange=()=>{let e=db.employees.find(x=>x.id===loanEmployee.value);selectedEmployee.textContent=e?employeeSummary(e):'Select an employee from the masterfile.';render()};
loanForm.onsubmit=e=>{e.preventDefault();let emp=db.employees.find(x=>x.id===loanEmployee.value),editing=editLoanId.value;if(!emp){alert('Select an employee first.');return}let details={applicationDate:loanApplicationDate.value,employeeNo:emp.employeeNo,employeeName:emp.employeeName,amount:+amount.value,rate:+rate.value,months:+months.value,firstPeriod:firstPeriod.value,type:loanType.value,notes:notes.value.trim(),payment:+monthlyDeduction.value};if(editing){let existing=db.loans.find(x=>x.id===editing);if(!existing){alert('Loan could not be found.');return}Object.assign(existing,details,{updated:new Date().toISOString()})}else db.loans.push({...details,id:crypto.randomUUID(),applicationNo:nextLoanNo.value,status:'Active',repayments:[],created:new Date().toISOString()});save();clearLoanForm(emp.id)};
function clearLoanForm(employeeId=''){loanForm.reset();if(employeeId)loanEmployee.value=employeeId;editLoanId.value='';loanFormTitle.textContent='New Loan';saveLoanButton.textContent='Save Loan';cancelLoanEdit.classList.add('hide');rate.value=0;months.value=12;loanApplicationDate.value=localToday();firstPeriod.value=loanApplicationDate.value.slice(0,7);monthlyDeduction.value='';let keptEmployee=db.employees.find(x=>x.id===employeeId);selectedEmployee.textContent=keptEmployee?employeeSummary(keptEmployee):'Select an employee from the masterfile.';paymentPreview.textContent='Estimated instalment: R 0.00';render()}
clearLoanFields.onclick=()=>clearLoanForm();cancelLoanEdit.onclick=()=>clearLoanForm();newLoanButton.onclick=()=>clearLoanForm();
function editLoan(id){let x=db.loans.find(v=>v.id===id);if(!x)return;let emp=db.employees.find(v=>v.employeeNo===x.employeeNo);editLoanId.value=x.id;loanFormTitle.textContent='Edit Loan '+(x.applicationNo||'');saveLoanButton.textContent='Update Loan';cancelLoanEdit.classList.remove('hide');nextLoanNo.value=x.applicationNo||'';loanEmployee.value=emp?.id||'';selectedEmployee.textContent=emp?employeeSummary(emp):`${x.employeeNo} • ${x.employeeName}`;loanType.value=x.type||'';loanApplicationDate.value=x.applicationDate||localToday();amount.value=x.amount;rate.value=x.rate||0;months.value=x.months||1;firstPeriod.value=x.firstPeriod||loanApplicationDate.value.slice(0,7);monthlyDeduction.value=x.payment||'';notes.value=x.notes||'';paymentPreview.textContent='Estimated instalment: '+money(payment(amount.value,rate.value,months.value));renderPage();window.scrollTo({top:0,behavior:'smooth'})}
function cancelLoan(id){let x=db.loans.find(l=>l.id===id);if(!x||x.status==='Cancelled')return;let month=prompt('Cancellation month (YYYY-MM):',new Date().toISOString().slice(0,7));if(!month)return;if(!/^\d{4}-\d{2}$/.test(month)){alert('Please use YYYY-MM, for example 2026-08.');return}let reason=prompt('Cancellation reason:','');if(!reason)return;x.status='Cancelled';x.cancelMonth=month;x.cancelReason=reason;x.cancelledAt=new Date().toISOString();save()}

function renderLoanRegister(){
  let selectedEmp=db.employees.find(x=>x.id===loanEmployee.value),shownLoans=selectedEmp?db.loans.filter(x=>x.employeeNo===selectedEmp.employeeNo):[];
  let statusFilter=loanStatusFilter.value,q=loanRegisterSearch.value.toLowerCase();
  shownLoans=shownLoans.filter(loan=>(!statusFilter||statusFilter===statusLabel(loan))&&(!q||[loan.applicationNo,loan.employeeNo,loan.employeeName,loan.type,loan.notes].join(' ').toLowerCase().includes(q)));
  loanRegisterNote.textContent=selectedEmp?`Loan history for ${selectedEmp.employeeName} (${selectedEmp.employeeNo}).`:"Select an employee to show that employee's loan history.";
  loanRows.innerHTML=shownLoans.length?shownLoans.map(loan=>{
    let status=statusLabel(loan),canCancel=status!=='Cancelled'&&status!=='Fully Paid';
    return `<tr><td><b>${esc(loan.applicationNo)}</b></td><td>${esc(loanDate(loan)||'—')}</td><td><b>${esc(loan.employeeNo)}</b><br><span class="muted">${esc(loan.employeeName)}</span></td><td>${money(loan.amount)}</td><td>${money(loan.payment)}</td><td>${esc(loan.firstPeriod||'')}${loan.cancelMonth?'<br><span class="muted">Cancelled: '+esc(loan.cancelMonth)+'</span>':''}</td><td>${paymentsButton(loan)} <button class="btn" onclick="previewSavedLoan('${loan.id}')">Print</button> <button class="btn" onclick="editLoan('${loan.id}')">Edit</button> <span class="pill ${statusClass(status)}">${esc(status)}</span> ${canCancel?`<button class="btn danger" onclick="cancelLoan('${loan.id}')">Cancel</button>`:''}</td></tr>`;
  }).join(''):selectedEmp?'<tr><td colspan="7" class="empty">No loans found for this employee.</td></tr>':'<tr><td colspan="7" class="empty">Select an employee to view loan history.</td></tr>';
}
function renderPage(){
  let loanSelected=loanEmployee.value,loanTypeSelected=loanType.value;
  if(!editLoanId.value)nextLoanNo.value=String(Math.max(0,...db.loans.map(x=>+x.applicationNo||0))+1);
  loanEmployee.innerHTML=employeeOptions(true);
  if(db.employees.some(x=>x.id===loanSelected&&x.active))loanEmployee.value=loanSelected;
  loanType.innerHTML='<option value="">-- Select Loan Type --</option>'+db.loanTypes.filter(x=>x.active).map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');
  if(db.loanTypes.some(x=>x.active&&x.name===loanTypeSelected))loanType.value=loanTypeSelected;
  renderLoanRegister();
}
loanStatusFilter.onchange=renderLoanRegister;loanRegisterSearch.oninput=renderLoanRegister;
loanApplicationDate.value=localToday();firstPeriod.value=loanApplicationDate.value.slice(0,7);
render();
if(pageParam('edit'))editLoan(pageParam('edit'));
