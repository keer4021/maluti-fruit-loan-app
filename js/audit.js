// Audit Trail: read-only view of every change recorded by save() in core.js.
const pageNames=Object.fromEntries(PAGES);
function filteredAudit(){
  let from=auditFrom.value,to=auditTo.value,entity=auditEntity.value,action=auditAction.value,q=auditSearch.value.trim().toLowerCase();
  return getAudit().filter(x=>(!from||x.at.slice(0,10)>=from)&&(!to||x.at.slice(0,10)<=to)&&(!entity||x.entity===entity)&&(!action||x.action===action)&&(!q||`${x.ref} ${x.details} ${x.user}`.toLowerCase().includes(q))).reverse();
}
const auditTime=at=>new Date(at).toLocaleString('en-ZA');
function renderPage(){
  let rows=filteredAudit(),shown=rows.slice(0,1000);
  auditCount.textContent=`${rows.length} entr${rows.length===1?'y':'ies'}${rows.length>shown.length?' (showing the latest 1000, export CSV for all)':''}`;
  auditRows.innerHTML=shown.length?shown.map(x=>`<tr><td>${esc(auditTime(x.at))}</td><td>${esc(x.user)}</td><td>${esc(pageNames[x.page]||x.page)}</td><td>${esc(x.entity)}</td><td><span class="pill ${x.action==='Deleted'||x.action==='Removed'||x.action==='Reversed'?'bad':x.action==='Changed'?'warn':'good'}">${esc(x.action)}</span></td><td>${esc(x.ref)}</td><td>${esc(x.details)}</td></tr>`).join(''):'<tr><td colspan="7" class="empty">No audit entries found.</td></tr>';
}
[auditFrom,auditTo,auditEntity,auditAction].forEach(el=>el.onchange=renderPage);
auditSearch.oninput=renderPage;
auditClearFilters.onclick=()=>{auditFrom.value=auditTo.value=auditEntity.value=auditAction.value=auditSearch.value='';renderPage()};
auditExport.onclick=()=>{
  let cell=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  let lines=[['Date & Time','User','Page','Record Type','Action','Record','Details'].map(cell).join(',')].concat(filteredAudit().map(x=>[auditTime(x.at),x.user,pageNames[x.page]||x.page,x.entity,x.action,x.ref,x.details].map(cell).join(',')));
  download(`audit-trail-${localToday()}.csv`,'﻿'+lines.join('\r\n'),'text/csv');
};
render();
