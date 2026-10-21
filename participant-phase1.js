
/*
 JEBY CASH — Participant Dashboard V7
 Secure Wallet Name Lookup + Payroll Statement
 EDUCATIONAL SIMULATION ONLY
*/

(function () {
  "use strict";

  const $ = id => document.getElementById(id);

  function el(tag, cls = "", text = "") {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== "") e.textContent = text;
    return e;
  }

  function styles() {
    if ($("jc-v7-css")) return;

    const style = el("style");
    style.id = "jc-v7-css";
    style.textContent = `
      #serviceGrid,.jc-grid {
        display:grid!important;
        grid-template-columns:repeat(4,minmax(0,1fr))!important;
        gap:7px!important;
      }
      #serviceGrid .service,.jc-tile {
        width:100%;
        min-width:0;
        min-height:76px;
        padding:8px 3px!important;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:5px;
        border:1px solid #eee3df!important;
        border-radius:11px!important;
        background:#fcf9f7!important;
        color:#571d35!important;
        font:500 10px/1.5 Tahoma,Arial,sans-serif!important;
        text-align:center;
        overflow-wrap:anywhere;
      }
      .jc-icon{font-size:22px}
      .jc-label{font-size:10px;line-height:1.5}
      .jc-section{padding:14px 12px;margin-bottom:13px}
      .jc-section h2{font-size:16px;margin:0 0 7px}
      .jc-desc{font-size:11px;color:#80737a;margin:0 0 12px}
      .jc-hidden{display:none!important}
      .jc-overlay {
        position:fixed;
        inset:0;
        z-index:1000;
        background:#000a;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:9px;
      }
      .jc-modal {
        width:100%;
        max-width:720px;
        max-height:95vh;
        overflow:auto;
        background:#fff;
        border-radius:16px;
        padding:15px;
        color:#342a30;
      }
      .jc-modal h2{font-size:18px;margin:0 0 7px}
      .jc-modal label {
        display:block;
        font-size:12px;
        margin:8px 0 5px;
      }
      .jc-modal input,.jc-modal select {
        width:100%;
        min-width:0;
        padding:9px 7px;
        font-size:12px;
        border-radius:9px;
      }
      .jc-formrow {
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:9px;
      }
      .jc-tablewrap {
        overflow-x:auto;
        margin-top:12px;
        border:1px solid #e9dedf;
        border-radius:11px;
      }
      .jc-table {
        width:100%;
        min-width:320px;
        border-collapse:collapse;
        table-layout:fixed;
        font-size:11px;
      }
      .jc-table th {
        background:#571d35;
        color:white;
        padding:9px 4px;
        text-align:center;
      }
      .jc-table td {
        padding:7px 4px;
        border-bottom:1px solid #eee;
        vertical-align:middle;
      }
      .jc-table td input {
        padding:8px 4px;
        font-size:11px;
      }
      .jc-table th:first-child{width:31%}
      .jc-table th:nth-child(2){width:38%}
      .jc-table th:nth-child(3){width:23%}
      .jc-table th:last-child{width:8%}
      .jc-owner {
        font-size:11px;
        line-height:1.6;
        overflow-wrap:anywhere;
      }
      .jc-ok{color:#18734b}
      .jc-bad{color:#b22a39}
      .jc-pending{color:#86682b}
      .jc-remove {
        background:#f9e7e7;
        color:#8b2635;
        padding:5px 4px;
        border-radius:7px;
        font-size:12px;
      }
      .jc-summary {
        background:#faf4ea;
        border:1px solid #e7d3b3;
        border-radius:11px;
        padding:11px;
        margin-top:12px;
        font-size:12px;
        line-height:2;
      }
      .jc-words{font-weight:bold;line-height:1.9}
      .jc-actions{display:flex;gap:8px;margin-top:12px}
      .jc-actions button {
        flex:1;
        padding:11px 5px;
        font-size:12px;
      }
      .jc-muted {
        color:#76676f;
        font-size:12px;
        line-height:1.8;
      }
      .jc-error {
        margin-top:10px;
        padding:10px;
        background:#fff0f0;
        color:#962735;
        border:1px solid #efc8ce;
        border-radius:9px;
        font-size:12px;
        line-height:1.9;
      }
      .jc-pill {
        display:inline-block;
        padding:4px 8px;
        border-radius:7px;
        background:#f5ece7;
        color:#571d35;
        font-size:11px;
      }
      @media(max-width:340px) {
        #serviceGrid,.jc-grid {
          grid-template-columns:repeat(3,minmax(0,1fr))!important;
        }
      }
    `;
    document.head.append(style);
  }

  function tile(icon, title, action) {
    const b = el("button", "jc-tile");
    b.type = "button";
    b.append(
      el("span", "jc-icon", icon),
      el("span", "jc-label", title)
    );
    b.onclick = action;
    return b;
  }

  function section(id, title, description) {
    const box = el("section", "card jc-section");
    box.id = id;
    box.append(
      el("h2", "", title),
      el("p", "jc-desc", description)
    );
    const grid = el("div", "jc-grid");
    box.append(grid);
    return { box, grid };
  }

  function findButton(parent, name) {
    if (!parent) return null;
    return [...parent.querySelectorAll("button")]
      .find(b => b.textContent.includes(name)) || null;
  }

  function originalService(name) {
    const b = findButton($("serviceGrid"), name);
    if (b) b.click();
  }

  function tab(name) {
    document.querySelector(
      '[data-tab="' + name + '"]'
    )?.click();
  }

  function info(title, text) {
    const back = el("div", "jc-overlay");
    const panel = el("div", "jc-modal");
    const close = el("button", "full", "إغلاق");
    close.onclick = () => back.remove();

    panel.append(
      el("h2", "", title),
      el("p", "jc-muted", text),
      close
    );
    back.append(panel);
    document.body.append(back);
  }

  const TYPES = {
    salary: "صرف راتب",
    advance: "صرف سلفة",
    bonus: "صرف مكافأة",
    gratuity: "صرف إكرامية"
  };

  const CURRENCIES = {
    YER: "ريال يمني",
    SAR: "ريال سعودي",
    USD: "دولار أمريكي"
  };

  const ONES = [
    "", "واحد", "اثنان", "ثلاثة", "أربعة",
    "خمسة", "ستة", "سبعة", "ثمانية", "تسعة",
    "عشرة", "أحد عشر", "اثنا عشر",
    "ثلاثة عشر", "أربعة عشر", "خمسة عشر",
    "ستة عشر", "سبعة عشر", "ثمانية عشر",
    "تسعة عشر"
  ];

  const TENS = [
    "", "", "عشرون", "ثلاثون", "أربعون",
    "خمسون", "ستون", "سبعون", "ثمانون",
    "تسعون"
  ];

  const HUNDREDS = [
    "", "مائة", "مائتان", "ثلاثمائة",
    "أربعمائة", "خمسمائة", "ستمائة",
    "سبعمائة", "سبعمائة", "ثمانمائة",
    "تسعمائة"
  ];

  // تصحيح قيم المئات
  HUNDREDS[7] = "سبعمائة";
  HUNDREDS[8] = "ثمانمائة";
  HUNDREDS[9] = "تسعمائة";

  function underThousand(n) {
    const parts = [];
    const h = Math.floor(n / 100);
    const r = n % 100;

    if (h) parts.push(HUNDREDS[h]);

    if (r < 20) {
      if (r) parts.push(ONES[r]);
    } else {
      const u = r % 10;
      const t = Math.floor(r / 10);
      if (u) parts.push(ONES[u]);
      parts.push(TENS[t]);
    }

    return parts.join(" و");
  }

  function scaleText(n, singular, dual, plural) {
    if (n === 1) return singular;
    if (n === 2) return dual;
    if (n >= 3 && n <= 10) {
      return underThousand(n) + " " + plural;
    }
    return underThousand(n) + " " + singular;
  }

  function integerWords(n) {
    if (!Number.isSafeInteger(n) || n < 0) {
      return "المبلغ خارج نطاق التحويل الكتابي";
    }
    if (n === 0) return "صفر";

    const scales = [
      null,
      ["ألف", "ألفان", "آلاف"],
      ["مليون", "مليونان", "ملايين"],
      ["مليار", "ملياران", "مليارات"],
      ["تريليون", "تريليونان", "تريليونات"]
    ];

    const parts = [];
    let level = 0;

    while (n > 0) {
      const part = n % 1000;

      if (part) {
        if (level === 0) {
          parts.unshift(underThousand(part));
        } else if (scales[level]) {
          parts.unshift(
            scaleText(part, ...scales[level])
          );
        } else {
          return "المبلغ خارج نطاق التحويل الكتابي";
        }
      }

      n = Math.floor(n / 1000);
      level++;
    }

    return parts.join(" و");
  }

  function amountWords(cents, currency) {
    const whole = Math.floor(cents / 100);
    const fraction = cents % 100;

    let text = integerWords(whole) +
      " " + CURRENCIES[currency];

    if (fraction) {
      text += " و" + integerWords(fraction) +
        " جزءًا من مائة";
    }

    return text + " فقط لا غير";
  }

  function parseCents(raw) {
    const value = String(raw).trim();

    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
      return null;
    }

    const [whole, fraction = ""] = value.split(".");

    const cents =
      Number(whole) * 100 +
      Number(fraction.padEnd(2, "0"));

    if (!Number.isSafeInteger(cents) || cents <= 0) {
      return null;
    }

    return cents;
  }

  function money(cents) {
    return (cents / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function field(parent, label, type, options) {
    const wrap = el("div");
    const lab = el("label", "", label);
    const input = el(
      type === "select" ? "select" : "input"
    );

    if (type === "select") {
      options.forEach(([value, name]) => {
        const opt = el("option", "", name);
        opt.value = value;
        input.append(opt);
      });
    } else {
      input.type = type;
    }

    wrap.append(lab, input);
    parent.append(wrap);
    return input;
  }

  function payroll() {
    if ($("jc-payroll-v7")) return;

    const overlay = el("div", "jc-overlay");
    overlay.id = "jc-payroll-v7";

    const panel = el("div", "jc-modal");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");

    const header = el("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";

    const close = el(
      "button",
      "jc-remove",
      "إغلاق ✕"
    );
    close.type = "button";
    close.onclick = () => overlay.remove();

    header.append(
      el("h2", "", "👥 رواتب وحوافز الموظفين"),
      close
    );
    panel.append(header);

    panel.append(
      el(
        "p",
        "jc-muted",
        "كشف صرف تدريبي. يتم التحقق من أسماء " +
        "المستفيدين عبر خدمة آمنة في Supabase."
      )
    );

    const controls = el("div", "jc-formrow");

    const kind = field(
      controls,
      "نوع الصرف",
      "select",
      Object.entries(TYPES)
    );

    const mode = field(
      controls,
      "طريقة الصرف",
      "select",
      [
        ["single", "حساب واحد"],
        ["multiple", "حسابات متعددة"]
      ]
    );

    panel.append(controls);

    const secondary = el("div", "jc-formrow");

    const currency = field(
      secondary,
      "العملة",
      "select",
      Object.entries(CURRENCIES)
    );

    const period = field(
      secondary,
      "الفترة / المرجع",
      "text"
    );
    period.placeholder = "مثال: أكتوبر 2026";

    panel.append(secondary);

    const reference = el(
      "p",
      "jc-pill",
      "رقم العملية: يُنشأ عند التنفيذ الفعلي"
    );
    reference.style.marginTop = "12px";
    panel.append(reference);

    const tableWrap = el("div", "jc-tablewrap");
    const table = el("table", "jc-table");
    const thead = el("thead");
    const headerRow = el("tr");

    [
      "رقم المحفظة",
      "اسم صاحب المحفظة",
      "المبلغ",
      ""
    ].forEach(name => {
      headerRow.append(el("th", "", name));
    });

    thead.append(headerRow);
    table.append(thead);

    const tbody = el("tbody");
    table.append(tbody);
    tableWrap.append(table);
    panel.append(tableWrap);

    const add = el(
      "button",
      "light full",
      "＋ إضافة مستفيد إلى الكشف"
    );
    add.type = "button";
    panel.append(add);

    const summary = el("div", "jc-summary");
    panel.append(summary);

    const errors = el("div");
    errors.setAttribute("role", "alert");
    panel.append(errors);

    const actions = el("div", "jc-actions");

    const review = el(
      "button",
      "",
      "مراجعة الكشف"
    );
    review.type = "button";

    const execute = el(
      "button",
      "gold",
      "اعتماد وصرف الكشف"
    );
    execute.type = "button";
    execute.disabled = true;

    actions.append(review, execute);
    panel.append(actions);

    panel.append(
      el(
        "p",
        "jc-muted",
        "تنبيه: تنفيذ الصرف غير مفعّل حاليًا. " +
        "لن يُخصم أي مبلغ من المحافظ."
      )
    );

    const rows = [];

    function currentDB() {
      return typeof db !== "undefined"
        ? db
        : null;
    }

    // التحقق الآمن من اسم صاحب المحفظة
    async function lookup(item) {
      const wallet = item.wallet.value.trim();

      item.lookupSequence++;
      const ticket = item.lookupSequence;

      item.verified = false;
      item.owner = "";
      item.checkedWallet = "";

      if (!wallet) {
        item.name.textContent = "أدخل رقم المحفظة";
        item.name.className = "jc-owner jc-pending";
        return;
      }

      if (
        !/^\d{6,15}$/.test(wallet) ||
        !Number.isSafeInteger(Number(wallet))
      ) {
        item.name.textContent = "رقم المحفظة غير صحيح";
        item.name.className = "jc-owner jc-bad";
        return;
      }

      const client = currentDB();

      if (!client) {
        item.name.textContent = "الاتصال غير متاح";
        item.name.className = "jc-owner jc-bad";
        return;
      }

      item.name.textContent = "جارٍ التحقق...";
      item.name.className = "jc-owner jc-pending";

      try {
        const { data: results, error } = await client
          .rpc("jeby_lookup_wallet_name", {
            p_wallet_number: Number(wallet)
          });

        if (
          ticket !== item.lookupSequence ||
          item.wallet.value.trim() !== wallet ||
          !rows.includes(item)
        ) return;

        if (error) {
          const msg = String(error.message || "");

          if (
            msg.includes("limit reached")
          ) {
            item.name.textContent =
              "تجاوزت حد التحقق المسموح لهذه الساعة";
          } else if (
            msg.includes("Authentication required")
          ) {
            item.name.textContent =
              "يرجى تسجيل الدخول مجددًا";
          } else {
            item.name.textContent =
              "تعذر التحقق من الاسم";
          }

          item.name.className = "jc-owner jc-bad";
          return;
        }

        const data = Array.isArray(results)
          ? results[0]
          : null;

        if (!data || !data.full_name) {
          item.name.textContent =
            "محفظة غير موجودة";
          item.name.className = "jc-owner jc-bad";
          return;
        }

        item.verified = true;
        item.owner = data.full_name;
        item.checkedWallet = wallet;
        item.name.textContent = data.full_name;
        item.name.className = "jc-owner jc-ok";

      } catch (e) {
        if (ticket !== item.lookupSequence) return;

        item.name.textContent = "فشل الاتصال";
        item.name.className = "jc-owner jc-bad";
      }
    }

    function addRow() {
      if (rows.length >= 100) {
        info(
          "الحد الأقصى",
          "الحد الأقصى للكشف 100 مستفيد."
        );
        return;
      }

      const tr = el("tr");

      const walletCell = el("td");
      const nameCell = el("td");
      const amountCell = el("td");
      const removeCell = el("td");

      const wallet = el("input");
      wallet.type = "text";
      wallet.placeholder = "رقم المحفظة";
      wallet.autocomplete = "off";

      const name = el(
        "div",
        "jc-owner jc-pending",
        "بانتظار رقم المحفظة"
      );

      const amount = el("input");
      amount.type = "text";
      amount.inputMode = "decimal";
      amount.placeholder = "0.00";

      const remove = el(
        "button",
        "jc-remove",
        "×"
      );
      remove.type = "button";

      walletCell.append(wallet);
      nameCell.append(name);
      amountCell.append(amount);
      removeCell.append(remove);

      tr.append(
        walletCell,
        nameCell,
        amountCell,
        removeCell
      );

      tbody.append(tr);

      const item = {
        tr,
        wallet,
        name,
        amount,
        verified: false,
        owner: "",
        checkedWallet: "",
        lookupSequence: 0
      };

      rows.push(item);

      let debounce;

      wallet.addEventListener("input", () => {
        clearTimeout(debounce);

        item.lookupSequence++;
        item.verified = false;
        item.checkedWallet = "";
        item.owner = "";

        item.name.textContent = "بانتظار التحقق";
        item.name.className = "jc-owner jc-pending";

        debounce = setTimeout(() => {
          lookup(item);
        }, 600);

        update();
      });

      wallet.addEventListener("blur", () => {
        clearTimeout(debounce);

        if (
          wallet.value.trim() &&
          item.checkedWallet !== wallet.value.trim()
        ) {
          lookup(item);
        }
      });

      amount.addEventListener("input", update);

      remove.onclick = () => {
        if (rows.length === 1) return;

        item.lookupSequence++;

        const i = rows.indexOf(item);
        if (i >= 0) rows.splice(i, 1);

        tr.remove();
        update();
      };

      update();
    }

    function calculate() {
      let total = 0;
      let valid = true;

      rows.forEach(item => {
        const cents = parseCents(item.amount.value);

        if (
          item.amount.value.trim() &&
          cents === null
        ) {
          valid = false;
        }

        if (cents !== null) {
          total += cents;
        }
      });

      if (!Number.isSafeInteger(total)) {
        valid = false;
      }

      return { total, valid };
    }

    function update() {
      add.hidden = mode.value === "single";

      const { total, valid } = calculate();
      const count = rows.length;

      const words = valid
        ? amountWords(total, currency.value)
        : "راجع المبالغ المدخلة";

      summary.replaceChildren(
        el(
          "div",
          "",
          "نوع العملية: " + TYPES[kind.value]
        ),
        el(
          "div",
          "",
          "عدد المستفيدين: " + count
        ),
        el(
          "div",
          "",
          "إجمالي الكشف رقمًا: " +
          money(total) + " " + currency.value
        ),
        el(
          "div",
          "jc-words",
          "إجمالي الكشف كتابةً: " + words
        ),
        el(
          "div",
          "",
          "البيان: " + TYPES[kind.value] +
          " لعدد (" + count + ") مستفيد" +
          (period.value.trim()
            ? " — " + period.value.trim()
            : "")
        ),
        el(
          "div",
          "",
          "العمولات: تُحدد عند تفعيل الصرف"
        )
      );

      errors.replaceChildren();
    }

    function validate() {
      const issues = [];
      const seen = new Set();
      const result = calculate();

      if (!result.valid) {
        issues.push("يوجد مبلغ غير صحيح.");
      }

      rows.forEach((item, i) => {
        const n = i + 1;
        const wallet = item.wallet.value.trim();
        const cents = parseCents(item.amount.value);

        if (!wallet) {
          issues.push(
            "المستفيد " + n +
            ": رقم المحفظة مطلوب."
          );
        } else if (seen.has(wallet)) {
          issues.push(
            "المستفيد " + n +
            ": رقم المحفظة مكرر."
          );
        } else {
          seen.add(wallet);
        }

        if (
          !item.verified ||
          item.checkedWallet !== wallet
        ) {
          issues.push(
            "المستفيد " + n +
            ": لم يتم التحقق من اسم صاحب المحفظة."
          );
        }

        if (cents === null) {
          issues.push(
            "المستفيد " + n +
            ": أدخل مبلغًا موجبًا صحيحًا."
          );
        }
      });

      return issues;
    }

    add.onclick = addRow;

    mode.onchange = () => {
      if (
        mode.value === "single" &&
        rows.length > 1
      ) {
        mode.value = "multiple";

        info(
          "طريقة الصرف",
          "احذف المستفيدين الإضافيين أولًا " +
          "للعودة إلى حساب واحد."
        );
      }

      update();
    };

    kind.onchange = update;
    currency.onchange = update;
    period.oninput = update;

    review.onclick = () => {
      const issues = validate();
      errors.replaceChildren();

      if (issues.length) {
        const box = el("div", "jc-error");

        issues.forEach(issue => {
          box.append(el("div", "", "• " + issue));
        });

        errors.append(box);
        errors.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
        return;
      }

      const { total } = calculate();

      const result = el("div", "jc-summary");

      result.append(
        el("strong", "", "مراجعة كشف الصرف"),
        el(
          "div",
          "",
          "نوع العملية: " + TYPES[kind.value]
        ),
        el(
          "div",
          "",
          "عدد المستفيدين: " + rows.length
        )
      );

      rows.forEach((item, i) => {
        result.append(
          el(
            "div",
            "",
            (i + 1) + ". " +
            item.owner + " — " +
            item.wallet.value.trim() + " — " +
            money(parseCents(item.amount.value)) +
            " " + currency.value
          )
        );
      });

      result.append(
        el(
          "div",
          "jc-words",
          "الإجمالي: " +
          money(total) + " " + currency.value
        ),
        el(
          "div",
          "",
          amountWords(total, currency.value)
        ),
        el(
          "div",
          "jc-muted",
          "مراجعة فقط — لم تُنفذ عملية صرف."
        )
      );

      errors.append(result);

      result.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    };

    overlay.addEventListener("click", event => {
      if (event.target === overlay) {
        overlay.remove();
      }
    });

    overlay.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        overlay.remove();
      }
    });

    overlay.append(panel);
    document.body.append(overlay);

    addRow();
    update();
    kind.focus();
  }

  function init() {
    const grid = $("serviceGrid");

    if (!grid || $("jc-finance-v7")) return;

    styles();

    const card = grid.closest(".card");
    if (!card) return;

    card.classList.add("jc-section");

    const heading = card.querySelector("h2");
    if (heading) {
      heading.textContent = "العمليات المالية";
    }

    const extras = $("jebyExtras");

    const customize = findButton(
      extras,
      "تخصيص خدماتي"
    );

    const feedback = findButton(
      extras,
      "شاركنا رأيك"
    );

    const finance = section(
      "jc-finance-v7",
      "الإدارة المالية والتخطيط",
      "خدمات الادخار والتقارير وكشوف الصرف."
    );

    finance.grid.append(
      tile("📊", "نظامي المالي", () => {
        info(
          "نظامي المالي",
          "يجري تطوير تصنيف الإيرادات والمصروفات."
        );
      }),

      tile("🎯", "ميزانياتي", () => {
        info(
          "ميزانياتي",
          "يجري تطوير الميزانيات التدريبية."
        );
      }),

      tile("🏦", "الادخار", () => {
        originalService("الادخار");
      }),

      tile("📁", "مشاريعي", () => {
        originalService("إدارة المشاريع");
      }),

      tile("📈", "التقارير", () => {
        tab("reports");
      }),

      tile(
        "👥",
        "رواتب وحوافز الموظفين",
        payroll
      )
    );

    ["الادخار", "إدارة المشاريع"].forEach(name => {
      const b = findButton(grid, name);
      if (b) b.classList.add("jc-hidden");
    });

    const personal = section(
      "jc-personal-v7",
      "الخدمات الشخصية والمساندة",
      "إعدادات المحفظة والتواصل."
    );

    if (customize) {
      personal.grid.append(
        tile("⚙️", "تخصيص خدماتي", () => {
          customize.click();
        })
      );
    }

    if (feedback) {
      personal.grid.append(
        tile("💬", "شاركنا رأيك", () => {
          feedback.click();
        })
      );
    }

    personal.grid.append(
      tile("🔐", "الأمان والحساب", () => {
        tab("profile");
      })
    );

    card.insertAdjacentElement(
      "afterend",
      finance.box
    );

    finance.box.insertAdjacentElement(
      "afterend",
      personal.box
    );

    if (extras) {
      extras.style.display = "none";
    }

    const oldPanel = $("jeby-phase1-panel");
    if (oldPanel) oldPanel.remove();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
