/* ==========================================================================
   CampusX — mock data & persistence layer
   All state lives in localStorage so actions (record exit, check out a
   visitor, override, etc.) persist across pages/reloads for the demo.
   ========================================================================== */

const CX_KEYS = {
  students: 'cx_students',
  visitors: 'cx_visitors',
  logs: 'cx_logs',
  notifications: 'cx_notifications',
  audit: 'cx_audit',
  event: 'cx_event',
  seeded: 'cx_seeded_v1'
};

const CX_HOSTELS = ['Block A', 'Block B', 'Block C', 'Block D'];
const CX_PROGRAMS = ['B.Sc. ICT', 'B.Sc. CSE', 'BIT Networking', 'B.Sc. Software Engineering'];
const CX_DESTINATIONS = ['Thimphu Town', 'Gyalpozhing Town', 'Mongar Town', 'Home Village', 'Trashigang'];

function cxInitials(name){
  return name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase();
}

function cxSeedStudents(){
  const raw = [
    { name:'Karma Dorji', id:'12250001', program:'B.Sc. ICT', hostel:'Block C', room:'204', contact:'17123456', status:'outside', leave:'approved', destination:'Thimphu Town', exitTime:'5:12 PM', expectedReturn:'8:00 PM', approvedBy:'Dorji Wangchuk (Warden)' },
    { name:'Dechen Wangmo', id:'12250018', program:'B.Sc. ICT', hostel:'Block B', room:'112', contact:'17654321', status:'overdue', leave:'approved', destination:'Mongar Town', exitTime:'4:20 PM', expectedReturn:'6:00 PM', approvedBy:'Tandin Zam (SSO)' },
    { name:'Pema Dorji', id:'12250033', program:'BIT Networking', hostel:'Block A', room:'301', contact:'17998877', status:'inside', leave:'expired', destination:'Gyalpozhing Town', exitTime:'1:10 PM', expectedReturn:'4:45 PM', approvedBy:'Dorji Wangchuk (Warden)' },
    { name:'Sonam Choden', id:'12250044', program:'B.Sc. CSE', hostel:'Block D', room:'118', contact:'17445566', status:'inside', leave:'none', destination:'—', exitTime:'—', expectedReturn:'—', approvedBy:'—' },
    { name:'Sangay Penjor', id:'12250051', program:'B.Sc. Software Engineering', hostel:'Block A', room:'220', contact:'17332211', status:'outside', leave:'approved', destination:'Trashigang', exitTime:'2:05 PM', expectedReturn:'7:30 PM', approvedBy:'Tandin Zam (SSO)' },
    { name:'Kinley Penjor', id:'12250062', program:'B.Sc. ICT', hostel:'Block B', room:'205', contact:'17223344', status:'overdue', leave:'approved', destination:'Home Village', exitTime:'12:30 PM', expectedReturn:'6:15 PM', approvedBy:'Dorji Wangchuk (Warden)' },
    { name:'Tashi Wangchuk', id:'12250073', program:'BIT Networking', hostel:'Block C', room:'150', contact:'17556677', status:'inside', leave:'pending', destination:'Thimphu Town', exitTime:'—', expectedReturn:'—', approvedBy:'Awaiting approval' },
    { name:'Tshering Dorji', id:'12250084', program:'B.Sc. CSE', hostel:'Block D', room:'240', contact:'17887766', status:'outside', leave:'approved', destination:'Thimphu Town', exitTime:'5:40 PM', expectedReturn:'9:00 PM', approvedBy:'Tandin Zam (SSO)' },
    { name:'Yeshi Lhamo', id:'12250091', program:'B.Sc. ICT', hostel:'Block B', room:'101', contact:'17112233', status:'rejected_recent', leave:'rejected', destination:'Trashigang', exitTime:'—', expectedReturn:'—', approvedBy:'Dorji Wangchuk (Warden)' },
    { name:'Ugyen Rinzin', id:'12250102', program:'B.Sc. Software Engineering', hostel:'Block A', room:'115', contact:'17998811', status:'inside', leave:'none', destination:'—', exitTime:'—', expectedReturn:'—', approvedBy:'—' }
  ];
  return raw.map(s => ({ ...s, initials: cxInitials(s.name) }));
}

function cxSeedVisitors(){
  return [
    { id:'V-2026-0142', name:'Pema Dorji', relationship:'Parent', visiting:'Karma Dorji', visitingId:'12250001', contact:'17009988', cid:'11802001234', purpose:'Family visit', checkIn:'2:35 PM', expectedOut:'5:00 PM', status:'inside' },
    { id:'V-2026-0143', name:'Sonam Yangzom', relationship:'Guardian', visiting:'Sonam Choden', visitingId:'12250044', contact:'17223399', cid:'11803004455', purpose:'Drop-off documents', checkIn:'3:10 PM', expectedOut:'3:45 PM', status:'inside' },
    { id:'V-2026-0144', name:'Karma Wangchuk', relationship:'Friend', visiting:'Tashi Wangchuk', visitingId:'12250073', contact:'17667788', cid:'11804005566', purpose:'Personal visit', checkIn:'1:20 PM', expectedOut:'2:30 PM', status:'checked_out', checkOut:'2:40 PM' },
    { id:'V-2026-0145', name:'Tashi Dorji', relationship:'Vendor', visiting:'Admin Office', visitingId:'—', contact:'17334422', cid:'11805006677', purpose:'Canteen supply delivery', checkIn:'11:05 AM', expectedOut:'12:00 PM', status:'checked_out', checkOut:'11:58 AM' }
  ];
}

function cxSeedLogs(){
  return [
    { time:'7:43 PM', name:'Pema Dorji', id:'12250033', type:'Student', action:'ENTRY', gate:'Main Gate', method:'QR', admin:'Gatekeeper', status:'Recorded' },
    { time:'5:40 PM', name:'Tshering Dorji', id:'12250084', type:'Student', action:'EXIT', gate:'Main Gate', method:'QR', admin:'Gatekeeper', status:'Approved' },
    { time:'5:12 PM', name:'Karma Dorji', id:'12250001', type:'Student', action:'EXIT', gate:'Main Gate', method:'QR', admin:'Gatekeeper', status:'Approved' },
    { time:'4:45 PM', name:'Pema Dorji', id:'—', type:'Visitor', action:'CHECK-OUT', gate:'Main Gate', method:'Manual', admin:'Gatekeeper', status:'Recorded' },
    { time:'4:30 PM', name:'Sonam Yangzom', id:'V-2026-0143', type:'Visitor', action:'CHECK-IN', gate:'Main Gate', method:'Manual', admin:'Gatekeeper', status:'Recorded' },
    { time:'4:12 PM', name:'Sangay Penjor', id:'12250051', type:'Student', action:'EXIT', gate:'Main Gate', method:'ID Card', admin:'Gatekeeper', status:'Approved' },
    { time:'2:40 PM', name:'Karma Wangchuk', id:'V-2026-0144', type:'Visitor', action:'CHECK-OUT', gate:'Main Gate', method:'Manual', admin:'Gatekeeper', status:'Recorded' },
    { time:'12:30 PM', name:'Kinley Penjor', id:'12250062', type:'Student', action:'EXIT', gate:'Main Gate', method:'QR', admin:'Gatekeeper', status:'Approved' }
  ];
}

function cxSeedNotifications(){
  return [
    { category:'Security', level:'alert', title:'Student overdue', detail:'Dechen Wangmo (12250018) is overdue by 25 min against a 6:00 PM return.', time:'6:25 PM' },
    { category:'Security', level:'alert', title:'Student overdue', detail:'Kinley Penjor (12250062) is overdue by 15 min against a 6:15 PM return.', time:'6:30 PM' },
    { category:'Movement', level:'warning', title:'Leave expiring soon', detail:'Pema Dorji\u2019s approved leave window closes in 20 minutes.', time:'4:25 PM' },
    { category:'Movement', level:'success', title:'Student returned', detail:'Pema Dorji returned to campus via Main Gate.', time:'4:45 PM' },
    { category:'Visitor', level:'warning', title:'Visitor exceeding expected duration', detail:'Pema Dorji (visiting Karma Dorji) has stayed 18 min past expected checkout.', time:'5:18 PM' },
    { category:'Security', level:'alert', title:'Verification failed', detail:'QR scan failed 2 times for an unrecognised ID at Main Gate.', time:'3:02 PM' },
    { category:'System', level:'info', title:'Shift handover', detail:'Gate log handed over to incoming gatekeeper shift.', time:'2:00 PM' }
  ];
}

function cxLoad(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    return JSON.parse(raw);
  }catch(e){ return fallback; }
}
function cxSave(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function cxEnsureSeed(){
  if(localStorage.getItem(CX_KEYS.seeded)) return;
  cxSave(CX_KEYS.students, cxSeedStudents());
  cxSave(CX_KEYS.visitors, cxSeedVisitors());
  cxSave(CX_KEYS.logs, cxSeedLogs());
  cxSave(CX_KEYS.notifications, cxSeedNotifications());
  cxSave(CX_KEYS.audit, []);
  cxSave(CX_KEYS.event, { active:false, name:'GCIT Tech Fest 2026', startDate:'', endDate:'', startTime:'08:00', endTime:'18:00', allow:{students:true,staff:true,visitors:true} });
  localStorage.setItem(CX_KEYS.seeded, '1');
}
cxEnsureSeed();

const CxData = {
  getStudents(){ return cxLoad(CX_KEYS.students, []); },
  saveStudents(list){ cxSave(CX_KEYS.students, list); },
  getVisitors(){ return cxLoad(CX_KEYS.visitors, []); },
  saveVisitors(list){ cxSave(CX_KEYS.visitors, list); },
  getLogs(){ return cxLoad(CX_KEYS.logs, []); },
  saveLogs(list){ cxSave(CX_KEYS.logs, list); },
  getNotifications(){ return cxLoad(CX_KEYS.notifications, []); },
  saveNotifications(list){ cxSave(CX_KEYS.notifications, list); },
  getAudit(){ return cxLoad(CX_KEYS.audit, []); },
  // Event Mode is a single shared setting — the same switch the SSO
  // console flips lives here too, via the cross-portal CXStore.
  getEvent(){ return (typeof CXStore !== 'undefined') ? CXStore.getEventMode() : cxLoad(CX_KEYS.event, {}); },
  saveEvent(ev){ if(typeof CXStore !== 'undefined') CXStore.setEventMode(ev); else cxSave(CX_KEYS.event, ev); },
  // Every gate-side request/action a gatekeeper takes also lands in the
  // system-wide activity feed so SSO Admin sees it too, not just leave.
  getUnifiedActivity(limit){ return (typeof CXStore !== 'undefined') ? CXStore.getActivity(limit) : []; },
  getPendingLeaveRequests(){ return (typeof CXStore !== 'undefined') ? CXStore.getAllLeaves().filter(l=>l.status==='pending') : []; },

  findStudent(query){
    const q = (query || '').trim().toLowerCase();
    if(!q) return null;
    return this.getStudents().find(s =>
      s.id.toLowerCase() === q || s.name.toLowerCase() === q || s.name.toLowerCase().includes(q)
    ) || null;
  },

  addLog(entry){
    const logs = this.getLogs();
    logs.unshift(entry);
    this.saveLogs(logs);
  },

  addAudit(action, detail){
    const audit = this.getAudit();
    const now = new Date();
    audit.unshift({
      action, detail,
      time: now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
      date: now.toLocaleDateString(),
      admin: 'Gatekeeper (Sonam T.)'
    });
    cxSave(CX_KEYS.audit, audit);
    // Mirror every gate action into the shared cross-portal feed so it
    // shows up on the SSO Admin side as well — not just here.
    if(typeof CXStore !== 'undefined'){
      CXStore.addActivity({ type:'gate', title:action, detail, actor:'Gatekeeper' });
    }
  },

  recordExit(studentId){
    const students = this.getStudents();
    const s = students.find(x => x.id === studentId);
    if(!s) return false;
    const now = new Date();
    const t = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    s.status = 'outside';
    s.exitTime = t;
    this.saveStudents(students);
    this.addLog({ time:t, name:s.name, id:s.id, type:'Student', action:'EXIT', gate:'Main Gate', method:'QR', admin:'Gatekeeper', status:'Approved' });
    this.addAudit('Exit recorded', `${s.name} (${s.id}) exited via Main Gate.`);
    return true;
  },

  recordReturn(studentId){
    const students = this.getStudents();
    const s = students.find(x => x.id === studentId);
    if(!s) return false;
    const now = new Date();
    const t = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    s.status = 'inside';
    this.saveStudents(students);
    this.addLog({ time:t, name:s.name, id:s.id, type:'Student', action:'ENTRY', gate:'Main Gate', method:'QR', admin:'Gatekeeper', status:'Recorded' });
    this.addAudit('Entry recorded', `${s.name} (${s.id}) returned via Main Gate.`);
    return true;
  },

  manualOverride(studentId, reason){
    const students = this.getStudents();
    const s = students.find(x => x.id === studentId);
    if(!s) return false;
    s.status = 'outside';
    this.saveStudents(students);
    this.addAudit('Manual override', `${s.name} (${s.id}) — exit permitted without standing approval. Reason: ${reason}`);
    return true;
  },

  checkOutVisitor(visitorId){
    const visitors = this.getVisitors();
    const v = visitors.find(x => x.id === visitorId);
    if(!v) return false;
    const now = new Date();
    const t = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    v.status = 'checked_out';
    v.checkOut = t;
    this.saveVisitors(visitors);
    this.addLog({ time:t, name:v.name, id:v.id, type:'Visitor', action:'CHECK-OUT', gate:'Main Gate', method:'Manual', admin:'Gatekeeper', status:'Recorded' });
    this.addAudit('Visitor checked out', `${v.name} (${v.id}) checked out.`);
    return true;
  },

  registerVisitor(data){
    const visitors = this.getVisitors();
    const now = new Date();
    const t = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    const id = 'V-2026-' + String(1000 + visitors.length + 1).slice(-4);
    const record = { ...data, id, checkIn:t, status:'inside' };
    visitors.unshift(record);
    this.saveVisitors(visitors);
    this.addLog({ time:t, name:data.name, id, type:'Visitor', action:'CHECK-IN', gate:'Main Gate', method:'Manual', admin:'Gatekeeper', status:'Recorded' });
    this.addAudit('Visitor registered', `${data.name} registered to visit ${data.visiting}.`);
    return record;
  },

  addManualRecord(data){
    const now = new Date();
    const t = data.time || now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    this.addLog({ time:t, name:data.name, id:data.studentId, type:'Student', action:data.type, gate:'Main Gate', method:data.method || 'Manual', admin:'Gatekeeper', status:'Manual' });
    this.addAudit('Manual record added', `${data.type} recorded manually for ${data.name} (${data.studentId}). Reason: ${data.reason}`);
  }
};
