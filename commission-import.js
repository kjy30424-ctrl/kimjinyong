// ===== 계약공유방 카톡 내보내기(txt) → 계약 건별 입력 자동 변환 (2026-10-01) =====
// 브라우저·노드 공용. 보고서 제작 코드(pay.py)의 파싱·분류 규칙을 그대로 옮김.
const HWImport = (function () {
  // 속성(자세히) → 쉐어 상대 (대표님 확정 규칙, 월간계약보고서_스펙 §3-4·3-4b). 위에서부터 먼저 맞는 것.
  const SHARE_RULES = [
    { re: /세미나\s*\(\s*김병인\s*\)/, to: '김병인', pct: 50 },
    { re: /부캐님/, to: '정연실', pct: 100 },   // 부캐님(정연실) 계약은 그 건만 세후 100%
    { re: /랭커/, to: '김선호', pct: 50 },
    { re: /신혼테크|시드업/, to: '박세인', pct: 50 },
    { re: /부상구/, to: '한희환', pct: 50 },
    { re: /쑤디/, to: '김지수', pct: 50 },
    { re: /채미/, to: '한채혁', pct: 50 },
    { re: /효라클/, to: '김성효', pct: 50 },
    { re: /늘늘/, to: '김하늘', pct: 50 },
    { re: /비스토리/, to: '김윤호', pct: 50 },
    { re: /열정피엠/, to: '전찬민', pct: 50 },
    { re: /히르찬/, to: '장희찬', pct: 50 },
  ];
  const NAME_FIX = { '김동희': '김동휘' };

  function parseText(txt) {
    const lines = txt.split(/\r?\n/);
    const rows = []; let curDate = null;
    const hoRe = /\*\s*(\d+)\s*호\s*$/;
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      let m = ln.match(/^-+ (\d{4})년 (\d+)월 (\d+)일/);
      if (m) { curDate = { y: +m[1], m: +m[2], d: +m[3] }; continue; }
      m = ln.match(hoRe);
      if (!(m && curDate)) continue;
      const blk = {}; let j = i + 1;
      while (j < lines.length && !hoRe.test(lines[j]) && !lines[j].startsWith('---------------')) {
        const t = lines[j];
        if (/^\[[^\]]+\] \[[^\]]+\] /.test(t) && blk['속성'] !== undefined) break;
        [['사원', /계약진행사원\s*:\s*(.+)/], ['상품', /회사\/상품명\s*:\s*(.+)/], ['계약자', /계약자\/피보험자\s*:\s*(.+)/],
         ['보험료', /보험료\s*:\s*(.+)/], ['납입', /납입기간\s*:\s*(.+)/], ['속성', /속성\(자세히\)\s*:\s*(.+)/]].forEach(([k, re]) => {
          const mm = t.match(re); if (mm && blk[k] === undefined) blk[k] = mm[1].trim();
        });
        j++;
      }
      if (blk['사원'] !== undefined) rows.push({ ...blk, ho: +m[1], date: curDate });
      i = j - 1;
    }
    return rows;
  }
  const months = rows => [...new Set(rows.map(r => r.date.y + '-' + String(r.date.m).padStart(2, '0')))].sort();

  function pickProduct(products, co, pr, pay, amtWon) {
    const find = (...keys) => products.find(p => keys.every(k => p.name.includes(k)));
    if (/^IBK/.test(co)) return /15/.test(pay) ? (find('IBK연금15년납') || find('IBK', '15')) : (find('IBK 변액연금') || find('IBK'));
    if (/^한화손/.test(co)) return find('한화손보 여성건강') || find('한화손보');
    if (/^현대해상/.test(co)) { if (/태아실손/.test(pr)) return find('실손'); if (/펫/.test(pr)) return find('펫'); return products.find(p => p.name === '현대해상') || find('현대해상'); }
    if (/^kb/i.test(co)) return /간편건강/.test(pr) ? find('KB 간편건강') : (find('KB손해보험') || find('KB'));
    if (/^DB/i.test(co)) return /운전자/.test(pr) ? find('DB운전자') : find('DB건강보험');
    if (/^메리츠/.test(co)) return find('메리츠운전자');
    if (/^라이나/.test(co)) return /10\s*년/.test(pay) || /10\s*년/.test(pr) ? find('치아10년납') : find('치아5년납');
    if (/^미래에셋/.test(co)) return find('연금액강화형') || find('미래에셋');
    if (/^BNP|카디프/.test(co)) {
      if (/일시납/.test(pr + pay)) return amtWon >= 100000000 ? (find('일시납1억') || find('일시납')) : (find('일시납그외') || find('일시납'));
      return find('적립식') || find('카디프');
    }
    if (/^메트라이프/.test(co)) return find('메트라이프');
    return find(co.slice(0, 3));
  }

  // 한 달치 계약을 계산기 건별 형식으로 변환. 알 수 없는 사원/상품은 flags에 이유를 적어 화면에서 표시.
  function toContracts(rows, ym, people, products) {
    const byName = {}; people.forEach(p => { byName[p.name] = p; });
    const boss = people.find(p => p.role === 'boss'); if (boss && !byName['김병인']) byName['김병인'] = boss;   // 지점장 본인(화면 이름 「지점장」) = 김병인
    const out = [];
    rows.filter(r => r.date.y + '-' + String(r.date.m).padStart(2, '0') === ym).forEach((r, k) => {
      const flags = [];
      let empName = NAME_FIX[r['사원']] || r['사원'];
      let co = '', pr = r['상품'];
      if (pr.includes('/')) { const i = pr.indexOf('/'); co = pr.slice(0, i).trim(); pr = pr.slice(i + 1).trim(); }
      const amtWon = parseInt((r['보험료'] || '').replace(/[^\d]/g, ''), 10) || 0;
      const pay = r['납입'] || '';
      if (/자동차/.test(r['상품'])) return;   // 자동차보험 제외(월납 실적 아님)
      if (!co && /^한화/.test(pr)) co = '한화손보';   // 「한화 더건강한 …」처럼 회사 표기 없이 상품명만 온 경우
      const prod = pickProduct(products, co, pr, pay, amtWon);
      let w = amtWon / 10000;
      const lump = /카디프|BNP/.test(co) && /일시납/.test(pr + pay);
      if (lump) w = Math.round(amtWon / 10000 * 76 / 10000 * 10000) / 10000;   // 일시납: 월초 = 납입금액(만원) × 76 ÷ 10,000
      const attr = (r['속성'] || '').replace(/\s+/g, ' ');
      let shares = [];
      const rule = SHARE_RULES.find(x => x.re.test(attr));
      if (rule) shares = [{ toName: rule.to, pct: rule.pct }];
      // 특수: 효라클 원베일리 카디프 일시납(2026-09 40호) — 계약진행사원 김병인이어도 김태연 계약, 효라클 50% · 김병인 25% (대표님 지정)
      if (lump && /효라클/.test(attr) && empName === '김병인') { empName = '김태연'; shares = [{ toName: '김성효', pct: 50 }, { toName: '김병인', pct: 25 }]; flags.push('특수 규칙: 일시납 효라클 건 → 김태연 계약, 효라클 50% · 김병인 25%'); }
      const emp = byName[empName];
      if (!emp) flags.push('계약진행사원 「' + empName + '」을 팀원에서 못 찾음');
      if (!prod) flags.push('상품 「' + r['상품'] + '」을 상품표에서 못 찾음');
      const sh = [];
      shares.forEach(s => { const t = byName[s.toName]; if (t) sh.push({ to: t.id, pct: s.pct }); else flags.push('쉐어 상대 「' + s.toName + '」을 팀원에서 못 찾음(팀원 추가 필요)'); });
      if (/태아실손/.test(pr)) flags.push('태아실손 — 수수료 미반영(실손 요율 0)');
      out.push({ id: 'c' + ym.replace('-', '') + String(r.ho).padStart(3, '0') + '_' + k, ho: r.ho, date: r.date.m + '/' + r.date.d, emp: emp ? emp.id : '', prod: prod ? prod.id : '',
        w, tag: attr, share: sh, flags });
    });
    return out;
  }
  return { SHARE_RULES, parseText, months, toContracts, pickProduct };
})();
if (typeof module !== 'undefined') module.exports = HWImport;
