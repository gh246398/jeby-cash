
/*
 JEBY CASH — Participant Dashboard V5
 Payroll, Advances, Bonuses and Gratuities
 Educational simulation only
*/

(function () {
  "use strict";

  const $ = id => document.getElementById(id);

  function el(tag, cls = "", text = "") {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function addCSS() {
    if ($("jeby-v5-css")) return;

    const s = el("style");
    s.id = "jeby-v5-css";
    s.textContent = `
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
        box-shadow:none!important;
      }
      .jc-icon {
        font-size:22px;
        line-height:1.2;
      }
      .jc-label {
        font-size:10px;
        line-height:1.5;
      }
      .jc-section {
        padding:14px 12px;
        margin-bottom:13px;
      }
      .jc-section h2 {
        font-size:16px;
        margin:0 0 7px;
      }
      .jc-desc {
        font-size:11px;
        color:#80737a;
        margin:0 0 12px;
        line-height:1.7;
      }
      .jc-hidden {
        display:none!important;
      }
      .jc-overlay {
        position:fixed;
        inset:0;
        z-index:1000;
        background:#000a;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:10px;
      }
      .jc-modal {
        width:100%;
        max-width:560px;
        max-height:94vh;
        overflow:auto;
        background:white;
        border-radius:17px;
        padding:16px;
        color:#342a30;
        box-shadow:0 12px 40px #0003;
      }
      .jc-modal h2 {
        font-size:19px;
        margin:0 0 8px;
      }
      .jc-modal h3 {
        font-size:14px;
        margin:14px 0 7px;
      }
      .jc-modal label {
        font-size:12px;
        margin:9px 0 5px;
      }
      .jc-modal input,.jc-modal select {
        width:100%;
        padding:10px;
        font-size:13px;
      }
      .jc-row {
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:9px;
      }
      .jc-beneficiary {
        border:1px solid #eadfe3;
        background:#fdfaf8;
        border-radius:12px;
        padding:10px;
        margin:9px 0;
      }
      .jc-beneficiary-head {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:8px;
      }
      .jc-summary {
        background:#f8f1e7;
        border:1px solid #e7d3b3;
        border-radius:12px;
        padding:12px;
        margin-top:12px;
        font-size:13px;
        line-height:2;
      }
      .jc-actions {
        display:flex;
        gap:8px;
        margin-top:12px;
      }
      .jc-actions button {
        flex:1;
        font-size:12px;
        padding:11px 5px;
      }
      .jc-muted {
        color:#76676f;
        font-size:12px;
        line-height:1.8;
      }
      .jc-danger {
        color:#a32635;
        background:#fff0f0;
        border:1px solid #f1caca;
        border-radius:10px;
        padding:9px;
        font-size:12px;
      }
      .jc-remove {
        background:#f9e7e7;
        color:#8b2635;
        padding:5px 10px;
        font-size:11px;
      }
      @media(max-width:340px) {
        #serviceGrid,.jc-grid {
          grid-template-columns:repeat(3,minmax(0,1fr))!important;
        }
      }
    `;
    document.head.append(s);
  }

  function tile(icon, label, fn) {
    const b = el("button", "jc-tile");
    b.type = "button";
    b.append(
      el("span", "jc-icon", icon),
      el("span", "jc-label", label)
    );
    b.addEventListener("click", fn);
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

  function findButton(parent, text) {
    if (!parent) return null;
    return [...parent.querySelectorAll("button")]
      .find(b => b.textContent.includes(text)) || null;
  }

  function openTab(name) {
    const b = document.querySelector(
      '[data-tab="' + name + '"]'
    );
    if (b) b.click();
  }

  function originalService(name) {
    const b = findButton($("serviceGrid"), name);
    if (b) b.click();
  }

  function message(title, content) {
    const overlay = el("div", "jc-overlay");
    const modal = el("div", "jc-modal");
    const close = el("button", "full", "إغلاق");
    close.type = "button";
    close.onclick = () => overlay.remove();
    modal.append(
      el("h2", "", title),
      el("p", "jc-muted", content),
      close
    );
    overlay.append(modal);
    document.body.append(overlay);
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

  function payroll() {
    if ($("jc-payroll-modal")) return;

    const overlay = el("div", "jc-overlay");
    overlay.id = "jc-payroll-modal";

    const modal = el("div", "jc-modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute(
      "aria-label",
      "رواتب وحوافز الموظفين"
    );

    const titleRow = el("div", "jc-beneficiary-head");
    titleRow.append(
      el("h2", "", "👥 رواتب وحوافز الموظفين")
    );

    const close = el("button", "jc-remove", "✕ إغلاق");
    close.type = "button";
    close.onclick = () => overlay.remove();
    titleRow.append(close);
    modal.append(titleRow);

    modal.append(
      el(
        "p",
        "jc-muted",
        "إعداد أوامر صرف تدريبية افتراضية. " +
        "المراجعة متاحة، أما التنفيذ المالي " +
        "فغير مفعّل حتى ربط قاعدة البيانات."
      )
    );

    function field(label, type, parent, options) {
      const wrap = el("div");
      const lab = el("label", "", label);
      const input = el(type === "select" ? "select" : "input");

      if (type === "select") {
        options.forEach(([value, text]) => {
          const opt = el("option", "", text);
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

    const top = el("div", "jc-row");
    const kind = field(
      "نوع الصرف",
      "select",
      top,
      Object.entries(TYPES)
    );

    const mode = field(
      "طريقة الصرف",
      "select",
      top,
      [
        ["single", "حساب واحد"],
        ["multiple", "حسابات متعددة"]
      ]
    );

    modal.append(top);

    const second = el("div", "jc-row");

    const currency = field(
      "عملة الصرف",
      "select",
      second,
      Object.entries(CURRENCIES)
        .map(([code, name]) => [code, name])
    );

    const period = field(
      "الفترة أو المرجع",
      "text",
      second
    );
    period.placeholder = "مثال: أكتوبر 2026";

    modal.append(second);

    const rowsTitle = el(
      "h3",
      "",
      "بيانات المستفيدين"
    );
    modal.append(rowsTitle);

    const rows = el("div");
    modal.append(rows);

    const add = el(
      "button",
      "light full",
      "＋ إضافة مستفيد"
    );
    add.type = "button";
    modal.append(add);

    const summary = el("div", "jc-summary");
    modal.append(summary);

    const errors = el("div");
    errors.setAttribute("role", "alert");
    modal.append(errors);

    const actions = el("div", "jc-actions");

    const review = el(
      "button",
      "",
      "مراجعة أمر الصرف"
    );

    const execute = el(
      "button",
      "gold",
      "تنفيذ الصرف"
    );
    execute.disabled = true;
    execute.title =
      "يتطلب ربطًا آمنًا بقاعدة البيانات";

    actions.append(review, execute);
    modal.append(actions);

    const status = el(
      "p",
      "jc-muted",
      "التنفيذ غير متاح في هذه المرحلة؛ " +
      "لا تُخصم مبالغ من أي محفظة."
    );
    modal.append(status);

    const beneficiaries = [];

    function createRow() {
      const card = el("div", "jc-beneficiary");
      const head = el(
        "div",
        "jc-beneficiary-head"
      );

      const number = el("strong", "", "");
      const remove = el(
        "button",
        "jc-remove",
        "حذف"
      );
      remove.type = "button";

      head.append(number, remove);
      card.append(head);

      const wallet = field(
        "رقم محفظة المستفيد",
        "text",
        card
      );
      wallet.placeholder = "رقم المحفظة";
      wallet.autocomplete = "off";

      const pair = el("div", "jc-row");
      const name = field(
        "اسم المستفيد (اختياري)",
        "text",
        pair
      );
      const amount = field(
        "المبلغ",
        "number",
        pair
      );
      amount.min = "0.01";
      amount.step = "0.01";
      amount.placeholder = "0.00";
      card.append(pair);

      const note = field(
        "البيان (اختياري)",
        "text",
        card
      );
      note.placeholder = "ملاحظة عن العملية";

      const item = {
        card, wallet, name, amount, note
      };

      beneficiaries.push(item);
      rows.append(card);

      [wallet, name, amount, note].forEach(
        input => input.addEventListener(
          "input",
          update
        )
      );

      remove.onclick = () => {
        if (beneficiaries.length <= 1) return;

        const i = beneficiaries.indexOf(item);
        if (i >= 0) beneficiaries.splice(i, 1);

        card.remove();
        renumber();
        update();
      };

      renumber();
      update();
    }

    function renumber() {
      beneficiaries.forEach((item, i) => {
        const label = item.card.querySelector(
          ".jc-beneficiary-head strong"
        );
        if (label) {
          label.textContent =
            "المستفيد " + (i + 1);
        }

        const remove = item.card.querySelector(
          ".jc-remove"
        );
        if (remove) {
          remove.disabled =
            beneficiaries.length === 1;
        }
      });
    }

    function update() {
      add.hidden = mode.value === "single";

      if (
        mode.value === "single" &&
        beneficiaries.length > 1
      ) {
        // عند العودة للفردي لا نحذف بيانات
        // المستفيدين الآخرين دون موافقة.
        mode.value = "multiple";
        add.hidden = false;
      }

      const total = beneficiaries.reduce(
        (sum, item) => {
          const amount = Number(item.amount.value);
          return sum + (
            Number.isFinite(amount) && amount > 0
              ? amount : 0
          );
        },
        0
      );

      summary.replaceChildren(
        el(
          "div",
          "",
          "نوع الصرف: " + TYPES[kind.value]
        ),
        el(
          "div",
          "",
          "عدد المستفيدين: " +
          beneficiaries.length
        ),
        el(
          "div",
          "",
          "إجمالي المبالغ: " +
          total.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }) + " " + currency.value
        ),
        el(
          "div",
          "",
          "العمولات: لم تُحتسب بعد"
        )
      );

      errors.replaceChildren();
    }

    function validate() {
      const issues = [];
      const wallets = new Set();

      if (!beneficiaries.length) {
        issues.push("أضف مستفيدًا واحدًا على الأقل.");
      }

      beneficiaries.forEach((item, i) => {
        const n = i + 1;
        const wallet = item.wallet.value.trim();
        const raw = item.amount.value.trim();
        const amount = Number(raw);

        if (!wallet) {
          issues.push(
            "أدخل محفظة المستفيد " + n
          );
        } else if (wallets.has(wallet)) {
          issues.push(
            "رقم المحفظة مكرر في الصف " + n
          );
        } else {
          wallets.add(wallet);
        }

        if (
          !raw ||
          !Number.isFinite(amount) ||
          amount <= 0 ||
          !/^\d+(\.\d{1,2})?$/.test(raw)
        ) {
          issues.push(
            "مبلغ المستفيد " + n +
            " يجب أن يكون موجبًا وبحد أقصى منزلتين عشريتين."
          );
        }
      });

      return issues;
    }

    add.onclick = () => {
      if (beneficiaries.length >= 100) {
        message(
          "حد المستفيدين",
          "الحد الأقصى في هذه الشاشة 100 مستفيد."
        );
        return;
      }
      createRow();
    };

    mode.onchange = () => {
      if (
        mode.value === "single" &&
        beneficiaries.length > 1
      ) {
        mode.value = "multiple";
        message(
          "تغيير طريقة الصرف",
          "احذف المستفيدين الإضافيين أولًا " +
          "للتبديل إلى حساب واحد."
        );
      }
      update();
    };

    kind.onchange = update;
    currency.onchange = update;

    review.onclick = () => {
      const issues = validate();
      errors.replaceChildren();

      if (issues.length) {
        const box = el("div", "jc-danger");
        issues.forEach(issue => {
          box.append(el("div", "", "• " + issue));
        });
        errors.append(box);
        return;
      }

      const count = beneficiaries.length;
      const total = beneficiaries.reduce(
        (sum, item) =>
          sum + Number(item.amount.value),
        0
      );

      message(
        "مراجعة أمر الصرف",
        TYPES[kind.value] +
        " — " + count + " مستفيد" +
        " — الإجمالي " +
        total.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) +
        " " + currency.value +
        ". هذه مراجعة تدريبية فقط؛ " +
        "لم يُنفذ أي تحويل أو خصم."
      );
    };

    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.remove();
    });

    overlay.addEventListener("keydown", e => {
      if (e.key === "Escape") overlay.remove();
    });

    createRow();
    update();

    overlay.append(modal);
    document.body.append(overlay);
    kind.focus();
  }

  function init() {
    const grid = $("serviceGrid");
    if (!grid || $("jc-finance-v5")) return;

    addCSS();

    const serviceCard = grid.closest(".card");
    if (!serviceCard) return;

    serviceCard.classList.add("jc-section");

    const heading = serviceCard.querySelector("h2");
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

    const financial = section(
      "jc-finance-v5",
      "الإدارة المالية والتخطيط",
      "خدمات التخطيط والادخار والصرف الإداري."
    );

    financial.grid.append(
      tile("📊", "نظامي المالي", () => {
        message(
          "نظامي المالي",
          "يجري تطوير تصنيف الإيرادات والمصروفات."
        );
      }),
      tile("🎯", "ميزانياتي", () => {
        message(
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
        openTab("reports");
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
      "jc-personal-v5",
      "الخدمات الشخصية والمساندة",
      "التخصيص وإعدادات الحساب والتواصل."
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
        openTab("profile");
      })
    );

    serviceCard.insertAdjacentElement(
      "afterend",
      financial.box
    );

    financial.box.insertAdjacentElement(
      "afterend",
      personal.box
    );

    if (extras) extras.style.display = "none";

    const duplicate = $("jeby-phase1-panel");
    if (duplicate) duplicate.remove();
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
