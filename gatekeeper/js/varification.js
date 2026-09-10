/* ==========================================================================
   Verification / Scan page logic
   ========================================================================== */

let cxCurrentStudent = null;
const CX_DEMO_SCAN_IDS = ['12250001','12250018','12250044','12250091','12250033'];
let cxScanCursor = 0;

function cxShowPanel(which){
  document.getElementById('scan-panel').classList.toggle('hidden', which !== 'scan');
  document.getElementById('search-panel').classList.toggle('hidden', which !== 'search');
  document.getElementById('tab-scan-btn').className = which === 'scan' ? 'btn btn-primary' : 'btn btn-outline';
  document.getElementById('tab-search-btn').className = which === 'search' ? 'btn btn-primary' : 'btn btn-outline';
}

function cxRunScanSimulation(){
  const frame = document.getElementById('scanner-frame');
  const status = document.getElementById('scanner-status');
  frame.classList.add('scanning');
  status.textContent = 'Reading ID…';
  document.getElementById('scan-trigger-btn').disabled = true;

  setTimeout(() => {
    const id = CX_DEMO_SCAN_IDS[cxScanCursor % CX_DEMO_SCAN_IDS.length];
    cxScanCursor++;
    const student = CxData.getStudents().find(s => s.id === id);
    frame.classList.remove('scanning');
    status.textContent = 'Scanning ready';
    document.getElementById('scan-trigger-btn').disabled = false;
    if(student){
      cxSelectStudent(student);
      cxToast('ID scanned — ' + student.name, 'success');
    }
  }, 1100);
}

function cxRunSearch(){
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  const resultsEl = document.getElementById('search-results');
  if(!q){ resultsEl.innerHTML = ''; return; }
  const matches = CxData.getStudents().filter(s =>
    s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  ).slice(0, 6);

  if(matches.length === 0){
    resultsEl.innerHTML = `<div class="empty-state"><div class="t">No match found</div><div class="d">Check the spelling or student ID and try again.</div></div>`;
    return;
  }
  resultsEl.innerHTML = matches.map(s => `
    <div class="movement-row" style="cursor:pointer;" onclick='cxSelectStudentById("${s.id}")'>
      <div class="person-avatar">${s.initials}</div>
      <div class="movement-info">
        <div class="name">${s.name}</div>
        <div class="meta">#<span class="mono">${s.id}</span> · ${s.program}</div>
      </div>
      ${cxStatusBadge(s.status)}
    </div>
  `).join('');
}

function cxSelectStudentById(id){
  const s = CxData.getStudents().find(x => x.id === id);
  if(s) cxSelectStudent(s);
}

function cxSelectStudent(student){
  cxCurrentStudent = student;
  document.getElementById('verify-empty').classList.add('hidden');
  const resultEl = document.getElementById('verify-result');
  resultEl.classList.add('show');

  document.getElementById('res-initials').textContent = student.initials;
  document.getElementById('res-name').textContent = student.name;
  document.getElementById('res-meta').innerHTML = `#<span class="mono">${student.id}</span> · ${student.program}`;
  document.getElementById('res-room').textContent = `${student.hostel}, Room ${student.room}`;
  document.getElementById('res-contact').textContent = student.contact;
  document.getElementById('res-dest').textContent = student.destination;
  document.getElementById('res-approver').textContent = student.approvedBy;
  document.getElementById('res-exit').textContent = student.exitTime;
  document.getElementById('res-return').textContent = student.expectedReturn;

  cxRenderVerdict(student);
  cxFillIcons();
  CxData.addAudit('Student verified', `${student.name} (${student.id}) looked up at the gate.`);
}

function cxRenderVerdict(student){
  const banner = document.getElementById('verdict-banner');
  const icon = document.getElementById('verdict-icon');
  const title = document.getElementById('verdict-title');
  const sub = document.getElementById('verdict-sub');
  const checklist = document.getElementById('check-list');
  const actions = document.getElementById('verify-actions');

  const isCurrentlyOut = student.status === 'outside' || student.status === 'overdue';

  if(isCurrentlyOut){
    banner.className = 'verdict-banner ok';
    icon.innerHTML = '<span data-icon="log_in"></span>';
    title.textContent = student.status === 'overdue' ? 'Currently outside — overdue' : 'Currently outside campus';
    sub.textContent = `Expected back ${student.expectedReturn}. Record their return below.`;
    checklist.innerHTML = [
      cxCheckRow(true, 'Student identity verified'),
      cxCheckRow(true, `Exited at ${student.exitTime} to ${student.destination}`),
      cxCheckRow(student.status !== 'overdue', student.status === 'overdue' ? 'Past expected return time' : 'Within expected return window', student.status === 'overdue')
    ].join('');
    actions.innerHTML = `
      <button class="btn btn-success" onclick="cxDoReturn()"><span data-icon="check"></span>Record Return</button>
      <button class="btn btn-outline" onclick="cxClearResult()">Cancel</button>`;
    cxFillIcons(actions); cxFillIcons(icon);
    return;
  }

  const authorized = student.leave === 'approved';

  if(authorized){
    banner.className = 'verdict-banner ok';
    icon.innerHTML = '<span data-icon="check"></span>';
    title.textContent = 'EXIT AUTHORIZED';
    sub.textContent = `Approved by ${student.approvedBy}`;
    checklist.innerHTML = [
      cxCheckRow(true, 'Student identity verified'),
      cxCheckRow(true, 'Active leave found'),
      cxCheckRow(true, 'Leave approved by SSO / Warden'),
      cxCheckRow(true, `Destination recorded: ${student.destination}`)
    ].join('');
    actions.innerHTML = `
      <button class="btn btn-success" onclick="cxDoExit()"><span data-icon="check"></span>Record Exit</button>
      <button class="btn btn-outline" onclick="cxClearResult()">Cancel</button>`;
  } else {
    const reasonMap = {
      pending: 'Leave request is still pending SSO / Warden approval.',
      rejected: 'This leave request was rejected by the SSO / Warden.',
      rejected_recent: 'This leave request was rejected by the SSO / Warden.',
      expired: 'The approved leave window has expired.',
      none: 'No active approved leave found for this student.'
    };
    banner.className = 'verdict-banner no';
    icon.innerHTML = '<span data-icon="x"></span>';
    title.textContent = 'EXIT NOT AUTHORIZED';
    sub.textContent = reasonMap[student.leave] || 'No active approved leave found.';
    checklist.innerHTML = [
      cxCheckRow(true, 'Student identity verified'),
      cxCheckRow(false, reasonMap[student.leave] || 'No active approved leave found.')
    ].join('');
    actions.innerHTML = `
      <button class="btn btn-outline" onclick="alert('SSO / Warden has been notified to review this case.')">Contact SSO</button>
      <button class="btn btn-danger" onclick="cxOpenOverride()">Manual Override</button>
      <button class="btn btn-ghost" onclick="cxClearResult()">Cancel</button>`;
  }
  cxFillIcons(actions); cxFillIcons(icon);
}

function cxCheckRow(pass, text){
  return `<div class="check-item ${pass ? '' : 'fail'}"><span data-icon="${pass ? 'check' : 'x'}"></span>${text}</div>`;
}

function cxDoExit(){
  if(!cxCurrentStudent) return;
  CxData.recordExit(cxCurrentStudent.id);
  cxToast(`Exit recorded for ${cxCurrentStudent.name}`, 'success');
  cxClearResult();
}

function cxDoReturn(){
  if(!cxCurrentStudent) return;
  CxData.recordReturn(cxCurrentStudent.id);
  cxToast(`Return recorded for ${cxCurrentStudent.name}`, 'success');
  cxClearResult();
}

function cxClearResult(){
  cxCurrentStudent = null;
  document.getElementById('verify-result').classList.remove('show');
  document.getElementById('verify-empty').classList.remove('hidden');
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '';
}

function cxOpenOverride(){
  document.getElementById('override-reason').value = '';
  document.getElementById('override-confirm').checked = false;
  cxOpenModal('override-modal');
}

function cxSubmitOverride(){
  const reason = document.getElementById('override-reason').value.trim();
  const confirmed = document.getElementById('override-confirm').checked;
  if(!reason){ cxToast('Please provide a reason for the override.', 'error'); return; }
  if(!confirmed){ cxToast('Please confirm the override checkbox.', 'error'); return; }
  CxData.manualOverride(cxCurrentStudent.id, reason);
  cxToast('Manual override recorded in audit log.', 'success');
  cxCloseModal('override-modal');
  cxClearResult();
}

document.addEventListener('DOMContentLoaded', function(){
  cxShowPanel('scan');
  document.getElementById('tab-scan-btn').addEventListener('click', () => cxShowPanel('scan'));
  document.getElementById('tab-search-btn').addEventListener('click', () => cxShowPanel('search'));
  document.getElementById('scan-trigger-btn').addEventListener('click', cxRunScanSimulation);
  document.getElementById('search-trigger-btn').addEventListener('click', cxRunSearch);
  document.getElementById('search-input').addEventListener('keydown', e => { if(e.key === 'Enter') cxRunSearch(); });
  document.getElementById('override-submit-btn').addEventListener('click', cxSubmitOverride);
  cxFillIcons();
});
