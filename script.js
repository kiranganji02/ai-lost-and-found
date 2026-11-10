/* ============================================================
   DATA STORE
   ============================================================ */
const STORE_KEY = 'clf_items';
const MATCH_KEY = 'clf_matches';

function getItems() { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
function saveItems(arr) { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); }
function getMatches() { return JSON.parse(localStorage.getItem(MATCH_KEY) || '[]'); }
function saveMatches(arr) { localStorage.setItem(MATCH_KEY, JSON.stringify(arr)); }
let nextId = () => Date.now() + Math.floor(Math.random()*1000);

/* ============================================================
   NAVIGATION
   ============================================================ */
let currentTab = 'lost';

function go(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('show'));
  document.getElementById('page-' + page).classList.add('show');
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
  document.querySelector('.nav-links').classList.remove('open');
  window.scrollTo(0, 0);
  if (page === 'home') refreshHome();
  if (page === 'browse') renderBrowse();
  if (page === 'matches') renderMatches();
}

function goReport(type) {
  go('report');
  setReportType(type);
}

/* helper: build a nice short location string */
function locString(item) {
  let parts = [];
  if (item.building) parts.push(item.building);
  if (item.floor && item.floor !== 'N/A (Outdoor)') parts.push(item.floor);
  if (item.area) parts.push(item.area);
  if (item.room) parts.push(item.room);
  return parts.join(' · ') || 'Campus';
}

/* helper: location tags HTML */
function locTags(item) {
  let html = '';
  if (item.building) html += `<span class="loc-tag">&#127963; ${esc(item.building)}</span>`;
  if (item.floor && item.floor !== 'N/A (Outdoor)') html += `<span class="loc-tag">&#11014; ${esc(item.floor)}</span>`;
  if (item.area) html += `<span class="loc-tag">&#128205; ${esc(item.area)}</span>`;
  if (item.room) html += `<span class="loc-tag">&#128290; ${esc(item.room)}</span>`;
  return html;
}

/* ============================================================
   HOME
   ============================================================ */
function refreshHome() {
  const items = getItems();
  const matches = getMatches();
  const lost = items.filter(i => i.type === 'lost');
  const found = items.filter(i => i.type === 'found');
  const active = items.filter(i => i.status === 'active');

  document.getElementById('stat-lost').textContent = lost.length;
  document.getElementById('stat-found').textContent = found.length;
  document.getElementById('stat-matched').textContent = matches.filter(m => m.status === 'confirmed').length;
  document.getElementById('stat-active').textContent = active.length;

  renderRecentList('recent-lost', lost.slice(-3).reverse(), 'lost');
  renderRecentList('recent-found', found.slice(-3).reverse(), 'found');
}

function renderRecentList(elId, items, type) {
  const el = document.getElementById(elId);
  if (!items.length) {
    const label = type === 'lost' ? 'lost' : 'found';
    const emoji = type === 'lost' ? '&#128269;' : '&#128230;';
    const btnClass = type === 'lost' ? 'btn-dark' : 'btn-green';
    el.innerHTML = `<div class="empty-msg"><span class="icon">${emoji}</span>No ${label} items reported yet.<br/><button class="btn btn-sm ${btnClass}" style="margin-top:12px" onclick="goReport('${type}')">Report ${label.charAt(0).toUpperCase()+label.slice(1)} Item</button></div>`;
    return;
  }
  el.innerHTML = items.map(i => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid #f0f0f0;border-radius:8px;margin-bottom:8px;cursor:pointer;" onclick="showDetail(${i.id})">
      <div style="width:48px;height:48px;border-radius:8px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#ccc;flex-shrink:0;font-size:1.2rem;overflow:hidden;">
        ${i.imageData ? `<img src="${i.imageData}" style="width:100%;height:100%;object-fit:cover;"/>` : (type==='lost'?'&#128269;':'&#128230;')}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:.88rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(i.title)}</div>
        <div style="font-size:.72rem;color:#aaa;">${esc(i.category)} &middot; ${esc(locString(i))}</div>
      </div>
      <span class="badge ${type}" style="flex-shrink:0;">${type}</span>
    </div>
  `).join('');
}

/* ============================================================
   BROWSE
   ============================================================ */
function setTab(type) {
  currentTab = type;
  document.getElementById('tab-lost').classList.toggle('on', type==='lost');
  document.getElementById('tab-found').classList.toggle('on', type==='found');
  renderBrowse();
}

function renderBrowse() {
  const items = getItems().filter(i => i.type === currentTab);
  const search = (document.getElementById('searchBox').value || '').toLowerCase();
  const cat = document.getElementById('catFilter').value;
  const area = document.getElementById('areaFilter').value;
  let filtered = items;
  if (search) filtered = filtered.filter(i => i.title.toLowerCase().includes(search) || i.description.toLowerCase().includes(search) || (i.building||'').toLowerCase().includes(search) || (i.room||'').toLowerCase().includes(search));
  if (cat) filtered = filtered.filter(i => i.category === cat);
  if (area) filtered = filtered.filter(i => i.area === area);
  filtered = filtered.reverse();

  const el = document.getElementById('browseResults');
  if (!filtered.length) {
    el.innerHTML = `<div class="empty-msg" style="padding:60px 16px;"><span class="icon">&#128270;</span>No items found.<br/><button class="btn btn-sm btn-dark" style="margin-top:12px;" onclick="goReport('${currentTab}')">Report ${currentTab.charAt(0).toUpperCase()+currentTab.slice(1)} Item</button></div>`;
    return;
  }
  el.innerHTML = `<div class="items-grid">${filtered.map(i => `
    <div class="item-card" onclick="showDetail(${i.id})">
      <div class="card-thumb">
        ${i.imageData ? `<img src="${i.imageData}" style="width:100%;height:100%;object-fit:cover;"/>` : (i.type==='lost'?'&#128269;':'&#128230;')}
        <span class="card-tag ${i.type}">${i.type}</span>
      </div>
      <div class="card-body">
        <h3>${esc(i.title)}</h3>
        <p class="desc">${esc(i.description.substring(0,80))}${i.description.length>80?'...':''}</p>
        <div class="card-meta">
          ${locTags(i)}
          <span class="loc-tag">${esc(i.category)}</span>
          <span class="loc-tag">${esc(i.date_occurred)}</span>
        </div>
      </div>
    </div>
  `).join('')}</div>`;
}

/* ============================================================
   REPORT FORM
   ============================================================ */
let reportType = 'lost';

function setReportType(type) {
  reportType = type;
  document.getElementById('reportType').value = type;
  const l = document.getElementById('sw-lost');
  const f = document.getElementById('sw-found');
  l.className = type==='lost' ? 'on-lost' : '';
  f.className = type==='found' ? 'on-found' : '';
}

function previewImg(input) {
  const preview = document.getElementById('imgPreview');
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; };
    reader.readAsDataURL(input.files[0]);
  }
}

function submitReport(e) {
  e.preventDefault();
  const imgEl = document.getElementById('imgPreview');
  const item = {
    id: nextId(),
    type: reportType,
    title: document.getElementById('f-title').value.trim(),
    category: document.getElementById('f-category').value,
    date_occurred: document.getElementById('f-date').value,
    /* campus location */
    building: document.getElementById('f-building').value,
    floor: document.getElementById('f-floor').value,
    area: document.getElementById('f-area').value,
    room: document.getElementById('f-room').value.trim(),
    locnote: document.getElementById('f-locnote').value.trim(),
    /* details */
    description: document.getElementById('f-desc').value.trim(),
    color: document.getElementById('f-color').value.trim(),
    brand: document.getElementById('f-brand').value.trim(),
    contact_name: document.getElementById('f-name').value.trim(),
    contact_email: document.getElementById('f-email').value.trim(),
    contact_phone: document.getElementById('f-phone').value.trim(),
    department: document.getElementById('f-dept').value.trim(),
    imageData: imgEl.style.display !== 'none' ? imgEl.src : '',
    status: 'active',
    created_at: new Date().toLocaleString(),
  };
  const items = getItems();
  items.push(item);
  saveItems(items);

  // run matching
  runMatching(item);

  // reset
  document.getElementById('reportForm').reset();
  imgEl.style.display = 'none';
  setReportType('lost');

  toast('Item reported successfully!');
  showDetail(item.id);
}

/* ============================================================
   MATCHING
   ============================================================ */
function similarity(a, b) {
  if (!a || !b) return 0;
  a = a.toLowerCase(); b = b.toLowerCase();
  const wa = new Set(a.split(/\W+/).filter(Boolean));
  const wb = new Set(b.split(/\W+/).filter(Boolean));
  if (!wa.size || !wb.size) return 0;
  let overlap = 0;
  wa.forEach(w => { if (wb.has(w)) overlap++; });
  return overlap / Math.max(wa.size, wb.size);
}

function runMatching(newItem) {
  const items = getItems();
  const opposite = newItem.type === 'lost' ? 'found' : 'lost';
  const candidates = items.filter(i => i.type === opposite && i.status === 'active');
  const matches = getMatches();

  candidates.forEach(c => {
    let score = 0;
    score += similarity(newItem.title, c.title) * 0.25;
    score += similarity(newItem.description, c.description) * 0.25;
    score += (newItem.category === c.category ? 0.15 : 0);
    /* campus location matching — building + floor + area */
    score += (newItem.building && c.building && newItem.building === c.building ? 0.10 : 0);
    score += (newItem.floor && c.floor && newItem.floor === c.floor ? 0.05 : 0);
    score += (newItem.area && c.area && newItem.area === c.area ? 0.05 : 0);
    score += similarity(newItem.room || '', c.room || '') * 0.05;
    score += (newItem.color && c.color && newItem.color.toLowerCase() === c.color.toLowerCase() ? 0.05 : 0);
    score += (newItem.brand && c.brand && newItem.brand.toLowerCase() === c.brand.toLowerCase() ? 0.05 : 0);

    if (score >= 0.28) {
      const lost = newItem.type === 'lost' ? newItem : c;
      const found = newItem.type === 'found' ? newItem : c;
      const exists = matches.some(m => m.lost_id === lost.id && m.found_id === found.id);
      if (!exists) {
        matches.push({
          id: nextId(),
          score: Math.min(score, 1),
          lost_id: lost.id,
          lost_title: lost.title,
          lost_contact: lost.contact_name,
          lost_email: lost.contact_email,
          lost_loc: locString(lost),
          found_id: found.id,
          found_title: found.title,
          found_contact: found.contact_name,
          found_email: found.contact_email,
          found_loc: locString(found),
          status: 'pending',
          created_at: new Date().toLocaleString(),
        });
      }
    }
  });
  saveMatches(matches);
}

/* ============================================================
   MATCHES PAGE
   ============================================================ */
function renderMatches() {
  const matches = getMatches().reverse();
  const el = document.getElementById('matchesList');
  if (!matches.length) {
    el.innerHTML = `<div class="empty-msg" style="padding:60px 16px;"><span class="icon">&#128279;</span>No matches yet.<br/>Report items and matches will appear automatically.</div>`;
    return;
  }
  el.innerHTML = matches.map(m => {
    const pct = Math.round(m.score * 100);
    const cls = pct >= 70 ? 'hi' : pct >= 45 ? 'mid' : 'lo';
    const color = cls==='hi' ? '#27ae60' : cls==='mid' ? '#f39c12' : '#c0392b';
    return `
    <div style="background:#fff;border:1px solid #eee;border-radius:12px;padding:24px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
        <div style="width:64px;height:64px;border-radius:50%;background:${color}18;color:${color};display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;flex-shrink:0;">
          <span style="font-size:1.3rem;line-height:1;">${pct}</span><span style="font-size:.65rem;">%</span>
        </div>
        <div style="flex:1;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <div style="flex:1;min-width:120px;text-align:center;background:#fdf2f2;border-radius:8px;padding:12px;">
            <span class="badge lost" style="margin-bottom:6px;display:inline-block;">LOST</span>
            <div style="font-size:.88rem;font-weight:600;">${esc(m.lost_title)}</div>
            <div style="font-size:.75rem;color:#888;">${esc(m.lost_contact)}</div>
            <div style="font-size:.7rem;color:#aaa;margin-top:2px;">&#127963; ${esc(m.lost_loc)}</div>
          </div>
          <div style="color:#ccc;font-size:1.2rem;">&#8596;</div>
          <div style="flex:1;min-width:120px;text-align:center;background:#edf8f0;border-radius:8px;padding:12px;">
            <span class="badge found" style="margin-bottom:6px;display:inline-block;">FOUND</span>
            <div style="font-size:.88rem;font-weight:600;">${esc(m.found_title)}</div>
            <div style="font-size:.75rem;color:#888;">${esc(m.found_contact)}</div>
            <div style="font-size:.7rem;color:#aaa;margin-top:2px;">&#127963; ${esc(m.found_loc)}</div>
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;border-top:1px solid #f0f0f0;padding-top:12px;flex-wrap:wrap;gap:8px;">
        <span style="font-size:.78rem;color:#aaa;">${esc(m.created_at)}</span>
        ${m.status === 'pending' ? `
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm btn-green" onclick="setMatchStatus(${m.id},'confirmed')">&#10003; Confirm</button>
            <button class="btn btn-sm btn-outline" onclick="setMatchStatus(${m.id},'rejected')">&#10007; Not a Match</button>
          </div>
        ` : `
          <span class="badge ${m.status==='confirmed'?'found':'lost'}">${m.status}</span>
        `}
      </div>
    </div>`;
  }).join('');
}

function setMatchStatus(id, status) {
  const matches = getMatches();
  const m = matches.find(x => x.id === id);
  if (m) m.status = status;
  saveMatches(matches);
  renderMatches();
  toast(status === 'confirmed' ? 'Match confirmed!' : 'Match rejected.');
}

/* ============================================================
   DETAIL PAGE
   ============================================================ */
function showDetail(id) {
  const items = getItems();
  const item = items.find(i => i.id === id);
  if (!item) return;

  const matches = getMatches().filter(m => m.lost_id === id || m.found_id === id);

  const el = document.getElementById('detailContent');
  el.innerHTML = `
  <div style="margin-bottom:14px;">
    <button class="btn btn-sm btn-outline" onclick="go('browse')">&larr; Back</button>
  </div>
  <div class="detail-layout">
    <div class="detail-box">
      <div class="detail-top">
        <span class="badge ${item.type}">${item.type.toUpperCase()}</span>
        <span class="badge ${item.status}">${item.status}</span>
      </div>
      ${item.imageData ? `<div style="max-height:280px;overflow:hidden;"><img src="${item.imageData}" style="width:100%;object-fit:cover;max-height:280px;"/></div>` : ''}
      <div class="detail-body">
        <h1>${esc(item.title)}</h1>
        <div class="meta-grid">
          <div><label>Category</label><span>${esc(item.category)}</span></div>
          <div><label>Date</label><span>${esc(item.date_occurred)}</span></div>
          ${item.color ? `<div><label>Colour</label><span>${esc(item.color)}</span></div>` : ''}
          ${item.brand ? `<div><label>Brand</label><span>${esc(item.brand)}</span></div>` : ''}
          ${item.department ? `<div><label>Department / Class</label><span>${esc(item.department)}</span></div>` : ''}
          <div><label>Reported</label><span>${esc(item.created_at)}</span></div>
        </div>

        <div class="loc-detail-box">
          <h3>&#127963; Campus Location</h3>
          <div class="loc-detail-grid">
            <div><label>Building / Block</label><span>${esc(item.building || '—')}</span></div>
            <div><label>Floor</label><span>${esc(item.floor || '—')}</span></div>
            <div><label>Area</label><span>${esc(item.area || '—')}</span></div>
            <div><label>Room / Lab No.</label><span>${esc(item.room || '—')}</span></div>
            ${item.locnote ? `<div style="grid-column:1/-1;"><label>Notes</label><span>${esc(item.locnote)}</span></div>` : ''}
          </div>
        </div>

        <div class="desc-block">
          <h3>Description</h3>
          <p>${esc(item.description)}</p>
        </div>
        <div class="contact-block">
          <h3>Contact</h3>
          <p><strong>Name:</strong> ${esc(item.contact_name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${esc(item.contact_email)}">${esc(item.contact_email)}</a></p>
          ${item.contact_phone ? `<p><strong>Phone:</strong> ${esc(item.contact_phone)}</p>` : ''}
          ${item.department ? `<p><strong>Dept / Class:</strong> ${esc(item.department)}</p>` : ''}
        </div>
        <div class="detail-actions">
          ${item.status === 'active' ? `<button class="btn btn-sm btn-green" onclick="resolveItem(${item.id})">&#10003; Mark Resolved</button>` : ''}
          <button class="btn btn-sm btn-outline" style="color:#c0392b;border-color:#c0392b;" onclick="deleteItem(${item.id})">Delete</button>
        </div>
      </div>
    </div>
    <div class="sidebar-panel">
      <h2>Matches (${matches.length})</h2>
      ${matches.length ? matches.map(m => {
        const pct = Math.round(m.score*100);
        const color = pct>=70 ? '#27ae60' : pct>=45 ? '#f39c12' : '#c0392b';
        return `
        <div style="border:1px solid #eee;border-radius:8px;padding:12px;margin-bottom:10px;">
          <div style="text-align:center;font-size:1.4rem;font-weight:800;color:${color};margin-bottom:8px;">${pct}%</div>
          <div style="font-size:.82rem;"><strong>Lost:</strong> ${esc(m.lost_title)}</div>
          <div style="font-size:.82rem;"><strong>Found:</strong> ${esc(m.found_title)}</div>
          <div style="font-size:.72rem;color:#aaa;margin-top:4px;">&#127963; ${esc(m.lost_loc)} &harr; ${esc(m.found_loc)}</div>
          <div style="font-size:.72rem;color:#aaa;margin-top:2px;">${m.status}</div>
        </div>`;
      }).join('') : '<div class="empty-msg" style="padding:24px 8px;">No matches found yet.</div>'}
    </div>
  </div>`;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('show'));
  document.getElementById('page-detail').classList.add('show');
  window.scrollTo(0, 0);
}

function resolveItem(id) {
  if (!confirm('Mark this item as resolved?')) return;
  const items = getItems();
  const item = items.find(i => i.id === id);
  if (item) item.status = 'resolved';
  saveItems(items);
  showDetail(id);
  toast('Item marked as resolved.');
}

function deleteItem(id) {
  if (!confirm('Delete this item permanently?')) return;
  const items = getItems().filter(i => i.id !== id);
  saveItems(items);
  const matches = getMatches().filter(m => m.lost_id !== id && m.found_id !== id);
  saveMatches(matches);
  toast('Item deleted.');
  go('browse');
}

/* ============================================================
   UTILS
   ============================================================ */
function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

/* ── Init ── */
refreshHome();
