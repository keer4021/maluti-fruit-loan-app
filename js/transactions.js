// Transactions: loan history per employee with date and status filters.
// Opening transactions.html?employee=<employee id> preselects that employee.
function dateInRange(date,from,to){let d=String(date||'').slice(0,10);return (!from||d>=from)&&(!to||d<=to)}
function transactionEmployeeOptions(){
  let selected=transactionEmployee.value;
  transactionEmployee.innerHTML='<option value="">All Employees</option>'+db.employees.map(e=>`<option value="${esc(e.id)}">${esc(e.employeeNo)} - ${esc(e.employeeName)}</option>`).join('');
  if(selected&&db.employees.some(e=>e.id===selected))transactionEmployee.value=selected;
}
// Loans matching the employee, search and date filters (status filter excluded).
function filteredLoans(){
  let selectedEmp=db.employees.find(x=>x.id===transactionEmployee.value),q=String(transactionSearch.value||'').toLowerCase(),from=transactionFrom.value,to=transactionTo.value;
  let employeeNos=selectedEmp?[selectedEmp.employeeNo]:db.employees.filter(e=>!q||[e.employeeNo,e.employeeName,e.idNumber,e.department].some(v=>String(v||'').toLowerCase().includes(q))).map(e=>e.employeeNo);
  return db.loans.filter(loan=>employeeNos.includes(loan.employeeNo)&&dateInRange(loanDate(loan),from,to));
}
function renderPage(){
  transactionEmployeeOptions();
  let loans=filteredLoans().sort((a,b)=>String(a.employeeNo).localeCompare(String(b.employeeNo))||String(loanDate(b)).localeCompare(String(loanDate(a)))||String(b.applicationNo||'').localeCompare(String(a.applicationNo||''),undefined,{numeric:true}));
  tLoanCount.textContent=loans.length;
  tLoanTotal.textContent=money(loans.reduce((sum,loan)=>sum+(Number(loan.amount)||0),0));
  tTotalPaid.textContent=money(loans.reduce((sum,loan)=>sum+loanPaidTotal(loan),0));
  tOutstandingTotal.textContent=money(loans.reduce((sum,loan)=>sum+loanBalance(loan),0));
  let statusFilter=transactionStatusFilter.value,shown=loans.filter(loan=>!statusFilter||loanStatus(loan)===statusFilter);
  transactionLoanRows.innerHTML=shown.length?shown.map(loan=>{
    let status=loanStatus(loan);
    return `<tr><td><b>${esc(loan.employeeNo)}</b><br><span class="muted">${esc(loan.employeeName)}</span></td><td><b>${esc(loan.applicationNo||'')}</b></td><td>${esc(loanDate(loan)||'—')}</td><td>${esc(loan.type||'Loan')}<br><span class="muted">${esc(loan.notes||'')}${loan.cancelReason?'<br>Cancellation: '+esc(loan.cancelReason)+' ('+esc(loan.cancelMonth)+')':''}</span></td><td>${money(loan.amount)}</td><td>${money(loan.payment)}</td><td>${money(loanPaidTotal(loan))}</td><td><b>${money(loanBalance(loan))}</b></td><td>${esc(loan.firstPeriod||'')}</td><td>${paymentsButton(loan)} <a class="btn" href="${esc(pageUrl('loans',{edit:loan.id}))}">Edit</a> <span class="pill ${statusClass(status)}">${esc(status)}</span></td></tr>`;
  }).join(''):'<tr><td colspan="10" class="empty">No loans match the selected filters.</td></tr>';
}
transactionEmployee.onchange=renderPage;
transactionSearch.oninput=renderPage;
transactionFrom.onchange=renderPage;
transactionTo.onchange=renderPage;
transactionStatusFilter.onchange=renderPage;
runTransactionFilter.onclick=renderPage;
clearTransactionFields.onclick=()=>{transactionEmployee.value='';transactionSearch.value='';transactionFrom.value='';transactionTo.value='';renderPage()};
exportTransactions.onclick=()=>{renderPage();let head=['employee_number','employee_name','loan_number','application_date','loan_type','reason','amount','monthly_deduction','total_paid','balance','first_deduction','status'];let rows=filteredLoans().map(loan=>[loan.employeeNo,loan.employeeName,loan.applicationNo||'',loanDate(loan),loan.type||'Loan',loan.notes||'',loan.amount,loan.payment,loanPaidTotal(loan),loanBalance(loan),loan.firstPeriod||'',loanStatus(loan)]);download('loan-history-'+new Date().toISOString().slice(0,10)+'.csv',csvText([head,...rows]),'text/csv')};
transactionEmployeeOptions();
if(pageParam('employee'))transactionEmployee.value=pageParam('employee');
render();
