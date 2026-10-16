// Dashboard: loan totals, status counts and the backup reminder.
function renderBackupReminder(){
  let s=getSettings(),days=Number(s.backupReminderDays||7),last=s.lastBackupAt,needs=!last||((new Date(localToday())-new Date(last))/86400000>=days);
  let card=document.getElementById('backupReminderCard');
  if(!needs){if(card)card.remove();return}
  if(!card){
    card=document.createElement('div');
    card.id='backupReminderCard';
    card.className='card backup-alert';
    card.style.marginTop='16px';
    card.innerHTML=`<div class="admin-banner"><div><h3>Backup reminder</h3><p class="muted" id="backupReminderText"></p></div><button class="primary" type="button" id="dashboardBackupNow">Create Backup Now</button></div>`;
    dashboard.insertBefore(card,dashboard.children[1]||null);
    dashboardBackupNow.onclick=()=>createBackupAndMark(renderBackupReminder);
  }
  backupReminderText.textContent=last?`Last backup was ${backupDisplay(last)}. Create a fresh backup before doing more changes.`:'No backup date recorded yet. Create a backup now.';
}
function renderPage(){
  let emptyState=document.getElementById('dashboardEmptyState');
  if(db.loans.length===0){
    emptyState.textContent='No loans have been added yet. Add employees and create a loan to see dashboard totals.';
    emptyState.classList.remove('hide');
  }else if(db.employees.length===0){
    emptyState.textContent='No employees have been added yet. Add employees to associate loans with staff members.';
    emptyState.classList.remove('hide');
  }else{
    emptyState.classList.add('hide');
  }
  let open=db.loans.filter(loan=>loan.status!=='Cancelled');
  mActive.textContent=open.filter(loan=>loanBalance(loan)>.005).length;
  mBalance.textContent=money(open.reduce((sum,loan)=>sum+loanBalance(loan),0));
  mNewLoans.textContent=db.loans.filter(loan=>statusLabel(loan)==='New').length;
  mPartialLoans.textContent=db.loans.filter(loan=>statusLabel(loan)==='Partial Paid').length;
  mFullyPaidLoans.textContent=db.loans.filter(loan=>statusLabel(loan)==='Fully Paid').length;
  mOriginalLoans.textContent=money(open.reduce((sum,loan)=>sum+(Number(loan.amount)||0),0));
  mTotalPaid.textContent=money(db.loans.reduce((sum,loan)=>sum+loanPaidTotal(loan),0));
  mEmployees.textContent=db.employees.length;
  mLoanTypes.textContent=db.loanTypes.length;
  let statusRows=['New','Partial Paid','Fully Paid','Cancelled'].map(status=>({status,count:db.loans.filter(loan=>statusLabel(loan)===status).length}));
  dashboardStatusList.innerHTML=statusRows.map(row=>`<div class="dashboard-list-row"><span><span class="pill ${statusClass(row.status)}">${esc(row.status)}</span></span><b>${row.count}</b></div>`).join('');
  let groups={};
  open.forEach(loan=>{let type=loan.type||'Loan';if(!groups[type])groups[type]={balance:0,count:0};groups[type].balance+=loanBalance(loan);groups[type].count++});
  let rows=Object.entries(groups).sort((a,b)=>b[1].balance-a[1].balance).slice(0,6);
  dashboardTypeList.innerHTML=rows.length?rows.map(([type,x])=>`<div class="dashboard-list-row"><span>${esc(type)}<br><span class="muted">${x.count} loans</span></span><b>${money(x.balance)}</b></div>`).join(''):'<div class="empty">No loan data yet.</div>';
  renderBackupReminder();
}
render();
