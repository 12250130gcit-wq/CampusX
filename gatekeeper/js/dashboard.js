/* ==========================================================================
   Dashboard page logic
   ========================================================================== */

function cxTimeRemaining(expected){
  // Cosmetic only for the demo — a plausible countdown string.
  if(!expected || expected === '—') return '—';
  return 'due ' + expected;
}

function cxRenderDashboard(){
  const students = CxData.getStudents();
  const visitors = CxData.getVisitors();
  const logs = CxData.getLogs();

  const outside = students.filter(s => s.status === 'outside');
  const overdue = students.filter(s => s.status === 'overdue');
  const inside = students.filter(s => s.status === 'inside' || s.status === 'rejected_recent');
  const visitorsInside = visitors.filter(v => v.status === 'inside');
  const pendingLeave = students.filter(s => s.leave === 'pending');

  document.getElementById('stat-outside').textContent = outside.length + overdue.length;
  document.getElementById('stat-expected').textContent = outside.length;
  document.getElementById('stat-overdue').textContent = overdue.length;
  document.getElementById('stat-visitors').textContent = visitorsInside.length;
  document.getElementById('stat-returned').textContent = logs.filter(l => l.action === 'ENTRY' && l.type === 'Student').length;
  document.getElementById('stat-attention').textContent = overdue.length + pendingLeave.length;

  // Attention banner
  const attentionEl = document.getElementById('attention-section');
  if(overdue.length > 0){
    attentionEl.innerHTML = `
      <div class="alert-banner">
        <div class="icon" data-icon="clock_alert"></div>
        <div style="flex:1;">
          <h4>${overdue.length} student${overdue.length > 1 ? 's are' : ' is'} overdue</h4>
          <p>${overdue.map(s => `${s.name} — expected ${s.expectedReturn}`).join(' · ')}</p>
        </div>
        <a href="overdue.html" class="btn btn-danger btn-sm">View Overdue</a>
      </div>`;
  } else {
    attentionEl.innerHTML = '';
  }

  // Live movement — outside + overdue students, most recently active first
  const movement = [...outside, ...overdue].slice(0, 6);
  const movementList = document.getElementById('movement-list');
  if(movement.length === 0){
    movementList.innerHTML = `<div class="empty-state"><div class="t">No one outside campus</div><div class="d">All students are currently on campus.</div></div>`;
  } else {
    movementList.innerHTML = movement.map(s => `
      <div class="movement-row">
        <div class="person-avatar">${s.initials}</div>
        <div class="movement-info">
          <div class="name">${s.name} <span class="mono text-muted" style="font-size:11.5px;">#${s.id}</span></div>
          <div class="meta">${s.program} · To <span class="mono">${s.destination}</span></div>
        </div>
        <div class="movement-time">
          <span class="t">${s.exitTime}</span>
          exit → ${s.expectedReturn}
        </div>
        ${cxStatusBadge(s.status)}
        <div class="row-actions">
          <button class="btn btn-outline btn-sm" onclick="location.href='students.html?id=${s.id}'">View</button>
          <button class="btn btn-success btn-sm" onclick="cxDashboardReturn('${s.id}')">Return</button>
        </div>
      </div>
    `).join('');
  }

  // Recent activity feed — every request type across the whole system
  // (gate scans here, plus leave requests/decisions and admin actions
  // from the Student app and the SSO console), not just local gate logs.
  const activityList = document.getElementById('activity-list');
  const unified = CxData.getUnifiedActivity(6);
  if(unified.length){
    activityList.innerHTML = unified.map(a => `
      <div class="cx-pop-in" style="display:flex; gap:10px; align-items:flex-start;">
        <div class="mono text-sm text-muted" style="width:64px; flex:none;">${CXStore.timeAgo(a.time)}</div>
        <div style="font-size:13px;">
          <strong>${a.title}</strong>
          <div class="text-muted" style="font-size:12px;">${a.detail}</div>
        </div>
      </div>
    `).join('');
  } else {
    activityList.innerHTML = logs.slice(0, 6).map(l => `
      <div style="display:flex; gap:10px; align-items:flex-start;">
        <div class="mono text-sm text-muted" style="width:64px; flex:none;">${l.time}</div>
        <div style="font-size:13px;">
          <strong>${l.name}</strong> ${l.action === 'EXIT' ? 'exited campus' : l.action === 'ENTRY' ? 'returned to campus' : l.action === 'CHECK-IN' ? 'checked in as a visitor' : 'checked out'}
          <span class="text-muted"> · ${l.type} · ${l.gate}</span>
        </div>
      </div>
    `).join('');
  }

  // Pending leave requests submitted live from the Student app
  const pendingLeaveEl = document.getElementById('pending-leave-list');
  if(pendingLeaveEl){
    const pendingReqs = CxData.getPendingLeaveRequests();
    pendingLeaveEl.innerHTML = pendingReqs.length ? pendingReqs.slice(0,5).map(r => `
      <div class="movement-row">
        <div class="person-avatar">${cxInitials(r.studentName)}</div>
        <div class="movement-info">
          <div class="name">${r.studentName} <span class="mono text-muted" style="font-size:11.5px;">#${r.studentId}</span></div>
          <div class="meta">To <span class="mono">${r.destination}</span> · ${r.reason}</div>
        </div>
        ${cxStatusBadge('pending')}
      </div>
    `).join('') : `<div class="empty-state"><div class="t">No pending requests</div><div class="d">New student leave requests will appear here instantly.</div></div>`;
  }

  cxFillIcons();
}

function cxDashboardReturn(studentId){
  CxData.recordReturn(studentId);
  cxToast('Return recorded for student ' + studentId, 'success');
  cxRenderDashboard();
}

document.addEventListener('DOMContentLoaded', cxRenderDashboard);
