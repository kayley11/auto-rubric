let dataset;
let visibleRows = [];
let selectedId = null;
const byId = (id) => document.getElementById(id);
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const workspace = byId('workspace');
const signInDialog = byId('workspace-signin');

function updateHeight() {
  document.documentElement.style.setProperty('--header-height', `${document.querySelector('.page-header').offsetHeight}px`);
}
new ResizeObserver(updateHeight).observe(document.querySelector('.page-header'));

function historyMarkup(history, row) {
  const heading = `<h3 class="history-heading">${escapeHTML(history.name)}<span class="alias">${escapeHTML(history.alias)}</span></h3>`;
  const context = `${row.original_mode === 'written-record' ? 'Earlier written answer' : 'Earlier interview answer'}${history.answer_date ? ` · ${history.answer_date}` : ''}`;
  if (!history.complete_count) {
    return `<section class="history-model">${heading}<p class="history-context">${escapeHTML(context)}</p><div class="missing">${history.answer_status === 'complete' ? 'No completed item ratings saved.' : history.answer_status === 'interviewing' ? 'Partial interview saved; no final answer or item ratings.' : 'No completed historical answer or item ratings saved.'}</div></section>`;
  }
  const items = history.items.filter((item) => item.status === 'complete').map((item) => `<li><span class="item-code">${escapeHTML(item.id)}</span><span class="item-name">${escapeHTML(item.name)}</span><span class="score ${typeof item.score === 'number' && item.score <= 2 ? 'low' : ''}">${escapeHTML(item.label ?? item.score)}</span></li>`).join('');
  const missing = history.items.filter((item) => item.status !== 'complete').map((item) => item.id);
  const pending = missing.length ? `<p class="pending-note">Pending: ${escapeHTML(missing.join(', '))}.</p>` : '';
  const highlight = history.highlight ? `<p class="judge-label">JUDGE EXCERPT · ${escapeHTML(history.highlight.item)}</p><blockquote class="judge-excerpt">“${escapeHTML(history.highlight.text)}”</blockquote>` : '';
  return `<section class="history-model">${heading}<p class="history-context">${escapeHTML(context)}</p><ul class="item-list">${items}</ul>${pending}${highlight}</section>`;
}

function renderRows(query = '') {
  const term = query.trim().toLocaleLowerCase();
  visibleRows = dataset.rows.filter((row) => `${row.id} ${row.title}`.toLocaleLowerCase().includes(term));
  byId('results-body').innerHTML = visibleRows.length ? visibleRows.map((row) => `<tr data-case="${escapeHTML(row.id)}"><th scope="row"><button class="case-button" data-select="${escapeHTML(row.id)}" title="${escapeHTML(row.title)}" aria-label="Read case ${escapeHTML(row.id)}: ${escapeHTML(row.title)}">${escapeHTML(row.id)}</button></th><td class="rubric-cell">${row.original_mode !== 'written-record' ? '<span class="mode-note">Interview → written in zero-shot run</span>' : ''}${row.history.map((history) => historyMarkup(history, row)).join('')}</td><td><div class="answer-text">${escapeHTML(row.zero_shot.glm53)}</div></td><td><div class="answer-text">${escapeHTML(row.zero_shot.qwen3827b)}</div></td></tr>`).join('') : '<tr><td colspan="4" class="empty-state">No matching case. Try a case number such as C02 or B04.</td></tr>';
  byId('case-count').textContent = `${visibleRows.length} of ${dataset.rows.length} cases`;
  if (visibleRows.length) {
    selectCase(visibleRows[0].id, false);
  } else {
    selectedId = null;
    byId('panel-code').textContent = '—';
    byId('panel-title').textContent = 'No matching case';
    for (const name of ['panel-audience','panel-condition','case-facts','case-task','panel-position']) byId(name).textContent = '';
    byId('copy-case').disabled = true;
    byId('previous-case').disabled = true;
    byId('next-case').disabled = true;
  }
  byId('table-scroll').scrollTop = 0;
}

function selectCase(id, openPanel = true) {
  const row = dataset.rows.find((value) => value.id === id);
  if (!row) return;
  selectedId = id;
  document.querySelectorAll('#results-body tr[data-case]').forEach((element) => {
    const selected = element.dataset.case === id;
    element.classList.toggle('selected', selected);
    element.querySelector('.case-button').setAttribute('aria-pressed', String(selected));
  });
  byId('panel-code').textContent = row.id;
  byId('panel-title').textContent = row.title;
  byId('panel-audience').textContent = `Audience: ${row.audience}`;
  byId('panel-condition').textContent = row.original_mode === 'written-record' ? 'The case facts and task match the earlier written condition.' : 'Earlier ratings use an interview. This zero-shot input supplies all selected facts together.';
  byId('case-facts').textContent = row.facts;
  byId('case-task').textContent = row.task;
  const position = visibleRows.findIndex((value) => value.id === id);
  byId('panel-position').textContent = `${position + 1} / ${visibleRows.length}`;
  byId('previous-case').disabled = position <= 0;
  byId('next-case').disabled = position < 0 || position >= visibleRows.length - 1;
  byId('copy-case').disabled = false;
  byId('copy-case').textContent = 'Copy case text';
  document.querySelector('.panel-scroll').scrollTop = 0;
  if (openPanel) setPanel(true);
}

function setPanel(open) {
  workspace.classList.toggle('panel-hidden', !open);
  byId('toggle-case').setAttribute('aria-expanded', String(open));
}

function moveCase(delta) {
  const index = visibleRows.findIndex((row) => row.id === selectedId) + delta;
  if (index < 0 || index >= visibleRows.length) return;
  selectCase(visibleRows[index].id);
  const element = document.querySelector(`tr[data-case="${selectedId}"]`);
  const scroller = byId('table-scroll');
  const header = document.querySelector('thead').getBoundingClientRect().height;
  scroller.scrollTop += element.getBoundingClientRect().top - scroller.getBoundingClientRect().top - header - 1;
}

function downloadTable() {
  const cells = (value) => `"${String(value).replaceAll('"','""')}"`;
  const header = ['Case number','With rubric — historical item ratings','GLM-5.3 — zero-shot answer','Qwen3.8 27B — zero-shot answer'];
  const rows = dataset.rows.map((row) => [row.id, row.history.map((h) => `${h.name} (${h.alias})\n${h.complete_count ? h.items.map((i) => `${i.id} ${i.name}: ${i.status === 'complete' ? i.label : 'Pending'}`).join('\n') : 'No completed historical item ratings saved.'}${h.highlight ? `\nJudge excerpt (${h.highlight.item}): ${h.highlight.text}` : ''}`).join('\n\n'),row.zero_shot.glm53,row.zero_shot.qwen3827b]);
  const text = '\ufeff' + [header,...rows].map((row) => row.map(cells).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([text], {type:'text/csv;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url; link.download = '78_cases_rubric_and_zero_shot.csv'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

byId('results-body').addEventListener('click', (event) => {
  const button = event.target.closest('[data-select]');
  if (button) selectCase(button.dataset.select);
});
byId('search').addEventListener('input', (event) => renderRows(event.target.value));
byId('toggle-case').addEventListener('click', () => setPanel(workspace.classList.contains('panel-hidden')));
byId('close-case').addEventListener('click', () => setPanel(false));
byId('previous-case').addEventListener('click', () => moveCase(-1));
byId('next-case').addEventListener('click', () => moveCase(1));
byId('download').addEventListener('click', downloadTable);
byId('signin-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  byId('signin-submit').disabled = true;
  byId('signin-error').textContent = '';
  try {
    const response = await fetch('/api/access/login', {
      method: 'POST', credentials: 'same-origin',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({id:byId('account-id').value,password:byId('access-password').value}),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Sign-in failed. Please check your account details.');
    byId('access-password').value = '';
    signInDialog.close();
    await start();
  } catch (error) {
    byId('signin-error').textContent = error.message;
  } finally {
    byId('signin-submit').disabled = false;
  }
});
byId('sign-out').addEventListener('click', async () => {
  const response = await fetch('/api/access/logout', {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'});
  if (response.ok) window.location.reload();
});
byId('results-body').addEventListener('click', (event) => {
  if (event.target.closest('[data-retry]')) start();
});
byId('copy-case').addEventListener('click', async () => {
  if (!selectedId) return;
  const row = dataset.rows.find((item) => item.id === selectedId);
  try { await navigator.clipboard.writeText(row.facts); byId('copy-case').textContent = 'Copied'; }
  catch { byId('copy-case').textContent = 'Select text to copy'; }
});

async function start() {
  byId('case-count').textContent = 'Loading results…';
  byId('results-body').innerHTML = '<tr><td colspan="4" class="loading">Loading saved results…</td></tr>';
  try {
    const response = await fetch('/api/result-comparison', {credentials:'same-origin',cache:'no-store'});
    if ([401,403].includes(response.status)) {
      dataset = null;
      byId('results-body').innerHTML = '<tr><td colspan="4" class="loading">Sign in with your existing workspace account to view the results.</td></tr>';
      byId('case-count').textContent = 'Sign-in required';
      byId('search').disabled = true;
      byId('download').disabled = true;
      setPanel(false);
      if (!signInDialog.open) signInDialog.showModal();
      return;
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Saved results could not be loaded.');
    }
    dataset = await response.json();
    if (dataset.rows.length !== 78) throw new Error('The saved case list is incomplete.');
    renderRows();
    setPanel(window.innerWidth > 1050);
    byId('download').disabled = false;
    byId('search').disabled = false;
    byId('access-label').textContent = 'Workspace access';
    byId('sign-out').hidden = false;
    updateHeight();
  } catch (error) {
    byId('results-body').innerHTML = `<tr><td colspan="4" class="loading error-message">${escapeHTML(error.message)}<br><br><button class="button" data-retry>Retry connection</button></td></tr>`;
    byId('case-count').textContent = 'Not loaded';
  }
}
start();
