// 공통 사이드바 + 간단 로그인/권한 + (지사장) 메뉴 커스터마이즈
(function () {
  let auth = null;
  try { auth = JSON.parse(localStorage.getItem('hwAuth') || 'null'); } catch (e) {}
  if (!auth) { location.href = 'login.html'; return; }
  const isBoss = auth.role === 'boss';
  const role = auth.role;
  const personId = auth.personId;
  const can = roles => !roles || roles.includes(role);   // roles 없으면 모두 허용
  // 특정 개인에게만 예외로 허용(역할과 무관). 메뉴 항목에 allowPersons:['hcw'] 처럼 지정.
  const personAllowed = it => !!(it.allowPersons && personId && it.allowPersons.includes(personId));
  // 항목이 보일 조건: (개인 예외 허용) 또는 (그룹·항목 역할 모두 통과)
  const itemVisible = (g, it) => personAllowed(it) || (can(g.roles) && can(it.roles));

  const ICON = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    sales:     '<line x1="6" y1="20" x2="6" y2="13"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="9"/>',
    notices:   '<path d="m3 11 16-6v14L3 13z"/><path d="M11.5 16.8a2.7 2.7 0 0 1-5.2-1.4"/>',
    materials: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.6-.8l-.8-1.1A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    commission:'<rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="8.01" y2="11"/><line x1="12" y1="11" x2="12.01" y2="11"/><line x1="16" y1="11" x2="16.01" y2="11"/><line x1="8" y1="15" x2="8.01" y2="15"/><line x1="12" y1="15" x2="12.01" y2="15"/><line x1="16" y1="15" x2="16.01" y2="15"/>',
    statement: '<path d="M8 2h8a1 1 0 0 1 1 1v18l-3-2-2 2-2-2-3 2V3a1 1 0 0 1 1-1Z"/><path d="M10 7h4M10 11h4"/>',
    lecture:   '<rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m10 9 5 3-5 3z"/>',
    team:      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    settings:  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
    link:      '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
    logout:    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    edu:       '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5"/>',
    guide:     '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3"/><line x1="12" y1="16.5" x2="12" y2="16.51"/>',
    snapshots: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><line x1="10" y1="12" x2="14" y2="12"/>',
    finance:   '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    candidates:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="m9.5 13 1.8 1.8L15 11"/>',
  };
  ICON.tax = ICON.finance;
  ICON.seminar = '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>';
  ICON.rookie_notices = ICON.notices;
  ICON.rookie_guide = ICON.guide;
  ICON.rookie_docs = ICON.materials;
  ICON.edu_common = ICON.edu;
  ICON.edu_sales = ICON.edu;
  ICON.linked = ICON.link;
  ICON.insights = '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.8 10.6c.7.6 1.3 1.5 1.5 2.4h4.6c.2-.9.8-1.8 1.5-2.4A6 6 0 0 0 12 3Z"/>';
  ICON.org = '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2.5" y="16" width="6" height="5" rx="1"/><rect x="15.5" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M5.5 16v-2h13v2"/>';
  ICON.schedule = '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="m9 15 2 2 4-4"/>';
  ICON.diag = '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>';
  ICON.meeting = '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><circle cx="9" cy="15" r="1.6"/><circle cx="15" cy="15" r="1.6"/>';   // 미팅 보드(2026-09-23)
  ICON.meeting_admin = '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.6-.8l-.8-1.1A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M12 10v6M9 13h6"/>';   // 미팅 보드(관리자)(2026-09-23)
  const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const escA = s => String(s == null ? '' : s).replace(/"/g, '&quot;').replace(/</g, '&lt;');

  const MENU = [
    { items: [
      { key: 'dashboard', label: '대시보드',   href: 'index.html' },
      { key: 'tax', label: 'ETF 절세 가이드', href: 'tax-save.html' },
      { key: 'org',       label: '조직도',     href: 'org.html' },
      { key: 'linked',    label: '연계 사이트', href: 'linked-sites.html', roles: ['fc', 'jijeom', 'boss'] },
    ]},
    { group: '지사 업무', roles: ['fc', 'jijeom', 'boss'], items: [
      { key: 'sales',     label: '영업 현황', href: 'sales.html' },
      { key: 'statement', label: '개인 명세', href: 'statement.html' },
      { key: 'notices',   label: '주요 공지', href: 'notices.html' },
      { key: 'materials', label: '자료실',    href: 'materials.html' },
    ]},
    { group: '팀 활동', roles: ['fc', 'team', 'jijeom', 'boss', 'rookie'], items: [
      { key: 'meeting',   label: '미팅 보드',  href: 'meeting-board.html' },   // 2026-09-23 신설. 룸 예약·코치 활동 기록. 사원(fc)·매니저(team)·지점장·관리자 전부. 스펙: 팀보드/_스펙.md
      { key: 'meeting_admin', label: '미팅 보드(관리자)', href: 'meeting-board-admin.html', roles: ['boss', 'jijeom', 'team'] },   // 2026-09-23 신설. 배정 고객 파일 올리기·코치별 고객 수. 관리자·지점장(한채혁)·매니저(manager)만
    ]},
    { group: '신입', roles: ['fc', 'rookie', 'jijeom', 'boss'], items: [
      { key: 'rookie_notices', label: '신입 주요 공지',     href: 'rookie-notices.html' },
      { key: 'rookie_guide',   label: '신입 위촉 가이드',   href: 'rookie-guide.html' },
      { key: 'rookie_docs',    label: '신입 위촉 자료 안내', href: 'rookie-docs.html' },
      { key: 'edu_common',     label: '지식 공통 교육',     href: 'edu-common.html' },
      { key: 'edu_sales',      label: '세일즈 신입 교육',   href: 'edu-sales.html' },
      { key: 'lecture',        label: '세일즈 심화 교육',   href: 'lecture.html' },
      { key: 'finance',        label: '재무 현황 계산기',   href: 'finance-calc.html' },
    ]},
    { group: '관리자 전용', roles: ['boss'], items: [
      { key: 'candidates', label: '후보자 현황',   href: 'candidates.html' },
      { key: 'seminar',    label: '고객 DB관리',   href: 'seminar.html', allowPersons: ['hcw', 'team'] },
      { key: 'diag',       label: '재무진단 DB',   href: 'diag.html', allowPersons: ['hcw', 'team'] },
      { key: 'insights',   label: '인사이트 메모', href: 'insights.html', allowPersons: ['team'] },
      { key: 'schedule',   label: '일정 관리',     href: 'schedule.html', allowPersons: ['hcw'] },   // 2026-09-19 신설(관리자 전용 그룹). 2026-09-23 한채혁 지점장(hcw) 공개. 더 열 땐 allowPersons 추가(schedule.html·schedule-data.js 도 같이)
      { key: 'commission', label: '수수료 계산기', href: 'commission.html' },
      { key: 'snapshots',  label: '실적 보관함',   href: 'snapshots.html', allowPersons: ['hcw'] },
      { key: 'settings',   label: '설정',         href: 'settings.html' },
    ]},
  ];

  const el = document.getElementById('sidebar');
  const active = el ? el.dataset.active : '';

  // 권한 가드: 접근 권한 없는 페이지를 열면 대시보드로 돌려보냄
  let denied = false;
  MENU.forEach(g => g.items.forEach(it => {
    if (it.key === active && !itemVisible(g, it)) denied = true;
  }));
  if (denied) { location.href = 'index.html'; return; }

  function buildMenu(cfg) {
    cfg = cfg || {};
    const mc = cfg.menu || {};
    return MENU.map(g => {
      let items = g.items
        .filter(it => itemVisible(g, it))
        .filter(it => !(mc[it.key] && mc[it.key].hidden))
        .map(it => {
          const label = (mc[it.key] && mc[it.key].label) || it.label;
          const cls = it.key === active ? ' class="active"' : '';
          return `<a href="${it.href}"${cls}>${svg(ICON[it.key] || ICON.materials)}<span>${escA(label)}</span></a>`;
        }).join('');
      if (!items) return '';
      return (g.group ? `<div class="group">${g.group}</div>` : '') + items;
    }).join('');
  }

  const roleLabel = role === 'boss' ? '관리자' : role === 'jijeom' ? '지점장' : role === 'rookie' ? '신입원' : role === 'team' ? '팀' : '지점원';

  if (el) {
    el.innerHTML = `
      <div class="side-brand">
        <span class="mark"><span class="hanwha-symbol"><img src="hanwha-logo.png" alt="한화 로고"></span> <span id="brandName">서울금융지사</span>${isBoss ? '<button class="brand-edit" id="brandEdit" title="이름 수정">✏️</button>' : ''}</span>
        <small id="brandSub">업무 포털</small>
      </div>
      <nav class="side-menu" id="sideMenu">${buildMenu()}</nav>
      <div class="side-user">
        <div class="avatar">${(auth.name || '?').charAt(0)}</div>
        <div class="who"><b>${escA(auth.name || '사용자')}</b><span>${roleLabel}</span></div>
        <button class="side-logout" title="로그아웃" aria-label="로그아웃">${svg(ICON.logout)}</button>
      </div>`;
  }

  // 서버에서 라벨/메뉴 설정 불러와 적용 (sb.js 로드 후)
  document.addEventListener('DOMContentLoaded', async () => {
    if (typeof SB === 'undefined' || typeof getLabels !== 'function') return;
    const L = await getLabels();
    const bn = document.getElementById('brandName');
    const bs = document.getElementById('brandSub');
    if (L.branchName && bn) bn.textContent = L.branchName;
    if (L.branchSub && bs) bs.textContent = L.branchSub;
    try {
      const { data } = await SB.from('app_config').select('value').eq('key', 'sidebar').maybeSingle();
      if (data && data.value) {
        const menu = document.getElementById('sideMenu');
        if (menu) menu.innerHTML = buildMenu(data.value);
      }
    } catch (e) {}
  }, {once:true});

  document.addEventListener('click', e => {
    if (e.target.closest('#brandEdit')) {
      const bn = document.getElementById('brandName');
      const bs = document.getElementById('brandSub');
      const name = prompt('지사 이름', bn ? bn.textContent : '');
      if (name == null || name.trim() === '') return;
      const sub = prompt('부제 (작은 글씨)', bs ? bs.textContent : '');
      if (bn) bn.textContent = name;
      if (sub != null && bs) bs.textContent = sub;
      if (typeof saveLabels === 'function') saveLabels(sub == null ? { branchName: name } : { branchName: name, branchSub: sub });
      return;
    }
    if (e.target.closest('.side-logout')) {
      if (typeof hwLogout === 'function') { hwLogout(); }
      else { localStorage.removeItem('hwAuth'); location.href = 'login.html'; }
      return;
    }
    if (e.target.closest('.menu-toggle')) document.body.classList.toggle('nav-open');
    else if (e.target.classList.contains('backdrop')) document.body.classList.remove('nav-open');
  });
})();
