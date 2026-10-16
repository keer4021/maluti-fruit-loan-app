// Settings: local user/password, admin login, backup reminder and the
// Word (.docx) agreement template with its merge-field links.
function updateSettingsUi(){
  let s=getSettings();
  settingUsername.value=s.username||'';
  backupReminderDays.value=s.backupReminderDays||7;
  lastBackupDateDisplay.value=backupDisplay(s.lastBackupAt);
  adminStateText.textContent=isAdmin()?'Admin is logged in.':'Admin is not logged in.';
  saveState.textContent=isAdmin()?'Admin mode active':'Data is stored locally';
}
saveSettingsUser.onclick=async()=>{
  if(settingPassword.value!==settingPassword2.value){settingsUserStatus.textContent='Passwords do not match.';settingsUserStatus.className='bad pill';return}
  if(!settingUsername.value.trim()||!settingPassword.value){settingsUserStatus.textContent='Enter a username and password.';settingsUserStatus.className='bad pill';return}
  let s=getSettings();s.username=settingUsername.value.trim();s.passwordHash=await hashText(settingPassword.value);putSettings(s);
  settingPassword.value='';settingPassword2.value='';settingsUserStatus.textContent='User and password saved.';settingsUserStatus.className='good pill';updateSettingsUi();
};
adminLogin.onclick=async()=>{
  let s=getSettings();
  if(!s.passwordHash){adminLoginStatus.textContent='Set a user and password first.';adminLoginStatus.className='bad pill';return}
  let ok=loginUsername.value.trim()===s.username&&await hashText(loginPassword.value)===s.passwordHash;
  if(!ok){adminLoginStatus.textContent='Incorrect username or password.';adminLoginStatus.className='bad pill';return}
  sessionStorage.setItem(ADMIN_KEY,'1');loginPassword.value='';adminLoginStatus.textContent='Admin logged in.';adminLoginStatus.className='good pill';updateSettingsUi();
};
adminLogout.onclick=()=>{sessionStorage.removeItem(ADMIN_KEY);adminLoginStatus.textContent='Admin logged out.';adminLoginStatus.className='good pill';updateSettingsUi()};
settingsBackupNow.onclick=()=>createBackupAndMark(updateSettingsUi);
saveBackupSettings.onclick=()=>{let s=getSettings();s.backupReminderDays=Math.max(1,Number(backupReminderDays.value)||7);putSettings(s);backupSettingsStatus.textContent='Backup reminder saved.';backupSettingsStatus.className='good pill';updateSettingsUi()};

// ---------- Word agreement template ----------
const DOC_KEY='loanAgreementDocxTemplateV2601';
const BASE_FIELDS=[
  ['{{employee_number}}','Employee number'],['{{employee_name}}','Employee name'],['{{employee_id}}','Employee ID'],['{{department}}','Department'],
  ['{{loan_number}}','Loan number'],['{{application_date}}','Application date'],['{{loan_type}}','Loan type'],['{{loan_reason}}','Reason for loan'],
  ['{{loan_amount}}','Loan amount'],['{{monthly_deduction}}','Monthly deduction'],['{{first_deduction}}','First deduction'],['{{months}}','Number of instalments'],
  ['{{total_paid}}','Total paid'],['{{outstanding_balance}}','Outstanding balance'],['{{loan_status}}','Loan status'],['{{fully_paid_date}}','Fully paid date']
];
const readDoc=()=>{try{return JSON.parse(localStorage.getItem(DOC_KEY))||null}catch{return null}};
const writeDoc=d=>localStorage.setItem(DOC_KEY,JSON.stringify(d));
const fileDataUrl=file=>new Promise((resolve,reject)=>{let r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
function currentLinks(doc){return Array.isArray(doc?.manualLinks)&&doc.manualLinks.length?doc.manualLinks:BASE_FIELDS.map(([field,label])=>({field,label}))}
function fieldRow(field,label){return `<div class="docx-field-row" draggable="true" data-field="${esc(field)}"><div class="handle">☰</div><code>${esc(field)}</code><input value="${esc(label||'')}" placeholder="Manual area label"><div><button class="btn" type="button" data-move="up">↑</button> <button class="btn" type="button" data-move="down">↓</button></div></div>`}
function collectLinks(){return [...docxFieldList.querySelectorAll('.docx-field-row')].map(row=>({field:row.dataset.field,label:row.querySelector('input')?.value||''}))}
function renderFieldList(){
  docxFieldList.innerHTML=currentLinks(readDoc()).map(x=>fieldRow(x.field,x.label)).join('');
  let dragged=null;
  docxFieldList.querySelectorAll('.docx-field-row').forEach(row=>{
    row.ondragstart=()=>{dragged=row;row.classList.add('dragging')};
    row.ondragend=()=>{row.classList.remove('dragging');dragged=null};
    row.ondragover=e=>{e.preventDefault();if(!dragged||dragged===row)return;let rect=row.getBoundingClientRect();docxFieldList.insertBefore(dragged,e.clientY<rect.top+rect.height/2?row:row.nextSibling)};
    row.querySelector('[data-move="up"]').onclick=()=>row.previousElementSibling&&docxFieldList.insertBefore(row,row.previousElementSibling);
    row.querySelector('[data-move="down"]').onclick=()=>row.nextElementSibling&&docxFieldList.insertBefore(row.nextElementSibling,row);
  });
}
function updateDocStatus(){
  let doc=readDoc();
  docxTemplateStatus.textContent=doc?.name?`${doc.acceptedAt?'Submitted document':'Selected document'}: ${doc.name}`:'No doc selected';
  openDocxTemplate.disabled=!doc?.dataUrl;
}
function docStatus(text,ok){docxTemplateStatus.textContent=text;docxTemplateStatus.className=ok?'good pill':'bad pill'}

// Renders document.xml of the stored .docx as HTML, including embedded images.
function dataUrlBuffer(dataUrl){let b=String(dataUrl).split(',')[1]||'',bin=atob(b),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return bytes.buffer}
function mime(path){let p=String(path).toLowerCase();if(p.endsWith('.png'))return'image/png';if(p.endsWith('.jpg')||p.endsWith('.jpeg'))return'image/jpeg';if(p.endsWith('.gif'))return'image/gif';if(p.endsWith('.svg'))return'image/svg+xml';return'application/octet-stream'}
async function docxMedia(zip){
  let relXml=await zip.file('word/_rels/document.xml.rels')?.async('text').catch(()=>null),map={},media={};
  if(relXml){
    let xml=new DOMParser().parseFromString(relXml,'application/xml');
    [...xml.getElementsByTagName('Relationship')].forEach(r=>{map[r.getAttribute('Id')]='word/'+r.getAttribute('Target').replace(/^\/?/,'').replace(/^word\//,'')});
  }
  for(let id of Object.keys(map)){
    if(/^word\/media\//i.test(map[id])&&zip.file(map[id]))media[id]='data:'+mime(map[id])+';base64,'+await zip.file(map[id]).async('base64');
  }
  return media;
}
function runHtml(run,media){
  let text=[...run.getElementsByTagName('w:t')].map(t=>t.textContent||'').join('');
  let img=[...run.getElementsByTagName('a:blip')].map(b=>{let src=media[b.getAttribute('r:embed')||b.getAttribute('embed')];return src?`<img class="docx-image" src="${src}" alt="">`:''}).join('');
  if(!text&&!img)return '';
  let rPr=[...run.getElementsByTagName('w:rPr')][0],cls=[];
  if(rPr?.getElementsByTagName('w:b').length)cls.push('docx-bold');
  if(rPr?.getElementsByTagName('w:u').length)cls.push('docx-under');
  let size=[...rPr?.getElementsByTagName?.('w:sz')||[]][0]?.getAttribute('w:val');
  let style=size?` style="font-size:${Math.max(8,Number(size)/2)}pt"`:'';
  return `<span class="${cls.join(' ')}"${style}>${img}${esc(text).replace(/(\{\{[^}]+\}\})/g,'<span class="merge-token">$1</span>')}</span>`;
}
function paraHtml(p,media){
  let jc=[...p.getElementsByTagName('w:jc')][0]?.getAttribute('w:val')||'',cls=jc==='center'?'docx-center':jc==='right'?'docx-right':'';
  let html=[...p.childNodes].filter(n=>n.nodeType===1&&n.nodeName==='w:r').map(r=>runHtml(r,media)).join('');
  return `<p class="${cls}">${html.trim()?html:'&nbsp;'}</p>`;
}
function shade(tc){let shd=[...tc.getElementsByTagName('w:shd')][0]?.getAttribute('w:fill');return shd&&shd!=='auto'?`background:#${shd};${/^[0-6][0-9A-F]{5}$/i.test(shd)?'color:#fff;':''}`:''}
function tblHtml(tbl,media){
  return `<table>${[...tbl.getElementsByTagName('w:tr')].map(tr=>`<tr>${[...tr.getElementsByTagName('w:tc')].map(tc=>{
    let pars=[...tc.childNodes].filter(n=>n.nodeType===1&&n.nodeName==='w:p').map(p=>paraHtml(p,media).replace(/^<p[^>]*>|<\/p>$/g,'')).join('<br>');
    return `<td class="${/\{\{[^}]+\}\}/.test(tc.textContent||'')?'docx-placeholder-cell':''}" style="${shade(tc)}">${pars||'&nbsp;'}</td>`;
  }).join('')}</tr>`).join('')}</table>`;
}
async function renderDocxPreview(){
  let doc=readDoc();
  if(!doc?.dataUrl)return '<div class="actual-docx-page rich-docx"><p><b>No doc selected.</b></p></div>';
  if(!/\.docx$/i.test(doc.name||''))return '<div class="actual-docx-page rich-docx"><p><b>Use .docx for preview with logo/layout.</b></p></div>';
  let zip=await JSZip.loadAsync(dataUrlBuffer(doc.dataUrl)),media=await docxMedia(zip),xmlText=await zip.file('word/document.xml').async('text');
  let body=[...new DOMParser().parseFromString(xmlText,'application/xml').getElementsByTagName('w:body')][0];
  let html=[...body.childNodes].filter(n=>n.nodeType===1).map(n=>n.nodeName==='w:tbl'?tblHtml(n,media):n.nodeName==='w:p'?paraHtml(n,media):'').join('');
  return `<div class="actual-docx-page rich-docx">${html||'<p>No preview content found.</p>'}</div>`;
}

saveAgreementDocTemplate.onclick=async()=>{
  let file=agreementDocxFile.files[0];
  if(!file){docStatus('No doc selected',false);return}
  if(!/\.(docx|doc)$/i.test(file.name)){alert('Select only .docx or .doc.');return}
  writeDoc({name:file.name,size:file.size,savedAt:new Date().toISOString(),acceptedAt:'',dataUrl:await fileDataUrl(file),manualLinks:collectLinks()});
  agreementDocxFile.value='';
  updateDocStatus();docxTemplateStatus.className='good pill';
};
previewDocxTemplate.onclick=async()=>{
  try{actualDocxPreview.innerHTML=await renderDocxPreview();docStatus('DOCX preview loaded with logo/images.',true)}
  catch(e){actualDocxPreview.innerHTML='<div class="actual-docx-page rich-docx"><p><b>Preview failed.</b></p><p>'+esc(e.message)+'</p></div>'}
};
submitAgreementDocTemplate.onclick=()=>{
  let doc=readDoc();
  if(!doc?.dataUrl){docStatus('No doc selected',false);return}
  doc.manualLinks=collectLinks();doc.acceptedAt=new Date().toISOString();writeDoc(doc);
  docStatus('Submitted to Agreement.',true);
};
openDocxTemplate.onclick=()=>{let doc=readDoc();if(!doc?.dataUrl){alert('No doc selected');return}let a=document.createElement('a');a.href=doc.dataUrl;a.download=doc.name||'agreement-template.docx';a.click()};
clearAgreementDocxFile.onclick=()=>{agreementDocxFile.value=''};

renderFieldList();
updateDocStatus();
updateSettingsUi();
