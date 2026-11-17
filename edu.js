// ===== 공용 교육/자료 컴포넌트 =====
// 페이지에서 <script>window.EDU = { key: '...' }</script> 설정 후 이 파일을 로드.
// 주제(폴더)별로 영상(유튜브)·파일·글을 담고, 지점장(boss)이 추가/삭제/순서이동(▲▼) 가능.
// 데이터는 Supabase app_config(key=EDU.key)에 JSON으로 저장. 파일은 storage 'materials' 버킷.
(function () {
  const auth = JSON.parse(localStorage.getItem('hwAuth') || 'null');
  const isBoss = auth && auth.role === 'boss';   // 편집은 지점장만, 보기는 누구나
  const KEY = (window.EDU && window.EDU.key) || 'edu_default';
  let data = { folders: [] };
  let uploadFi = null;          // 파일 업로드 대상 폴더 index
  let editTarget = null;        // 글 편집 대상 {fi, ii}  (ii<0 이면 새 글)

  const esc = s => String(s == null ? '' : s).replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const uid = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const isImg = n => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(n || '');
  function ytId(url) {
    if (!url) return '';
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/))([\w-]{11})/);
    if (m) return m[1];
    if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
    return '';
  }
  const FOLDER_ICO = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.6-.8l-.8-1.1A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>';
  const FILE_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/></svg>';

  // ---- 스타일 주입 (모든 교육 페이지 공통) ----
  const style = document.createElement('style');
  style.textContent = `
    .folder{background:var(--surface);border:1px solid var(--line);border-radius:12px;margin-bottom:14px;box-shadow:var(--shadow-sm);overflow:hidden;}
    .folder>summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px;padding:14px 18px;font-weight:600;}
    .folder>summary::-webkit-details-marker{display:none;}
    .folder>summary .fico{color:var(--brand);display:flex;}
    .folder>summary .cnt{color:var(--text-mute);font-size:.82rem;font-weight:500;}
    .folder>summary .sp{flex:1;}
    .folder-body{padding:14px 18px 16px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:12px;}
    .vid{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--bg);max-width:460px;}
    .vid-frame{position:relative;aspect-ratio:16/9;background:#11151b;}
    .vid-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0;}
    .vid-frame .noid{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#8b94a3;font-size:.82rem;}
    .vid-meta{display:flex;align-items:center;gap:6px;padding:10px 12px;}
    .vid-meta .vt{flex:1;font-weight:600;font-size:.9rem;}
    .file-row{display:flex;align-items:center;gap:8px;}
    .file-row .fico{color:var(--brand);display:flex;}
    .file-row .fname{flex:1;font-size:.9rem;font-weight:500;}
    .file-row .dl{color:var(--brand-dk);font-weight:600;font-size:.85rem;}
    .att-img{max-width:100%;border-radius:10px;border:1px solid var(--line);}
    .text-item{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--bg);}
    .text-item .ti-head{display:flex;align-items:center;gap:6px;}
    .text-item .tt{flex:1;font-weight:700;font-size:.95rem;}
    .text-item .tb{margin-top:8px;white-space:pre-wrap;line-height:1.65;font-size:.92rem;color:var(--text);}
    .edu-ctrl{background:none;border:none;cursor:pointer;font-size:.85rem;opacity:.55;padding:1px 3px;line-height:1;}
    .edu-ctrl:hover{opacity:1;}
    .edu-ctrl:disabled{opacity:.18;cursor:default;}
    .addrow{display:flex;gap:8px;flex-wrap:wrap;}
    .empty{color:var(--text-mute);font-size:.86rem;padding:8px 2px;}
    .edu-modal{position:fixed;inset:0;background:rgba(15,20,28,.45);display:none;align-items:center;justify-content:center;z-index:60;padding:20px;}
    .edu-modal.on{display:flex;}
    .edu-modal-box{background:var(--surface);border-radius:16px;padding:20px;width:100%;max-width:520px;box-shadow:0 20px 50px -12px rgba(0,0,0,.35);}
    .edu-modal-box h3{font-size:1.05rem;margin-bottom:12px;}
    .edu-modal-box input,.edu-modal-box textarea{width:100%;border:1.5px solid var(--line-2);border-radius:10px;padding:11px 13px;font-size:.95rem;font-family:inherit;margin-bottom:10px;}
    .edu-modal-box input:focus,.edu-modal-box textarea:focus{outline:none;border-color:var(--brand);}
    .edu-modal-box textarea{min-height:200px;resize:vertical;}
    .edu-modal-box .row{display:flex;justify-content:flex-end;gap:8px;}
  `;
  document.head.appendChild(style);

  // ---- 글 작성/수정 모달 ----
  const modal = document.createElement('div');
  modal.className = 'edu-modal';
  modal.innerHTML = `<div class="edu-modal-box">
    <h3 id="emHead">글 작성</h3>
    <input id="emTitle" placeholder="제목">
    <textarea id="emBody" placeholder="내용을 입력하세요"></textarea>
    <div class="row"><button class="btn btn-ghost" id="emCancel">취소</button><button class="btn btn-brand" id="emSave">저장</button></div>
  </div>`;
  document.body.appendChild(modal);

  async function load() {
    try {
      const { data: d } = await SB.from('app_config').select('value').eq('key', KEY).maybeSingle();
      if (d && d.value && Array.isArray(d.value.folders)) data = d.value;
    } catch (e) {}
    if (!Array.isArray(data.folders)) data.folders = [];
    render();
  }
  async function save() {
    try {
      await SB.from('app_config').upsert({ key: KEY, value: data, updated_at: new Date().toISOString() });
    } catch (e) { alert('저장 실패: ' + e.message); }
  }

  function ctrls(fi, ii, len) {     // 항목 ▲▼🗑 (지점장만)
    if (!isBoss) return '';
    return `<button class="edu-ctrl" data-act="iup" data-fi="${fi}" data-ii="${ii}" title="위로"${ii === 0 ? ' disabled' : ''}>▲</button>
      <button class="edu-ctrl" data-act="idown" data-fi="${fi}" data-ii="${ii}" title="아래로"${ii === len - 1 ? ' disabled' : ''}>▼</button>
      <button class="edu-ctrl" data-act="idel" data-fi="${fi}" data-ii="${ii}" title="삭제">🗑</button>`;
  }

  function itemHtml(it, fi, ii, len) {
    if (it.type === 'video') {
      const id = ytId(it.url);
      return `<div class="vid">
        <div class="vid-frame">${id ? `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>` : `<div class="noid">▶ 링크 확인 필요</div>`}</div>
        <div class="vid-meta"><span class="vt">${esc(it.title)}</span>${ctrls(fi, ii, len)}</div></div>`;
    }
    if (it.type === 'file') {
      const inner = isImg(it.title)
        ? `<img class="att-img" src="${SB.storage.from('materials').getPublicUrl(it.path).data.publicUrl}" alt="${esc(it.title)}">`
        : '';
      return `<div>
        <div class="file-row"><span class="fico">${FILE_ICO}</span><span class="fname">${esc(it.title)}</span>
          <a class="dl" href="#" data-act="dl" data-path="${esc(it.path)}">다운로드</a>${ctrls(fi, ii, len)}</div>
        ${inner}</div>`;
    }
    if (it.type === 'text') {
      return `<div class="text-item"><div class="ti-head"><span class="tt">${esc(it.title)}</span>
        ${isBoss ? `<button class="edu-ctrl" data-act="iedit" data-fi="${fi}" data-ii="${ii}" title="수정">✏️</button>` : ''}${ctrls(fi, ii, len)}</div>
        <div class="tb">${esc(it.body)}</div></div>`;
    }
    return '';
  }

  function render() {
    const af = document.getElementById('addFolder');
    if (af) af.style.display = isBoss ? '' : 'none';
    const box = document.getElementById('folders');
    if (!data.folders.length) {
      box.innerHTML = `<div class="empty">아직 내용이 없습니다.${isBoss ? ' "📁 주제 추가"로 만들어 보세요.' : ''}</div>`;
      return;
    }
    box.innerHTML = data.folders.map((fd, fi) => {
      const its = fd.items || [];
      const body = its.length ? its.map((it, ii) => itemHtml(it, fi, ii, its.length)).join('') : `<div class="empty">아직 자료가 없습니다.</div>`;
      return `<details class="folder" open>
        <summary>
          <span class="fico">${FOLDER_ICO}</span>
          <span>${esc(fd.name)}</span><span class="cnt">(${its.length})</span>
          <span class="sp"></span>
          ${isBoss ? `<button class="edu-ctrl" data-act="fup" data-fi="${fi}" title="위로"${fi === 0 ? ' disabled' : ''}>▲</button>
          <button class="edu-ctrl" data-act="fdown" data-fi="${fi}" title="아래로"${fi === data.folders.length - 1 ? ' disabled' : ''}>▼</button>
          <button class="edu-ctrl" data-act="fren" data-fi="${fi}" title="이름수정">✏️</button>
          <button class="edu-ctrl" data-act="fdel" data-fi="${fi}" title="삭제">🗑</button>` : ''}
        </summary>
        <div class="folder-body">
          ${body}
          ${isBoss ? `<div class="addrow"><button class="btn btn-ghost" data-act="addvid" data-fi="${fi}">➕ 영상</button>
            <button class="btn btn-ghost" data-act="addfile" data-fi="${fi}">⬆ 파일</button>
            <button class="btn btn-ghost" data-act="addtext" data-fi="${fi}">✍ 글</button></div>` : ''}
        </div></details>`;
    }).join('');
  }

  function move(arr, i, dir) {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return false;
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    return true;
  }

  // ---- 이벤트 ----
  const addFolderBtn = document.getElementById('addFolder');
  if (addFolderBtn) addFolderBtn.addEventListener('click', async () => {
    const name = prompt('주제(폴더) 이름 (예: 세일즈 기본 과정)');
    if (!name) return;
    data.folders.push({ id: uid(), name: name.trim(), items: [] });
    await save(); render();
  });

  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    const fi = t.dataset.fi != null ? Number(t.dataset.fi) : null;
    const ii = t.dataset.ii != null ? Number(t.dataset.ii) : null;
    const fd = fi != null ? data.folders[fi] : null;

    if (act === 'dl') {
      e.preventDefault();
      const { data: d } = SB.storage.from('materials').getPublicUrl(t.dataset.path);
      window.open(d.publicUrl, '_blank');
      return;
    }
    if (!isBoss) return;     // 아래부터는 편집 — 지점장만

    if (act === 'fup') { if (move(data.folders, fi, -1)) { await save(); render(); } }
    else if (act === 'fdown') { if (move(data.folders, fi, 1)) { await save(); render(); } }
    else if (act === 'fren') {
      const name = prompt('주제 이름 수정', fd.name);
      if (!name) return;
      fd.name = name.trim(); await save(); render();
    }
    else if (act === 'fdel') {
      if (!confirm(`"${fd.name}" 주제를 삭제할까요? (안의 자료도 함께 삭제)`)) return;
      const paths = (fd.items || []).filter(x => x.type === 'file' && x.path).map(x => x.path);
      if (paths.length) await SB.storage.from('materials').remove(paths);
      data.folders.splice(fi, 1); await save(); render();
    }
    else if (act === 'addvid') {
      const title = prompt('영상 제목');
      if (!title) return;
      const url = prompt('YouTube 링크 (예: https://youtu.be/XXXXXXXXXXX)');
      fd.items = fd.items || [];
      fd.items.push({ id: uid(), type: 'video', title: title.trim(), url: (url || '').trim() });
      await save(); render();
    }
    else if (act === 'addfile') {
      uploadFi = fi;
      const fin = document.getElementById('fileInput'); fin.value = ''; fin.click();
    }
    else if (act === 'addtext') { openModal(fi, -1); }
    else if (act === 'iedit') { openModal(fi, ii); }
    else if (act === 'iup') { if (move(fd.items, ii, -1)) { await save(); render(); } }
    else if (act === 'idown') { if (move(fd.items, ii, 1)) { await save(); render(); } }
    else if (act === 'idel') {
      const it = fd.items[ii];
      if (!confirm('이 자료를 삭제할까요?')) return;
      if (it.type === 'file' && it.path) await SB.storage.from('materials').remove([it.path]);
      fd.items.splice(ii, 1); await save(); render();
    }
  });

  // 파일 업로드
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file || uploadFi == null) return;
    const dot = file.name.lastIndexOf('.');
    const ext = (dot >= 0 ? file.name.slice(dot + 1) : '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'dat';
    const path = `${KEY}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const up = await SB.storage.from('materials').upload(path, file);
    e.target.value = '';
    if (up.error) { alert('업로드 실패: ' + up.error.message); uploadFi = null; return; }
    const fd = data.folders[uploadFi];
    fd.items = fd.items || [];
    fd.items.push({ id: uid(), type: 'file', title: file.name, path });
    uploadFi = null;
    await save(); render();
  });

  // 글 모달
  function openModal(fi, ii) {
    editTarget = { fi, ii };
    const isNew = ii < 0;
    const it = isNew ? { title: '', body: '' } : data.folders[fi].items[ii];
    document.getElementById('emHead').textContent = isNew ? '글 작성' : '글 수정';
    document.getElementById('emTitle').value = it.title || '';
    document.getElementById('emBody').value = it.body || '';
    modal.classList.add('on');
    document.getElementById('emTitle').focus();
  }
  document.getElementById('emCancel').addEventListener('click', () => { modal.classList.remove('on'); editTarget = null; });
  modal.addEventListener('click', e => { if (e.target === modal) { modal.classList.remove('on'); editTarget = null; } });
  document.getElementById('emSave').addEventListener('click', async () => {
    if (!editTarget) return;
    const title = document.getElementById('emTitle').value.trim();
    const body = document.getElementById('emBody').value;
    if (!title) { alert('제목을 입력하세요.'); return; }
    const { fi, ii } = editTarget;
    const fd = data.folders[fi];
    fd.items = fd.items || [];
    if (ii < 0) fd.items.push({ id: uid(), type: 'text', title, body });
    else { fd.items[ii].title = title; fd.items[ii].body = body; }
    modal.classList.remove('on'); editTarget = null;
    await save(); render();
  });

  load();
})();
