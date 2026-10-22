
/* JEBY CASH — Participant Financial Reports v1.0
   Educational simulation only. Read-only reporting. */
(function () {
  'use strict';
  if (window.JEBY_FINANCIAL_REPORTS_V1) return;
  window.JEBY_FINANCIAL_REPORTS_V1 = true;

  const byId = id => document.getElementById(id);
  const element = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const amount = value => Number(value || 0).toLocaleString('en-US');
  const safeDate = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('ar-YE');
  };
  const current = () => {
    try { return typeof user !== 'undefined' ? user : null; }
    catch (_) { return null; }
  };
  const client = () => {
    try { return typeof db !== 'undefined' ? db : null; }
    catch (_) { return null; }
  };
  const history = () => {
    try { return typeof transactions !== 'undefined' && Array.isArray(transactions) ? transactions : []; }
    catch (_) { return []; }
  };
  const state = { parties: new Map(), query: '', direction: '', currency: '', loading: false, lastKey: '', shown: [] };

  function txDirection(tx, uid) {
    if (tx.kind === 'transfer') {
      return tx.from_user_id === uid ? 'صادر' : 'وارد';
    }
    return 'إداري';
  }
  function txName(tx, uid) {
    if (tx.kind === 'transfer') return txDirection(tx, uid) === 'صادر' ? 'تحويل صادر' : 'تحويل وارد';
    if (tx.kind === 'admin_deposit') return 'إيداع إداري';
    if (tx.kind === 'admin_withdrawal') return 'سحب إداري';
    return tx.kind || 'عملية أخرى';
  }
  function label(name, wallet) {
    return (name || 'غير متاح') + ' — محفظة ' + (wallet ?? 'غير متاح');
  }
  function partiesFor(tx) {
    return state.parties.get(Number(tx.id));
  }
  function counterpart(tx, uid) {
    if (tx.kind !== 'transfer') return '—';
    const p = partiesFor(tx);
    if (!p) return 'بيانات الطرف غير متاحة';
    return tx.from_user_id === uid
      ? label(p.recipient_name, p.recipient_wallet)
      : label(p.sender_name, p.sender_wallet);
  }
  function filterRows() {
    const uid = current()?.id;
    const needle = state.query.trim().toLocaleLowerCase();
    return history().filter(tx => {
      if (state.currency && tx.currency !== state.currency) return false;
      if (state.direction && txDirection(tx, uid) !== state.direction) return false;
      if (!needle) return true;
      const p = partiesFor(tx);
      const text = [tx.id, 'JEBY-' + tx.id, txName(tx, uid), tx.currency,
        tx.note, p?.sender_name, p?.sender_wallet, p?.recipient_name,
        p?.recipient_wallet, counterpart(tx, uid)].join(' ').toLocaleLowerCase();
      return text.includes(needle);
    });
  }
  function totals(rows) {
    const groups = new Map();
    for (const tx of rows) {
      const currency = tx.currency || '—';
      if (!groups.has(currency)) groups.set(currency, { incoming: 0, outgoing: 0, administrative: 0, count: 0 });
      const group = groups.get(currency);
      group.count++;
      const direction = txDirection(tx, current()?.id);
      if (direction === 'صادر') group.outgoing += Number(tx.sender_debit ?? tx.amount ?? 0);
      else if (direction === 'وارد') group.incoming += Number(tx.recipient_amount ?? tx.amount ?? 0);
      else group.administrative += Number(tx.amount || 0);
    }
    return groups;
  }
  function appendCell(row, text, header) {
    const cell = element(header ? 'th' : 'td', String(text ?? '—'));
    cell.style.cssText = 'padding:9px;border-bottom:1px solid #eadfe2;text-align:right;white-space:normal;min-width:85px';
    row.appendChild(cell);
  }
  function render() {
    const body = byId('jeby-report-rows');
    const summary = byId('jeby-report-summary');
    const status = byId('jeby-report-status');
    if (!body || !summary || !status) return;
    const uid = current()?.id;
    const rows = filterRows();
    state.shown = rows;
    body.replaceChildren();
    summary.replaceChildren();
    status.textContent = 'النتائج: ' + rows.length + ' عملية من أصل ' + history().length + ' عملية محمّلة (بحد أقصى 100 عملية).';
    for (const [currency, group] of totals(rows)) {
      const card = element('div');
      card.style.cssText = 'border:1px solid #e8d9dd;border-radius:10px;padding:10px;background:#fff;min-width:180px;flex:1';
      const title = element('strong', currency + ' — ' + group.count + ' عملية');
      const text = element('div', 'الوارد: ' + amount(group.incoming) + '\nالصادر: ' + amount(group.outgoing) + '\nالإداري (إجمالي غير صافٍ): ' + amount(group.administrative));
      text.style.whiteSpace = 'pre-line';
      card.append(title, text);
      summary.appendChild(card);
    }
    if (!rows.length) {
      const row = element('tr');
      const cell = element('td', 'لا توجد عمليات مطابقة للبحث.');
      cell.colSpan = 9;
      cell.style.padding = '15px';
      row.appendChild(cell);
      body.appendChild(row);
      return;
    }
    for (const tx of rows) {
      const row = element('tr');
      const p = partiesFor(tx);
      const sender = tx.kind === 'transfer' ? (p ? label(p.sender_name, p.sender_wallet) : 'غير متاح') : '—';
      const recipient = tx.kind === 'transfer' ? (p ? label(p.recipient_name, p.recipient_wallet) : 'غير متاح') : '—';
      [ 'JEBY-' + tx.id, safeDate(tx.created_at), txName(tx, uid),
        amount(tx.amount), tx.currency || '—', sender, recipient,
        counterpart(tx, uid), tx.note || '—' ].forEach(value => appendCell(row, value));
      body.appendChild(row);
    }
  }
  function csvValue(value) {
    const raw = String(value ?? '');
    const safe = /^[\s]*[=+@\-\t\r]/.test(raw) ? "'" + raw : raw;
    return '"' + safe.replace(/"/g, '""') + '"';
  }
  function exportCsv() {
    const uid = current()?.id;
    const headers = ['المرجع', 'التاريخ', 'النوع', 'المبلغ', 'العملة', 'المرسل', 'رقم محفظة المرسل', 'المستفيد', 'رقم محفظة المستفيد', 'الطرف المقابل', 'ملاحظات'];
    const lines = [headers];
    for (const tx of state.shown) {
      const p = partiesFor(tx);
      lines.push(['JEBY-' + tx.id, tx.created_at || '', txName(tx, uid), tx.amount || 0,
        tx.currency || '', p?.sender_name || '', p?.sender_wallet ?? '', p?.recipient_name || '',
        p?.recipient_wallet ?? '', counterpart(tx, uid), tx.note || '']);
    }
    const csv = '\uFEFF' + lines.map(line => line.map(csvValue).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = element('a');
    a.href = url;
    a.download = 'jeby-cash-report-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function refreshParties() {
    const dbClient = client();
    const uid = current()?.id;
    if (!dbClient || !uid || state.loading) return;
    const transfers = history().filter(tx => tx.kind === 'transfer');
    const key = uid + ':' + transfers.map(tx => tx.id).join(',');
    if (key === state.lastKey) { render(); return; }
    state.loading = true;
    byId('jeby-report-status').textContent = 'جارٍ تحميل بيانات الأطراف...';
    try {
      const ids = transfers.map(tx => Number(tx.id)).filter(Number.isSafeInteger);
      const next = new Map();
      if (ids.length) {
        const { data, error } = await dbClient.rpc('jeby_get_transaction_parties', { p_transaction_ids: ids });
        if (error) throw error;
        for (const party of data || []) next.set(Number(party.transaction_id), party);
      }
      if (current()?.id !== uid) return;
      state.parties = next;
      state.lastKey = key;
    } catch (error) {
      console.warn('JEBY financial report parties:', error?.message || error);
      byId('jeby-report-status').textContent = 'تعذر استرجاع بعض بيانات الأطراف. حاول تحديث التقرير.';
    } finally {
      state.loading = false;
      render();
    }
  }
  function build() {
    const view = byId('reportsView');
    if (!view || byId('jeby-financial-report')) return;
    const section = element('section');
    section.id = 'jeby-financial-report';
    section.dir = 'rtl';
    section.style.cssText = 'margin-top:22px;padding:14px;border:1px solid #e4d5d9;border-radius:13px;background:#fcfafb;color:#571d35';
    const heading = element('h3', 'التقرير المالي التفصيلي');
    const note = element('p', 'تقرير تدريبي للعمليات المحمّلة في السجل، مع بيانات الأطراف المتاحة للمشترك فقط. الإجماليات لكل عملة على حدة، ولا تمثل كشف حساب شاملًا أو رصيدًا نهائيًا.');
    note.style.cssText = 'font-size:12px;line-height:1.8';
    const controls = element('div');
    controls.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:12px 0';
    const search = element('input');
    search.placeholder = 'بحث: رقم العملية، الاسم، رقم المحفظة';
    search.setAttribute('aria-label', 'بحث في التقرير المالي');
    search.style.cssText = 'flex:2;min-width:170px;padding:10px';
    search.addEventListener('input', () => { state.query = search.value; render(); });
    const direction = element('select');
    [['', 'كل الاتجاهات'], ['صادر', 'صادرة'], ['وارد', 'واردة'], ['إداري', 'إدارية']].forEach(([value, text]) => {
      const option = element('option', text); option.value = value; direction.appendChild(option);
    });
    direction.addEventListener('change', () => { state.direction = direction.value; render(); });
    const currency = element('select');
    [['', 'كل العملات'], ['YER', 'YER'], ['SAR', 'SAR'], ['USD', 'USD']].forEach(([value, text]) => {
      const option = element('option', text); option.value = value; currency.appendChild(option);
    });
    currency.addEventListener('change', () => { state.currency = currency.value; render(); });
    const reload = element('button', 'تحديث التقرير');
    reload.type = 'button';
    reload.addEventListener('click', () => { state.lastKey = ''; refreshParties(); });
    const exportButton = element('button', 'تصدير CSV / Excel');
    exportButton.type = 'button';
    exportButton.addEventListener('click', exportCsv);
    controls.append(search, direction, currency, reload, exportButton);
    const status = element('p', 'جارٍ التحميل...'); status.id = 'jeby-report-status';
    status.style.fontSize = '12px';
    const summary = element('div'); summary.id = 'jeby-report-summary';
    summary.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin:12px 0';
    const wrap = element('div'); wrap.style.cssText = 'overflow-x:auto;max-width:100%';
    const table = element('table'); table.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px;min-width:980px';
    const thead = element('thead'); const header = element('tr');
    ['المرجع', 'التاريخ', 'النوع', 'المبلغ', 'العملة', 'المرسل', 'المستفيد', 'الطرف المقابل', 'ملاحظات'].forEach(text => appendCell(header, text, true));
    thead.appendChild(header);
    const tbody = element('tbody'); tbody.id = 'jeby-report-rows';
    table.append(thead, tbody); wrap.appendChild(table);
    section.append(heading, note, controls, status, summary, wrap);
    view.appendChild(section);
    render();
    refreshParties();
    const historyList = byId('historyList');
    if (historyList) {
      let queued = false;
      new MutationObserver(() => {
        if (queued) return;
        queued = true;
        setTimeout(() => { queued = false; refreshParties(); }, 300);
      }).observe(historyList, { childList: true });
    }
    document.querySelectorAll('[data-tab="reports"]').forEach(tab => {
      tab.addEventListener('click', () => setTimeout(refreshParties, 500));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build, { once: true });
  else build();
})();
