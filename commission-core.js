// ===== 수수료 계산 공통 모듈 (팀원·상품 모두 수정 가능, 여러 페이지 공유) =====
const HW = (function () {
  const LS = 'hwCommission_v3';

  const TABLE_OPTS = { boss: [95,93,90,88], jijeom: [88,85,83,80], fc: [80,75,70,65,60] };
  const ROLE_LABEL = { boss: '지점장', jijeom: '지점장', fc: '지점원' };

  // 2026-07 한금서 변경 반영 — 기준 문서: hanwha-portal-자료/손보수수료체계_2026-07.md
  // 손보 인보험(건강): 수수료율 전사 동일(익월720/후속285.6=168+117.6, 회사100% 기준).
  // 시책 2차년도(si13·co13) = 주차시상+주력상품(일반)만 (특별·브릿지·기타시상 제외). MG·농협 안 씀.
  function defaultProducts() {
    return [
      { id:'inHanwha',   name:'한화손보 인보험(건강)',   ik:720, hu:285.6, siIk:100, si13:600, coIk:200, co13:440 },
      { id:'inMeritz',   name:'메리츠화재 인보험(건강)', ik:720, hu:285.6, siIk:100, si13:700, coIk:200, co13:300 },
      { id:'inHyundai',  name:'현대해상 인보험(건강)',   ik:720, hu:285.6, siIk:100, si13:500, coIk:200, co13:400 },
      { id:'inKB',       name:'KB손보 인보험(건강)',     ik:720, hu:285.6, siIk:120, si13:700, coIk:200, co13:400 },
      { id:'inSamsung',  name:'삼성화재 인보험(건강)',   ik:720, hu:285.6, siIk:100, si13:700, coIk:200, co13:400 },
      { id:'inDB',       name:'DB손보 인보험(건강)',     ik:720, hu:285.6, siIk:150, si13:700, coIk:200, co13:350 },
      { id:'inHeungkuk', name:'흥국화재 인보험(건강)',   ik:720, hu:285.6, siIk:100, si13:700, coIk:200, co13:400 },
      { id:'inLotte',    name:'롯데손보 인보험(건강)',   ik:720, hu:285.6, siIk:100, si13:400, coIk:200, co13:450 },
      { id:'inHana',     name:'하나손보 인보험(건강)',   ik:720, hu:285.6, siIk:100, si13:800, coIk:200, co13:400 },
      // 운전자: 수수료율은 2026-07 수수료표 원문, 시책은 해당 회사와 동일. 후속 = 13~14회+15회 합산.
      { id:'drvMeritz',  name:'메리츠 운전자', ik:660, hu:261.8, siIk:100, si13:700, coIk:200, co13:300 },
      { id:'drvKB',      name:'KB 운전자',     ik:690, hu:273.7, siIk:120, si13:700, coIk:200, co13:400 },
      { id:'drvDB',      name:'DB 운전자',     ik:465, hu:184.5, siIk:150, si13:700, coIk:200, co13:350 },
      { id:'drvLotte',   name:'롯데 운전자',   ik:675, hu:267.8, siIk:100, si13:400, coIk:200, co13:450 },
      { id:'drvHana',    name:'하나 운전자',   ik:660, hu:261.8, siIk:100, si13:800, coIk:200, co13:400 },
      // 손보 외 — 이번 개편과 무관, 기존 값 유지
      // IBK 익월 460 — 2026-09-23 대표님 지시. 근거: 오렌지터치 수수료명세(202609, (생보)FP수수료) 75테이블 50만→1,725,000 = 345% = 460%×75%. (전엔 470)
      { id:'ibk',    name:'IBK 변액연금',        ik:460,   hu:180,   siIk:35,  si13:0,   coIk:15,  co13:0   },
      { id:'mirae',  name:'미래에셋 M-케어',     ik:750.6, hu:250.2, siIk:150, si13:200, coIk:200, co13:200 },
      { id:'linaT5', name:'라이나생명치아5년납',  ik:420,   hu:201.6, siIk:200, si13:0,   coIk:200, co13:150 },
      { id:'linaT10',name:'라이나생명치아10년납', ik:735,   hu:325.8, siIk:200, si13:0,   coIk:200, co13:150 },
      // 카디프생명 연금(적립형 10년납) — 2026-09-16 추가.
      // 수수료: 제휴사 수수료표 「시그니처ETF변액연금(적립형)_10년납」 회사100% 익월 424.8 / 2차년도 117.6 / 3차년도 117.6 → 후속 235.2
      //   검산: 424.8×0.88=373.8(사업부), ×0.65=276.1(FP) / 117.6×0.65=76.4 — 표 기재치와 일치
      // 시책: 2026년 7월 생명보험 시책 요약표 「시그니처 ETF변액연금/저축보험(적립형), 시그니처AI변액연금(적립형)」
      //   FP 익월 60 / FP 2차년도 '–'=0 / 법인 익월 10 / 법인 2차년도 '–'=0
      { id:'cardifPen', name:'카디프생명 연금(적립형 10년납)', ik:424.8, hu:235.2, siIk:60, si13:0, coIk:10, co13:0 },
      // 카디프생명 연금(일시납) — 2026-09-16 대표님 지시: 납입금액을 월초로 환산해 넣는다.
      //   환산 규칙: 월초 = 납입금액(만원) × 76 ÷ 10,000   (일시납 1억 = 월초 76만원)
      //   요율은 그 월초에 곱했을 때 실제 일시납 수수료가 나오도록 역산한 값이다.
      //   실제 일시납 회사100%: 익월 1.5% / 2차년도 0.8% / 3차년도 0.2%(후속 1.0%) / 시책 1억↑ 1.5% · 2천만↑ 1.0%
      //   역산: 1억 × 1.5% = 150만원 → 150 ÷ 76 × 100 = 197.37%   (1.0% → 131.58%)
      //   검산: 월초 76 × 197.37% = 150.0만원 ✔  월초 76 × 131.58% = 100.0만원 ✔
      //   비례하므로 5천만원(월초 38)·3천만원(월초 22.8)도 그대로 맞는다.
      { id:'cardifLump20', name:'카디프생명 연금(일시납 2천만~1억미만)', ik:197.37, hu:131.58, siIk:131.58, si13:0, coIk:0, co13:0 },
      { id:'cardifLump1e', name:'카디프생명 연금(일시납 1억↑)',          ik:197.37, hu:131.58, siIk:197.37, si13:0, coIk:0, co13:0 },
      // 메트라이프 달러 상품 — 2026-10-16 대표님 지시. 근거: hanwha-portal-자료/메트라이프_달러_수수료_환산_2026-10-16.md
      //   일시납(오늘의 달러연금 1형·2형, 수수료 동일): 월초 = 원화 납입금액(만원) × 76 ÷ 10,000 (카디프와 같은 환산), 환율 1,350원 고정(대표님).
      //   구간은 달러 금액 기준. 요율 = 회사100%(2.6/3.3/3.7/4.0%) ÷ 0.0076 역산, 소수 2자리(대표님 "2자리까지"). 2·3차년도 0, 시책 없음(FP·법인).
      //   검산: $50,000 × 1,350 = 6,750만 → 월초 51.3 × 486.84% = 249.7489만 (실제 3.7% = 249.75만)
      { id:'metLumpU25',  name:'메트라이프 달러연금(일시납 2.5만달러 미만)', ik:342.11, hu:0, siIk:0, si13:0, coIk:0, co13:0, sched:'once13' },
      { id:'metLump25',   name:'메트라이프 달러연금(일시납 2.5만달러 이상)', ik:434.21, hu:0, siIk:0, si13:0, coIk:0, co13:0, sched:'once13' },
      { id:'metLump50',   name:'메트라이프 달러연금(일시납 5만달러 이상)',   ik:486.84, hu:0, siIk:0, si13:0, coIk:0, co13:0, sched:'once13' },
      { id:'metLump100',  name:'메트라이프 달러연금(일시납 10만달러 이상)',  ik:526.32, hu:0, siIk:0, si13:0, coIk:0, co13:0, sched:'once13' },
      //   적립식(오로지 연금을 위한 달러연금보험 보증형): 월초 = 월보험료(달러) × 1,350 ÷ 10,000. TYPE표(202605) 회사100% 익월 / 후속 = 2차+3차.
      //   시책 2026년 10월 기준 FP 익월 260 · 법인 익월 40 (대표님), 2차년도 0.
      //   7년납(3칸)·10년납(4칸)은 2026-10-16 대표님 지시로 뺌("일단 없애놔, 저장은 해놔 나중에 추가하게") — 값은 hanwha-portal-자료/메트라이프_달러_상품13개_2026-10-16.json 에 보관.
      { id:'metDlr5y200',  name:'메트라이프 오로지달러연금 5년납 200달러이상',  ik:205.32, hu:0,      siIk:260, si13:0, coIk:40, co13:0 },
      { id:'metDlr5y250',  name:'메트라이프 오로지달러연금 5년납 250달러이상',  ik:274.92, hu:0,      siIk:260, si13:0, coIk:40, co13:0 },
    ];
  }
  function defaultPeople() { return window.SEOUL_PEOPLE.map(p => ({...p})); }
  const state = { products: null, people: null, wolcho: null, share: 75, corpAdj: {}, contracts: [], bossShareTable: 75 };

  function initDefault() {
    state.products = defaultProducts();
    state.people = defaultPeople();
    state.wolcho = {};
    state.people.forEach(p => { state.wolcho[p.id] = {}; state.products.forEach(pr => state.wolcho[p.id][pr.id] = 0); });
    state.share = 75;
    state.corpAdj = {};
    state.contracts = [];
    state.bossShareTable = 75;
  }
  // 서버(Supabase)에서 공통 데이터 불러오기 — 모두가 같은 값을 봄
  async function load() {
    initDefault();
    try {
      if (typeof SB !== 'undefined') {
        const { data } = await SB.from('app_config').select('value').eq('key', 'commission').maybeSingle();
        const s = data && data.value;
        if (s && Array.isArray(s.products) && s.products.length && Array.isArray(s.people) && s.people.length) {
          state.products = s.products;
          state.people = s.people;
          if (s.wolcho) state.wolcho = s.wolcho;
          if (typeof s.share === 'number') state.share = s.share;
          state.corpAdj = (s.corpAdj && typeof s.corpAdj === 'object') ? s.corpAdj : {};
          state.contracts = Array.isArray(s.contracts) ? s.contracts : [];
          if (typeof s.bossShareTable === 'number') state.bossShareTable = s.bossShareTable;
        }
      }
    } catch (e) {}
  }
  // 이번 달 키 (YYYY-MM, 사용자 로컬시간=KST 기준)
  function monthKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  // 서버에 저장 (지사장이 수정하면 전원에게 반영) + 현재 달 성적표 자동 보존
  async function save() {
    try {
      if (typeof SB !== 'undefined') {
        const payload = { products: state.products, people: state.people, wolcho: state.wolcho, share: state.share, corpAdj: state.corpAdj || {}, contracts: state.contracts || [], bossShareTable: state.bossShareTable };
        await SB.from('app_config').upsert({ key: 'commission', value: payload, updated_at: new Date().toISOString() });
        // 버튼 없이 자동 저장: 현재 달로만 덮어쓰므로 지난 달 성적표는 그대로 보존됨.
        // 단, 보관함에서 직접 수정해 '잠금(edited)'된 달은 건드리지 않음.
        const m = monthKey();
        let locked = false;
        try {
          const { data } = await SB.from('app_config').select('value').eq('key', 'snap_' + m).maybeSingle();
          if (data && data.value && data.value.edited) locked = true;
        } catch (e) {}
        if (!locked) {
          await SB.from('app_config').upsert({
            key: 'snap_' + m,
            value: Object.assign({ month: m, savedAt: new Date().toISOString() }, payload),
            updated_at: new Date().toISOString(),
          });
        }
      }
    } catch (e) {}
  }

  // 법인시책 제외 대상인지 판단 (noCorp 저장값 우선, 없으면 이름 '김태연' 기본 제외)
  function isNoCorp(p) {
    return p.noCorp === undefined ? p.name === '김태연' : !!p.noCorp;
  }

  // ===== 계약 건별 입력 모드 (2026-10-01) =====
  // 계약 한 건 = { id, ho, emp(계약진행사원 id), prod(상품 id), w(월초 만원), tag(속성 메모), share:[{to(받는 사람 id), pct(세후의 %)}] }
  // 건이 하나라도 있으면 월초 입력표 대신 건별 입력에서 사람×상품 월초(= 계약진행사원 코드에 전액, 전산 방식)를 만들어 계산한다.
  const contractsMode = () => Array.isArray(state.contracts) && state.contracts.length > 0;
  function deriveWolcho() {
    const w = {};
    state.people.forEach(p => { w[p.id] = {}; });
    (state.contracts || []).forEach(c => {
      if (!w[c.emp]) w[c.emp] = {};
      w[c.emp][c.prod] = Math.round(((w[c.emp][c.prod] || 0) + (+c.w || 0)) * 10000) / 10000;
    });
    return w;
  }

  // 쉐어를 월초로 환산해 쪼갠 표시용 월초: 계약진행사원 (100−Σ%)% · 쉐어 상대 각자 %  (예: 50 → 박효은 25 · 김영찬 25)
  // ※ 수수료 계산(오버라이딩·법인시책 등)은 deriveWolcho()의 계약진행사원 전액 기준을 그대로 쓴다. 이 값은 화면(월초 성적)용.
  function contractAlloc(c) {
    const w = +c.w || 0, out = [];
    let used = 0;
    (c.share || []).forEach(s => { const pc = Math.max(0, +s.pct || 0); if (s.to && pc > 0) { const a = Math.round(w * pc / 100 * 10000) / 10000; out.push({ to: s.to, w: a }); used += pc; } });
    const rest = Math.max(0, Math.round(w * (100 - Math.min(100, used)) / 100 * 10000) / 10000);
    return [{ to: c.emp, w: rest }].concat(out);
  }
  function deriveWolchoShared() {
    const w = {};
    state.people.forEach(p => { w[p.id] = {}; });
    (state.contracts || []).forEach(c => contractAlloc(c).forEach(a => { if (!w[a.to]) w[a.to] = {}; w[a.to][c.prod] = Math.round(((w[a.to][c.prod] || 0) + a.w) * 10000) / 10000; }));
    return w;
  }

  function compute() {
    const cm = contractsMode();
    const { products, people, share } = state;
    const wolcho = cm ? deriveWolcho() : state.wolcho;
    const sumW = {};
    products.forEach(p => sumW[p.id] = people.reduce((s,per) => s + (wolcho[per.id]?.[p.id] || 0), 0));

    const wShared = cm ? deriveWolchoShared() : null;
    const ppl = people.map(per => ({ ...per, idx: per.id,
      w: products.reduce((o,pr) => { o[pr.id] = wolcho[per.id]?.[pr.id] || 0; return o; }, {}) }));

    ppl.forEach(p => {
      p.hwan = products.reduce((s,pr) => s + p.w[pr.id], 0);
      if (cm) { p.hwanFull = p.hwan; p.hwan = products.reduce((s, pr) => s + ((wShared[p.id] || {})[pr.id] || 0), 0); }
      p.ikSoo = p.huSoo = p.siIk = p.si13 = 0;
      if (p.sales) products.forEach(pr => {
        const w = p.w[pr.id];
        p.ikSoo += w * (pr.ik/100) * (p.table/100);
        p.huSoo += w * (pr.hu/100) * (p.table/100);
        p.siIk  += w * (pr.siIk/100);
        p.si13  += w * (pr.si13/100);
      });
      if (cm && p.sales) {   // 건별 입력 모드: 본인 익월 수수료·시책을 계약마다 원 미만 절사해서 다시 더함(회사 전산 방식, 2026-10-23)
        p.ikSoo = 0; p.siIk = 0;
        (state.contracts || []).forEach(c => {
          if (c.emp !== p.id) return; const pr = products.find(x => x.id === c.prod); if (!pr) return;
          const w = (+c.w || 0) * 10000;
          p.ikSoo += Math.floor(w * pr.ik / 100 * p.table / 100 + 1e-6) / 10000; p.siIk += Math.floor(w * pr.siIk / 100 + 1e-6) / 10000;
        });
      }
      p.sichaek = p.siIk + p.si13;
      p.own = p.ikSoo + p.huSoo + p.sichaek;
      p.ownIk = p.ikSoo + p.siIk;
      p.ownLater = p.huSoo + p.si13;
    });

    const boss = ppl.find(p => p.role === 'boss');
    const jijeom = ppl.find(p => p.role === 'jijeom');
    const bossTable = boss ? boss.table : 88;
    const chamiTable = jijeom ? jijeom.table : bossTable;

    // 오버라이딩 — 계약한 사람의 위로만 단계별 %p 차액이 떨어진다 (2026-10-01 대표님 확정)
    //   FP → 파트장(p.part·p.leader) → 팀장(jijeom) → 지점장(boss).  단계 %p = 윗사람 테이블 − 바로 아래까지의 최대 테이블.
    //   예) 신희찬 65 → 김동휘(파트장 75) 10%p · 한채혁(80) 5%p · 김병인(88) 8%p. 파트장 본인 계약에도 팀장·지점장 몫이 붙는다.
    //   파트 없는 사원은 한채혁 직할(팀장 몫 = 80 − 본인 테이블).
    ppl.forEach(p => { p.ovIk = 0; p.ovHu = 0; });
    const leaders = {};
    ppl.forEach(p => { if (p.leader && p.part) leaders[p.part] = p; });
    ppl.forEach(p => {
      if (!p.sales || p.role === 'boss') return;
      const chain = [];
      const L = p.part ? leaders[p.part] : null;
      // 쉐어 코드(인플루언서): 월초가 반반으로 넘어온 칸이라 실제 계약한 사원의 라인을 알 수 없음 → 파트장 몫은 빼고 팀장·지점장 몫만 계산
      const inflSkip = p.infl && !cm;   // 쉐어코드 근사는 월초 입력표 방식에서만(건별 입력 모드는 계약진행사원 라인으로 정확히 계산)
      if (L && L.id !== p.id && !inflSkip) chain.push(L);
      if (jijeom && jijeom.id !== p.id) chain.push(jijeom);
      if (boss) chain.push(boss);
      products.forEach(pr => {
        const ikBase = p.w[pr.id] * (pr.ik / 100);
        const huBase = p.w[pr.id] * (pr.hu / 100);
        let prev = p.table;
        if (p.infl && !cm && L) prev = Math.max(prev, L.table);   // 쉐어 코드: 파트장 몫은 빼고(누구 계약인지 모름) 파트장 테이블 이후 단계만(팀장 5%·지점장 8%)
        chain.forEach(u => {
          const pct = Math.max(0, u.table - prev) / 100;
          u.ovIk += ikBase * pct; u.ovHu += huBase * pct;
          prev = Math.max(prev, u.table);
        });
      });
    });
    // 건별 입력 모드: 익월 오버라이딩을 회사 전산처럼 계약마다 원 미만 절사해서 다시 더한다(2026-10-23 대표님 "1원 한장도 안틀리게" — 오렌지 10월 명세로 검증).
    //   위에서 상품별로 합친 값은 소수점이 쌓여 1~4원 차이가 났다. 후속(ovHu)은 그대로 둔다.
    if (cm) {
      const byId0 = {}; ppl.forEach(p => { byId0[p.id] = p; p.ovIk = 0; });
      (state.contracts || []).forEach(c => {
        const e = byId0[c.emp], pr = products.find(x => x.id === c.prod);
        if (!e || !pr || !e.sales || e.role === 'boss') return;
        const w = (+c.w || 0) * 10000, L = e.part ? leaders[e.part] : null, chain = [];
        if (L && L.id !== e.id) chain.push(L); if (jijeom && jijeom.id !== e.id) chain.push(jijeom); if (boss) chain.push(boss);
        let prev = e.table;
        chain.forEach(u => { const pct = Math.max(0, u.table - prev) / 100; u.ovIk += Math.floor(w * pr.ik / 100 * pct + 1e-6) / 10000; prev = Math.max(prev, u.table); });
      });
    }
    const chamiOvIk = jijeom ? jijeom.ovIk : 0, chamiOvHu = jijeom ? jijeom.ovHu : 0;
    const bossOvIk = boss ? boss.ovIk : 0, bossOvHu = boss ? boss.ovHu : 0;
    const chamiOv = chamiOvIk + chamiOvHu;
    const bossOv = bossOvIk + bossOvHu;

    // 법인시책: 김태연 파트 몫은 지사장에게 들어오지 않음 → 계산에서 제외하고 별도 집계.
    // 체크박스(noCorp)가 저장돼 있으면 그 값을 따르고, 없으면 이름이 '김태연'인 사람만 제외.
    ppl.forEach(p => { p.corpEx = isNoCorp(p); });
    let corpIk = 0, corp13 = 0, corpExIk = 0, corpEx13 = 0;
    const adj = cm ? {} : (state.corpAdj || {});
    products.forEach(pr => {
      let wIn = 0, wEx = 0;
      ppl.forEach(p => { if (p.corpEx) wEx += p.w[pr.id]; else wIn += p.w[pr.id]; });
      // 제외 보정: 제외 대상(김태연)이 진행했지만 다른 코드(쉐어 상대)로 월초가 넘어가 있는 몫 — 법인시책에서도 빼서 제외 쪽으로 옮김
      const ad = Math.min(Math.max(0, adj[pr.id] || 0), wIn);
      wIn -= ad; wEx += ad;
      corpIk   += wIn * (pr.coIk/100) * (share/100);
      corp13   += wIn * (pr.co13/100) * (share/100);
      corpExIk += wEx * (pr.coIk/100) * (share/100);
      corpEx13 += wEx * (pr.co13/100) * (share/100);
    });
    // 건별 입력 모드: 익월 법인시책(지점장시책)도 계약마다 원 미만 절사(2026-10-23, 오렌지 명세 기준)
    if (cm) {
      const byId1 = {}; ppl.forEach(p => { byId1[p.id] = p; });
      corpIk = 0; corpExIk = 0;
      (state.contracts || []).forEach(c => {
        const e = byId1[c.emp], pr = products.find(x => x.id === c.prod);
        if (!e || !pr) return;
        const a = Math.floor((+c.w || 0) * 10000 * pr.coIk / 100 * share / 100 + 1e-6) / 10000;
        if (e.corpEx) corpExIk += a; else corpIk += a;
      });
    }
    const corpTotal = corpIk + corp13;
    const corpExTotal = corpExIk + corpEx13;
    const corpExNames = ppl.filter(p => p.corpEx).map(p => p.name);

    if (jijeom) { jijeom.ov = chamiOv; }
    ppl.forEach(p => { p.ov = p.ovIk + p.ovHu; });
    if (boss) {
      boss.ov = bossOv;
      boss.corp = corpTotal;
      boss.ikRecv = boss.ikSoo + boss.siIk + bossOvIk + corpIk;
      boss.laterRecv = boss.huSoo + boss.si13 + bossOvHu + corp13;
    }
    const bossTotal = boss ? boss.own + bossOv + corpTotal : 0;

    // 건별 입력 모드: 세금 3.3% · 쉐어(세후 기준) · 실수령까지 계산 — 보고서 맨 끝 「다음 달 실제 수령」과 같은 방식
    //   본인 계약 수령 = 각자 테이블(지점장 88) / 쉐어로 나누는 금액 = 계약진행사원 테이블 기준(지점장은 bossShareTable=75) 세후의 지정 %
    let contractRows = [];
    if (cm) {
      const TAX = 3.3, SHT = state.bossShareTable || 75;
      const byId = {}; ppl.forEach(p => { byId[p.id] = p; p.shareOut = 0; p.shareIn = 0; p.sharePreOut = 0; p.sharePreIn = 0; p.sharePreOutL = 0; p.sharePreInL = 0; });
      (state.contracts || []).forEach(c => {
        const e = byId[c.emp], pr = products.find(x => x.id === c.prod);
        if (!e || !pr) { contractRows.push({ id: c.id, ok: false }); return; }
        const t = e.role === 'boss' ? SHT : e.table;
        const w = (+c.w || 0) * 10000;
        const fee = Math.floor(w * pr.ik / 100 * t / 100 + 1e-6), si = Math.floor(w * pr.siIk / 100 + 1e-6);   // 원 미만 절사(회사 전산, 2026-10-23)
        const pre = fee + si, tax = Math.round(pre * TAX / 100), net = pre - tax;
        let out = 0, preOut = 0; const lines = [], preLines = [];
        (c.share || []).forEach(s => {
          const r = byId[s.to]; const pc = +s.pct;
          if (!r || !(pc > 0)) return;
          const a = Math.floor(net * pc / 100); out += a; r.shareIn += a; lines.push({ to: s.to, name: r.name, amt: a });
          // 세전 기준 쉐어(영업수수료·건별 표 표시용, 전산 표기와 맞춤) — 익월분·후속분. 실제 송금은 세후 기준(out·lines)
          const ap = Math.floor(pre * pc / 100); e.sharePreOut += ap; r.sharePreIn += ap; preOut += ap; preLines.push({ to: s.to, name: r.name, amt: ap });
          const preLs = Math.round(w * pr.hu / 100 * t / 100) + Math.round(w * pr.si13 / 100), apL = Math.floor(preLs * pc / 100); e.sharePreOutL += apL; r.sharePreInL += apL;
        });
        e.shareOut += out;
        // 앞으로 들어올 후속(수수료 후속 + 시책 2차년도) — 같은 기준(계약진행사원 테이블, 세금 3.3%)
        const preL = Math.round(w * pr.hu / 100 * t / 100) + Math.round(w * pr.si13 / 100), taxL = Math.round(preL * TAX / 100), netL = preL - taxL;
        contractRows.push({ id: c.id, ok: true, table: t, fee, si, pre, tax, net, out, own: net - out, lines, preOut, preLines, later: netL, total: net + netL });
      });
      ppl.forEach(p => {
        const ov = (p.ovIk || 0) * 10000, own = (p.ikSoo + p.siIk) * 10000;
        const corp = p.role === 'boss' ? corpIk * 10000 : 0;
        const pre = own + ov + corp, tax = Math.round(pre * TAX / 100), net = pre - tax;
        p.settle = { own: own / 10000, ov: ov / 10000, corp: corp / 10000, pre: pre / 10000, tax: tax / 10000, net: net / 10000,
          out: p.shareOut / 10000, inn: p.shareIn / 10000, real: (net - p.shareOut + p.shareIn) / 10000 };
        // 영업수수료(세전, 쉐어 반영) — 대시보드·영업현황·보관함의 순위·「익월수수료」 칸에 쓰는 값. 오버라이딩·법인시책 제외.
        p.ownIkRaw = p.ownIk; p.ownRaw = p.own;
        p.ownIk = (own - p.sharePreOut + p.sharePreIn) / 10000;
        p.own = p.ownIk + ((p.huSoo + p.si13) * 10000 - p.sharePreOutL + p.sharePreInL) / 10000;
      });
    }

    const sellers = ppl.filter(p => p.sales);
    const sumWtotal = sellers.reduce((s,p) => s + p.hwan, 0);
    const commissionTotal = sellers.reduce((s,p) => s + p.own, 0);
    const activeCount = sellers.filter(p => p.hwan > 0).length;
    const salesCount = sellers.length;

    return { products, people, ppl, sumW, sumWtotal, commissionTotal, activeCount, salesCount,
      boss, bossTable, jijeom, chamiTable, chamiOv, bossOv, chamiOvIk, chamiOvHu, bossOvIk, bossOvHu,
      corpIk, corp13, corpTotal, corpExIk, corpEx13, corpExTotal, corpExNames, bossTotal, share, contractsMode: cm, contractRows };
  }


  // ===== 후속·2차년도 지급 일정 (수수료 TYPE표 회차 기준 — 지급월은 「계약월 + n개월」, n = 회차) =====
  //   익월 = 계약월+1. 손보 인보험·운전자·건강: 13~14회(2회 분할)·15회 / IBK: 판매 13~36회·유지 13~40회 월분할 / 카디프 적립·메트라이프: 13~36회 월분할 /
  //   미래에셋 연금·저축: 13~24회 월분할 / 카디프 일시납: 2차년(13)·3차년(25) 각 1회 / 그 밖: 13회 일괄(회차 미확인 — 가정).
  //   시책 2차년도(si13·co13)는 13회차 한 번.
  const rng = (a, b, f) => { const o = []; for (let k = a; k <= b; k++) o.push([k, f]); return o; };
  const SCHED = {
    son:     { label: '손보 13·14·15회', ev: [[13, 84 / 285.6], [14, 84 / 285.6], [15, 117.6 / 285.6]] },
    m13_36:  { label: '13~36회 월분할', ev: rng(13, 36, 1 / 24) },
    // IBK 평생든든(10·11년납): 후속 180 = 판매수수료 13~36회 0.3(1/24씩 분할 — TYPE표 주석) + 유지수수료 13~40회 1.5(28회 균등은 가정)
    ibk:     { label: 'IBK 판매 13~36회 + 유지 13~40회', ev: rng(13, 40, 5 / 6 / 28).map(([k, f]) => [k, f + (k <= 36 ? 1 / 6 / 24 : 0)]) },
    m13_24:  { label: '13~24회 월분할', ev: rng(13, 24, 1 / 12) },
    lump2:   { label: '일시납 13회·25회', ev: [[13, 0.8], [25, 0.2]] },
    once13:  { label: '13회 일괄(회차 미확인)', ev: [[13, 1]] },
  };
  function schedKey(pr) {
    if (pr.sched && SCHED[pr.sched]) return pr.sched;
    const n = pr.name || '';
    if (/카디프/.test(n)) return /일시납/.test(n) ? 'lump2' : 'm13_36';
    if (/IBK/.test(n)) return 'ibk';
    if (/메트라이프/.test(n)) return 'm13_36';
    if (/미래에셋/.test(n)) return 'm13_24';
    if (/한화|현대해상|KB|DB|메리츠|롯데|하나|삼성|흥국|운전자|인보험|건강|펫/.test(n)) return 'son';
    return 'once13';
  }
  function addMonths(ym, k) { const [y, m] = ym.split('-').map(Number); const t = y * 12 + (m - 1) + k; return Math.floor(t / 12) + '-' + String(t % 12 + 1).padStart(2, '0'); }

  // sets: [{ ym(계약월), products, people, contracts, share, bossShareTable }]  →  { 이름: { 지급월: {...} } }
  // 한 건씩 계산: 본인 수수료·시책 / 오버라이딩(계약진행사원 라인) / 법인시책(지점장, 제외 팀원 계약 빼고) / 쉐어(세후 %) — compute() 와 같은 규칙.
  function timeline(sets) {
    const TAX = 3.3, out = {};
    const add = (name, ym, bucket, kind, v) => {
      if (!v) return;
      const o = (out[name] = out[name] || {}); const r = (o[ym] = o[ym] || { first: { fee: 0, si: 0, ov: 0, corp: 0 }, later: { fee: 0, si: 0, ov: 0, corp: 0 }, out: 0, inn: 0, outL: 0, innL: 0 });
      if (bucket === 'out' || bucket === 'inn') { r[bucket] += v; if (kind === 'later') r[bucket === 'out' ? 'outL' : 'innL'] += v; } else r[bucket][kind] += v;
    };
    sets.forEach(S => {
      const products = S.products || [], people = S.people || [];
      const byId = {}; people.forEach(p => { byId[p.id] = p; });
      const boss = people.find(p => p.role === 'boss'), jij = people.find(p => p.role === 'jijeom');
      const leaders = {}; people.forEach(p => { if (p.leader && p.part) leaders[p.part] = p; });
      const SHT = S.bossShareTable || 75, shr = typeof S.share === 'number' ? S.share : 75;
      (S.contracts || []).forEach(c => {
        const e = byId[c.emp], pr = products.find(x => x.id === c.prod); if (!e || !pr) return;
        const w = (+c.w || 0) * 10000;
        const L = e.part ? leaders[e.part] : null, upl = [];
        if (e.role !== 'boss') {
          const chain = []; if (L && L.id !== e.id) chain.push(L); if (jij && jij.id !== e.id) chain.push(jij); if (boss) chain.push(boss);
          let prev = e.table; chain.forEach(u => { upl.push([u, Math.max(0, u.table - prev) / 100]); prev = Math.max(prev, u.table); });
        }
        const noCorp = e.noCorp === undefined ? e.name === '김태연' : !!e.noCorp;
        const shT = e.role === 'boss' ? SHT : e.table;
        const events = [{ m: 1, bucket: 'first', rate: pr.ik, si: pr.siIk, co: pr.coIk, f: 1 }];
        const sc = SCHED[schedKey(pr)];
        const by = {};
        sc.ev.forEach(([m, f]) => { (by[m] = by[m] || { m, bucket: 'later', rate: 0, si: 0, co: 0, f: 0 }).f += f; });
        if (!by[13]) by[13] = { m: 13, bucket: 'later', rate: 0, si: 0, co: 0, f: 0 };
        by[13].si = pr.si13; by[13].co = pr.co13;
        Object.keys(by).forEach(k => { by[k].rate = pr.hu * by[k].f; events.push(by[k]); });
        events.forEach(ev => {
          const ym = addMonths(S.ym, ev.m), feeW = w * ev.rate / 100, siW = w * ev.si / 100;
          add(e.name, ym, ev.bucket, 'fee', Math.round(feeW * e.table / 100)); add(e.name, ym, ev.bucket, 'si', Math.round(siW));
          upl.forEach(([u, pct]) => add(u.name, ym, ev.bucket, 'ov', Math.round(feeW * pct)));
          if (boss && !noCorp) add(boss.name, ym, ev.bucket, 'corp', Math.round(w * ev.co / 100 * shr / 100));
          const sh = (c.share || []).filter(x => byId[x.to] && +x.pct > 0);
          if (sh.length) {
            const pre = Math.round(feeW * shT / 100) + Math.round(siW), net = pre - Math.round(pre * TAX / 100);
            sh.forEach(x => { const a = Math.floor(net * (+x.pct) / 100); if (a) { add(e.name, ym, 'out', ev.bucket, a); add(byId[x.to].name, ym, 'inn', ev.bucket, a); } });
          }
        });
      });
    });
    // 지급월별 합계(세전·세금·실수령)
    Object.values(out).forEach(months => Object.values(months).forEach(r => {
      const g = o => o.fee + o.si + o.ov + o.corp;
      r.gross = g(r.first) + g(r.later); r.tax = Math.round(r.gross * TAX / 100); r.real = r.gross - r.tax - r.out + r.inn;
      r.lgross = g(r.later); r.ltax = Math.round(r.lgross * TAX / 100); r.lreal = r.lgross - r.ltax - r.outL + r.innL;   // 후속분만
    }));
    return out;
  }

  // 월별 수령 예상 표(HTML). tl = timeline() 결과, name = 사람 이름, cur = 이번 달(YYYY-MM)
  function timelineHtml(tl, name, cur) {
    const T = tl[name] || {}, ms = Object.keys(T).sort();
    if (!ms.length) return '<div style="padding:18px;color:var(--text-mute);">이 사람은 건별로 들어온 수령 내역이 아직 없습니다.</div>';
    const m = v => Math.abs(v) < 0.5 ? '-' : (Math.round(v / 1000) / 10).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const first = r => r.first.fee + r.first.si + r.first.ov + r.first.corp;
    const tot = { f: 0, lf: 0, ls: 0, lo: 0, lc: 0, g: 0, t: 0, o: 0, i: 0, r: 0 };
    let upcoming = 0, upcomingN = 0;
    const body = ms.map(ym => {
      const r = T[ym]; const f = first(r);
      tot.f += f; tot.lf += r.later.fee; tot.ls += r.later.si; tot.lo += r.later.ov; tot.lc += r.later.corp; tot.g += r.gross; tot.t += r.tax; tot.o += r.out; tot.i += r.inn; tot.r += r.real;
      if (ym > cur && upcomingN < 12) { upcoming += r.real; upcomingN++; }
      const cls = ym === cur ? ' class="tl-cur"' : (ym < cur ? ' class="tl-past"' : '');
      return `<tr${cls}><td class="lbl">${ym.replace('-', '년 ')}월${ym === cur ? ' <span class="chip" style="padding:1px 8px;font-size:.7rem;">이번 달</span>' : ''}</td><td class="num">${m(f)}</td><td class="num">${m(r.later.fee)}</td><td class="num">${m(r.later.si)}</td><td class="num">${m(r.later.ov)}</td><td class="num">${m(r.later.corp)}</td><td class="num">${m(r.gross)}</td><td class="num">${r.tax ? '−' + m(r.tax) : '-'}</td><td class="num">${r.out ? '−' + m(r.out) : '-'}</td><td class="num">${r.inn ? '+' + m(r.inn) : '-'}</td><td class="num"><b>${m(r.real)}</b></td></tr>`;
    }).join('');
    const head = '<thead><tr><th>지급월</th><th class="num">익월분<br><span style="font-weight:400;font-size:.72rem;">수수료·시책·오버·법인</span></th><th class="num">후속<br>수수료</th><th class="num">2차년도<br>시책</th><th class="num">오버라이딩<br>(후속)</th><th class="num">법인시책<br>(2차년도)</th><th class="num">세전 합계</th><th class="num">세금 3.3%</th><th class="num">쉐어 지급</th><th class="num">쉐어 수령</th><th class="num">실수령</th></tr></thead>';
    const foot = `<tr class="total-row"><td>합계</td><td class="num">${m(tot.f)}</td><td class="num">${m(tot.lf)}</td><td class="num">${m(tot.ls)}</td><td class="num">${m(tot.lo)}</td><td class="num">${m(tot.lc)}</td><td class="num">${m(tot.g)}</td><td class="num">−${m(tot.t)}</td><td class="num">−${m(tot.o)}</td><td class="num">+${m(tot.i)}</td><td class="num"><b>${m(tot.r)}</b></td></tr>`;
    const chips = `<div class="ct-chips" style="margin:0 0 10px;"><span class="chip">이번 달 이후 12개월 실수령 ${m(upcoming)}만원</span><span class="chip">전체 기간 실수령 합계 ${m(tot.r)}만원 (${ms[0].replace('-', '년 ')}월 ~ ${ms[ms.length - 1].replace('-', '년 ')}월)</span></div>`;
    return chips + `<table class="tbl calc-tbl tl-tbl">${head}<tbody>${body}${foot}</tbody></table>`;
  }

  // 후속분만 따로(작은 표): 익월분은 빼고 후속 수수료·2차년도 시책·오버라이딩 후속·법인시책 2차만
  function laterHtml(tl, name, cur) {
    const T = tl[name] || {}, ms = Object.keys(T).sort().filter(ym => T[ym].lgross > 0 || T[ym].innL > 0);
    if (!ms.length) return '<div style="padding:10px;color:var(--text-mute);font-size:0.82rem;">후속으로 들어올 금액이 아직 없습니다.</div>';
    const m = v => Math.abs(v) < 0.5 ? '-' : (Math.round(v / 1000) / 10).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const tot = { f: 0, s: 0, o: 0, c: 0, g: 0, t: 0, n: 0, r: 0 };
    const body = ms.map(ym => {
      const r = T[ym], l = r.later, net = r.innL - r.outL;
      tot.f += l.fee; tot.s += l.si; tot.o += l.ov; tot.c += l.corp; tot.g += r.lgross; tot.t += r.ltax; tot.n += net; tot.r += r.lreal;
      return `<tr${ym === cur ? ' class="tl-cur"' : (ym < cur ? ' class="tl-past"' : '')}><td>${ym.replace('-', '.')}</td><td class="num">${m(l.fee)}</td><td class="num">${m(l.si)}</td><td class="num">${m(l.ov)}</td><td class="num">${m(l.corp)}</td><td class="num">${m(r.lgross)}</td><td class="num">${r.ltax ? '−' + m(r.ltax) : '-'}</td><td class="num">${net ? (net > 0 ? '+' : '−') + m(Math.abs(net)) : '-'}</td><td class="num"><b>${m(r.lreal)}</b></td></tr>`;
    }).join('');
    return `<table class="tbl calc-tbl tl-tbl tl-small"><thead><tr><th>지급월</th><th class="num">후속수수료</th><th class="num">2차 시책</th><th class="num">오버(후속)</th><th class="num">법인(2차)</th><th class="num">세전</th><th class="num">세금</th><th class="num">쉐어 순</th><th class="num">후속분 실수령</th></tr></thead><tbody>${body}<tr class="total-row"><td>합계</td><td class="num">${m(tot.f)}</td><td class="num">${m(tot.s)}</td><td class="num">${m(tot.o)}</td><td class="num">${m(tot.c)}</td><td class="num">${m(tot.g)}</td><td class="num">−${m(tot.t)}</td><td class="num">${tot.n >= 0 ? '+' : '−'}${m(Math.abs(tot.n))}</td><td class="num"><b>${m(tot.r)}</b></td></tr></tbody></table><div class="tl-note">후속분만 따로 뽑은 표입니다(만원). 위 월별 표의 후속 칸과 같은 금액이며, 세금·쉐어를 후속분만으로 다시 계산해서 원 단위 반올림 차이가 날 수 있습니다.</div>`;
  }

  const per_id = p => p.id;
  function roleText(p) { return p.leader && p.part ? p.part + '장' : ROLE_LABEL[p.role]; }
  const fmt = v => Math.abs(v) < 0.05 ? '-' : v.toLocaleString('ko-KR', { maximumFractionDigits: 1 });

  return { LS, TABLE_OPTS, ROLE_LABEL, contractAlloc, deriveWolchoShared, roleText, timelineHtml, laterHtml, SCHED, schedKey, addMonths, timeline, contractsMode, deriveWolcho, defaultProducts, defaultPeople, state, initDefault, load, save, compute, fmt, monthKey, isNoCorp };
})();
