
/*
 JEBY CASH | Interactive Transaction Ledger V1
 Educational simulation only.
*/
(function () {
  "use strict";

  if (window.JEBY_LEDGER_TABLE_V1) return;
  window.JEBY_LEDGER_TABLE_V1 = true;

  const $ = id => document.getElementById(id);
  const create = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const client = () => {
    try { return typeof db !== "undefined" ? db : null; }
    catch (_) { return null; }
  };

  const currentUser = () => {
    try { return typeof user !== "undefined" ? user : null; }
    catch (_) { return null; }
  };

  const getTransactions = () => {
    try {
      return typeof transactions !== "undefined"
        ? transactions : [];
    } catch (_) {
      return [];
    }
  };

  const css = create("style");
  css.textContent = `
    .jeby-ledger-toolbar {
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      margin:12px 0;
    }
    .jeby-ledger-search {
      flex:1;
      min-width:170px;
      padding:12px;
      border:1px solid #d8c8ce;
      border-radius:10px;
      font:14px Tahoma,Arial;
    }
    .jeby-ledger-scroll {
      width:100%;
      max-width:100%;
      overflow-x:auto;
      overflow-y:visible;
      -webkit-overflow-scrolling:touch;
      border:1px solid #e7dade;
      border-radius:12px;
    }
    .jeby-ledger-table {
      width:100%;
      min-width:830px;
      border-collapse:collapse;
      direction:rtl;
      font:13px Tahoma,Arial;
      color:#392c32;
    }
    .jeby-ledger-table th {
      background:#571d35;
      color:#fff;
      padding:13px 10px;
      white-space:nowrap;
      text-align:right;
    }
    .jeby-ledger-table td {
      padding:12px 10px;
      border-bottom:1px solid #eee5e8;
      vertical-align:middle;
    }
    .jeby-ledger-table tbody tr:nth-child(even) {
      background:#fbf7f8;
    }
    .jeby-ledger-table tbody tr {
      cursor:pointer;
    }
    .jeby-ledger-table tbody tr:hover {
      background:#fff3dc;
    }
    .jeby-ledger-party {
      max-width:185px;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .jeby-ledger-actions {
      display:flex;
      gap:5px;
      white-space:nowrap;
    }
    .jeby-ledger-action {
      border:1px solid #b58b42;
      background:#fffaf0;
      color:#571d35;
      border-radius:8px;
      padding:7px 9px;
      cursor:pointer;
      font:13px Tahoma,Arial;
    }
    .jeby-ledger-action:disabled {
      opacity:.55;
      cursor:wait;
    }
    .jeby-ledger-details {
      background:#fffaf2;
      padding:14px;
      border-top:1px solid #e6d8be;
    }
    .jeby-ledger-details p {
      margin:6px 0;
    }
    .jeby-ledger-hint {
      color:#73616a;
      font:12px Tahoma,Arial;
      margin:8px 0;
    }
  `;
  document.head.appendChild(css);

  let partyCache = new Map();
  let loadingParties = false;
  let rendering = false;
  let searchText = "";
  let expandedId = null;
  let classificationIds = new Set();

  function typeOf(t, uid) {
    if (t.kind === "transfer") {
      return t.from_user_id === uid
        ? "تحويل صادر" : "تحويل وارد";
    }
    if (t.kind === "admin_deposit") return "إيداع إداري";
    if (t.kind === "admin_withdrawal") return "سحب إداري";
    return t.kind || "عملية";
  }

  function partyId(t, uid) {
    if (t.kind !== "transfer") return null;
    return t.from_user_id === uid
      ? t.to_user_id : t.from_user_id;
  }

  function partyName(t, uid) {
    if (t.kind !== "transfer") return "إدارة المحفظة";
    const id = partyId(t, uid);
    const party = partyCache.get(id);
    if (!party) return "طرف العملية";
    return party.full_name ||
      (party.wallet_number
        ? "محفظة " + party.wallet_number
        : "طرف العملية");
  }

  function fmtDate(date) {
    return new Date(date).toLocaleDateString("ar-YE");
  }

  function fmtAmount(amount, currency) {
    return Number(amount || 0).toLocaleString("en-US") +
      " " + (currency || "");
  }

  function action(label, title, handler) {
    const button = create("button", label);
    button.type = "button";
    button.className = "jeby-ledger-action";
    button.title = title;
    button.setAttribute("aria-label", title);
    button.addEventListener("click", event => {
      event.stopPropagation();
      handler(button);
    });
    return button;
  }

  async function loadParties() {
    if (loadingParties) return;
    const d = client();
    const u = currentUser();
    if (!d || !u?.id) return;

    const tx = getTransactions();
    const ids = [...new Set(
      tx.map(t => partyId(t, u.id)).filter(Boolean)
    )].filter(id => !partyCache.has(id));

    if (!ids.length) return;
    loadingParties = true;

    try {
      const { data, error } = await d
        .from("jeby_profiles")
        .select("user_id,full_name,wallet_number")
        .in("user_id", ids);

      if (error) {
        console.warn("JEBY ledger parties:", error.message);
        return;
      }

      for (const profile of data || []) {
        partyCache.set(profile.user_id, profile);
      }
    } finally {
      loadingParties = false;
    }
  }

  async function loadClassifications() {
    const d = client();
    const u = currentUser();
    if (!d || !u?.id) return;

    const { data, error } = await d
      .from("jeby_account_classification")
      .select("transaction_id")
      .eq("user_id", u.id);

    if (error) {
      console.warn("JEBY ledger classifications:", error.message);
      return;
    }

    classificationIds = new Set(
      (data || []).map(row => Number(row.transaction_id))
    );
  }

  function openReceipt(t) {
    try {
      if (typeof receipt === "function") {
        receipt(t);
        return;
      }
    } catch (_) {}

    alert("تفاصيل العملية رقم " + t.id);
  }

  function showClassification(t) {
    const root = $("historyList");
    const row = root?.querySelector(
      '[data-jeby-tx="' + t.id + '"]'
    );

    if (!row) return;

    let button = row.querySelector(".jc-flexible-button");
    if (button) {
      button.click();
      return;
    }

    alert("استخدم خدمة تصنيف العملية بالدليل المحاسبي.");
  }

  async function removeClassification(t, button) {
    const d = client();
    const u = currentUser();
    if (!d || !u?.id) return;

    if (!confirm(
      "إزالة التصنيف المحاسبي للعملية رقم " + t.id +
      "؟\nلن تُحذف العملية المالية أو يتغير الرصيد."
    )) return;

    button.disabled = true;

    const { error } = await d.rpc(
      "jeby_chart_remove_classification",
      { p_transaction_id: t.id }
    );

    button.disabled = false;

    if (error) {
      alert("تعذرت إزالة التصنيف: " + error.message);
      return;
    }

    classificationIds.delete(Number(t.id));
    render();
    alert("تمت إزالة التصنيف، وبقيت العملية المالية محفوظة.");
  }

  function cell(row, text, className) {
    const td = create("td", text);
    if (className) td.className = className;
    row.appendChild(td);
    return td;
  }

  function detailsRow(t, uid) {
    const tr = create("tr");
    const td = create("td");
    td.colSpan = 6;

    const panel = create("div");
    panel.className = "jeby-ledger-details";

    const fields = [
      ["رقم العملية", "JEBY-" + t.id],
      ["التاريخ والوقت",
        new Date(t.created_at).toLocaleString("ar-YE")],
      ["نوع العملية", typeOf(t, uid)],
      ["المبلغ", fmtAmount(t.amount, t.currency)],
      ["الطرف المقابل", partyName(t, uid)],
      ["البيان", t.note || "—"]
    ];

    for (const [label, value] of fields) {
      const p = create("p", label + ": " + value);
      panel.appendChild(p);
    }

    const receiptButton = action(
      "🧾 عرض الإيصال",
      "عرض الإيصال الكامل",
      () => openReceipt(t)
    );

    panel.appendChild(receiptButton);
    td.appendChild(panel);
    tr.appendChild(td);
    return tr;
  }

  function render() {
    if (rendering) return;

    const root = $("historyList");
    const u = currentUser();
    if (!root || !u?.id) return;

    rendering = true;

    try {
      const all = getTransactions();
      const currency = $("historyCurrency")?.value || "";
      const kindFilter = $("historyType")?.value || "";

      const filtered = all.filter(t => {
        if (currency && t.currency !== currency) return false;

        if (kindFilter === "admin" && t.kind === "transfer")
          return false;

        if (kindFilter === "out" &&
            !(t.kind === "transfer" &&
              t.from_user_id === u.id)) return false;

        if (kindFilter === "in" &&
            !(t.kind === "transfer" &&
              t.to_user_id === u.id)) return false;

        const query = searchText.trim().toLowerCase();
        if (!query) return true;

        const searchable = [
          t.id,
          fmtDate(t.created_at),
          typeOf(t, u.id),
          t.amount,
          t.currency,
          partyName(t, u.id),
          t.note || ""
        ].join(" ").toLowerCase();

        return searchable.includes(query);
      });

      root.replaceChildren();

      const toolbar = create("div");
      toolbar.className = "jeby-ledger-toolbar";

      const search = create("input");
      search.type = "search";
      search.className = "jeby-ledger-search";
      search.placeholder = "بحث: رقم، تاريخ، مبلغ، مستفيد أو مرسل";
      search.value = searchText;

      search.addEventListener("input", () => {
        const start = search.selectionStart;
        searchText = search.value;
        render();
        const replacement =
          root.querySelector(".jeby-ledger-search");
        replacement?.focus();
        try {
          replacement?.setSelectionRange(start, start);
        } catch (_) {}
      });

      toolbar.appendChild(search);
      root.appendChild(toolbar);

      const hint = create(
        "p",
        "↔ مرّر الكشف يمينًا ويسارًا لعرض بقية الأعمدة. " +
        "اضغط على أي عملية لإظهار تفاصيلها."
      );
      hint.className = "jeby-ledger-hint";
      root.appendChild(hint);

      const scroll = create("div");
      scroll.className = "jeby-ledger-scroll";

      const table = create("table");
      table.className = "jeby-ledger-table";

      const head = create("thead");
      const hr = create("tr");

      for (const label of [
        "رقم العملية",
        "التاريخ",
        "نوع العملية",
        "المبلغ",
        "الطرف المقابل",
        "الإجراءات"
      ]) {
        const th = create("th", label);
        hr.appendChild(th);
      }

      head.appendChild(hr);
      table.appendChild(head);

      const body = create("tbody");

      for (const t of filtered) {
        const tr = create("tr");
        tr.dataset.jebyTx = String(t.id);

        cell(tr, String(t.id));
        cell(tr, fmtDate(t.created_at));
        cell(tr, typeOf(t, u.id));
        cell(tr, fmtAmount(t.amount, t.currency));
        cell(tr, partyName(t, u.id), "jeby-ledger-party");

        const actions = create("td");
        const group = create("div");
        group.className = "jeby-ledger-actions";

        group.appendChild(action(
          "👁️",
          "عرض تفاصيل العملية",
          () => {
            expandedId = expandedId === t.id ? null : t.id;
            render();
          }
        ));

        group.appendChild(action(
          "📚",
          "تصنيف العملية أو تعديل تصنيفها",
          () => showClassification(t)
        ));

        if (classificationIds.has(Number(t.id))) {
          group.appendChild(action(
            "🗑️",
            "إزالة التصنيف المحاسبي فقط",
            button => removeClassification(t, button)
          ));
        }

        actions.appendChild(group);
        tr.appendChild(actions);

        tr.addEventListener("click", () => {
          expandedId = expandedId === t.id ? null : t.id;
          render();
        });

        body.appendChild(tr);

        if (expandedId === t.id) {
          body.appendChild(detailsRow(t, u.id));
        }
      }

      if (!filtered.length) {
        const empty = create("tr");
        const td = create("td", "لا توجد عمليات مطابقة");
        td.colSpan = 6;
        empty.appendChild(td);
        body.appendChild(empty);
      }

      table.appendChild(body);
      scroll.appendChild(table);
      root.appendChild(scroll);

    } finally {
      rendering = false;
    }
  }

  let scheduled = false;

  function scheduleRender() {
    if (scheduled || rendering) return;

    scheduled = true;

    setTimeout(async () => {
      scheduled = false;
      await loadParties();
      await loadClassifications();
      render();
    }, 150);
  }

  function start() {
    const root = $("historyList");
    if (!root) return;

    const observer = new MutationObserver(() => {
      if (rendering) return;

      if (root.querySelector(".tx")) {
        scheduleRender();
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true
    });

    $("historyCurrency")?.addEventListener(
      "change", scheduleRender
    );

    $("historyType")?.addEventListener(
      "change", scheduleRender
    );

    $("reloadHistory")?.addEventListener(
      "click", () => setTimeout(scheduleRender, 800)
    );

    scheduleRender();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded", start, { once: true }
    );
  } else {
    start();
  }
})();
