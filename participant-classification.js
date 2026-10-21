
/*
 JEBY CASH
 Financial Classification V1
 Educational Simulation Only

 File: participant-classification.js
*/

(function () {
  "use strict";

  if (window.JEBY_CLASSIFICATION_V1) return;
  window.JEBY_CLASSIFICATION_V1 = true;

  const CATEGORIES = {
    out: [
      ["unclassified", "غير مصنف", ["غير محدد"]],
      ["expense", "مصروف", [
        "إيجار", "مواصلات", "خدمات",
        "كهرباء ومياه", "اتصالات",
        "صيانة", "مصروف شخصي", "أخرى"
      ]],
      ["debt_payment", "سداد التزام", [
        "سداد دين", "سداد قرض",
        "سداد مورد", "سداد مستحقات"
      ]],
      ["loan_given", "سلفة أو قرض ممنوح", [
        "سلفة موظف", "قرض لصديق",
        "قرض لأحد الأقارب", "أخرى"
      ]],
      ["asset_purchase", "شراء أصل", [
        "أجهزة", "معدات", "أثاث",
        "وسائل نقل", "أخرى"
      ]],
      ["inventory_purchase", "شراء مخزون", [
        "بضاعة للبيع", "مواد خام", "أخرى"
      ]],
      ["investment", "استثمار", [
        "مساهمة في مشروع", "شراء حصة", "أخرى"
      ]],
      ["salary", "راتب", [
        "راتب موظف", "أجور عمال"
      ]],
      ["advance", "سلفة", [
        "سلفة موظف", "سلفة شخصية"
      ]],
      ["bonus", "مكافأة", [
        "مكافأة موظف", "حافز أداء"
      ]],
      ["tip", "إكرامية", [
        "إكرامية موظف", "إكرامية خدمة"
      ]],
      ["personal_transfer", "تحويل شخصي", [
        "دعم عائلي", "مساعدة", "تحويل شخصي"
      ]],
      ["gift", "هدية", [
        "هدية شخصية", "هدية مناسبة"
      ]],
      ["internal_transfer", "تحويل بين حساباتي", [
        "تحويل داخلي"
      ]],
      ["other", "أخرى", ["أخرى"]]
    ],

    in: [
      ["unclassified", "غير مصنف", ["غير محدد"]],
      ["revenue", "إيراد", [
        "مبيعات", "خدمات", "عمولات",
        "إيراد مشروع", "إيراد آخر"
      ]],
      ["debt_collection", "تحصيل مستحقات", [
        "تحصيل دين", "تحصيل سلفة",
        "تحصيل قرض ممنوح", "تحصيل عميل"
      ]],
      ["loan_received", "قرض مستلم", [
        "قرض شخصي", "قرض مشروع"
      ]],
      ["capital", "رأس مال أو تمويل", [
        "مساهمة رأس مال", "تمويل مشروع"
      ]],
      ["salary", "راتب مستلم", [
        "راتب", "أجور"
      ]],
      ["bonus", "مكافأة مستلمة", [
        "مكافأة", "حافز"
      ]],
      ["tip", "إكرامية مستلمة", [
        "إكرامية"
      ]],
      ["refund", "استرداد مبلغ", [
        "استرداد مشتريات", "استرداد دفعة"
      ]],
      ["gift", "هدية أو دعم", [
        "هدية", "دعم عائلي", "مساعدة"
      ]],
      ["internal_transfer", "تحويل بين حساباتي", [
        "تحويل داخلي"
      ]],
      ["other", "مقبوضات أخرى", ["أخرى"]]
    ]
  };

  const $ = id => document.getElementById(id);

  function element(tag, text) {
    const x = document.createElement(tag);
    if (text !== undefined) x.textContent = text;
    return x;
  }

  function database() {
    try {
      return typeof db !== "undefined" ? db : null;
    } catch (_) {
      return null;
    }
  }

  function account() {
    try {
      return typeof user !== "undefined" ? user : null;
    } catch (_) {
      return null;
    }
  }

  function toast(text, good) {
    const x = element("div", text);

    x.style.cssText = [
      "position:fixed",
      "bottom:75px",
      "left:12px",
      "right:12px",
      "z-index:9999",
      "padding:14px",
      "border-radius:12px",
      "background:" + (good ? "#e2f5e9" : "#fff2d8"),
      "color:" + (good ? "#195c33" : "#624521"),
      "font:13px/1.8 Tahoma,Arial",
      "border:1px solid #dfcda9",
      "box-shadow:0 4px 20px #0002"
    ].join(";");

    document.body.append(x);
    setTimeout(() => x.remove(), 6500);
  }

  function createFields(direction) {
    const box = element("div");
    box.className = "jc-classification-fields";
    box.style.marginTop = "12px";

    const mainLabel = element("label", "طبيعة العملية");
    const main = element("select");
    main.required = true;

    CATEGORIES[direction].forEach(item => {
      const o = element("option", item[1]);
      o.value = item[0];
      main.append(o);
    });

    const subLabel = element(
      "label", "التصنيف التفصيلي"
    );

    const sub = element("select");

    const noteLabel = element(
      "label", "بيان التصنيف (اختياري)"
    );

    const note = element("input");
    note.maxLength = 250;
    note.placeholder = "تفاصيل إضافية";

    function refreshSub(preferred) {
      const selected = CATEGORIES[direction].find(
        x => x[0] === main.value
      );

      const choices = selected ? selected[2] : ["أخرى"];

      sub.replaceChildren();

      choices.forEach(name => {
        const o = element("option", name);
        o.value = name;
        sub.append(o);
      });

      if (preferred && choices.includes(preferred)) {
        sub.value = preferred;
      }
    }

    main.onchange = () => refreshSub();
    refreshSub();

    box.append(
      mainLabel, main,
      subLabel, sub,
      noteLabel, note
    );

    return {
      box,
      values() {
        return {
          category: main.value,
          subcategory: sub.value,
          description: note.value.trim()
        };
      },
      set(record) {
        if (!record) return;

        if (CATEGORIES[direction].some(
          x => x[0] === record.category
        )) {
          main.value = record.category;
        }

        refreshSub(record.subcategory);
        note.value = record.description || "";
      }
    };
  }

  async function saveClassification(id, values) {
    const api = database();

    if (!api) {
      throw new Error("اتصال قاعدة البيانات غير متاح");
    }

    const transactionId = Number(id);

    if (
      !Number.isSafeInteger(transactionId) ||
      transactionId <= 0
    ) {
      throw new Error("رقم العملية غير صالح");
    }

    const { error } = await api.rpc(
      "jeby_classify_transaction",
      {
        p_transaction_id: transactionId,
        p_category: values.category,
        p_subcategory: values.subcategory,
        p_description: values.description
      }
    );

    if (error) throw error;
  }

  async function getClassification(id) {
    const api = database();
    const u = account();

    if (!api || !u) return null;

    const { data, error } = await api
      .from("jeby_transaction_classifications")
      .select(
        "category,subcategory,description,direction"
      )
      .eq("transaction_id", Number(id))
      .eq("user_id", u.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  function directionOf(t) {
    const u = account();

    if (!u) return "in";

    if (t.from_user_id === u.id) return "out";
    if (t.to_user_id === u.id) return "in";

    return t.kind === "admin_withdrawal"
      ? "out"
      : "in";
  }

  function classificationDialog(t) {
    const direction = directionOf(t);

    const backdrop = element("div");

    backdrop.style.cssText = [
      "position:fixed",
      "inset:0",
      "background:#0009",
      "z-index:10000",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:12px"
    ].join(";");

    const panel = element("div");

    panel.style.cssText = [
      "background:white",
      "width:100%",
      "max-width:520px",
      "max-height:90vh",
      "overflow:auto",
      "border-radius:18px",
      "padding:20px",
      "direction:rtl",
      "font:14px Tahoma,Arial"
    ].join(";");

    const heading = element(
      "h2", "تصنيف العملية رقم " + t.id
    );

    heading.style.color = "#571d35";

    const explanation = element(
      "p",
      direction === "out"
        ? "حدد طبيعة المبلغ الصادر من محفظتك."
        : "حدد طبيعة المبلغ الوارد إلى محفظتك."
    );

    const fields = createFields(direction);

    const status = element(
      "p", "جارٍ تحميل التصنيف..."
    );

    status.style.fontSize = "12px";

    const save = element("button", "حفظ التصنيف");
    save.type = "button";
    save.style.cssText = [
      "width:100%",
      "margin-top:12px",
      "background:#571d35",
      "color:white",
      "padding:12px",
      "border-radius:10px"
    ].join(";");

    const close = element("button", "إغلاق");
    close.type = "button";
    close.style.cssText = [
      "width:100%",
      "margin-top:8px",
      "background:#f5ece7",
      "color:#571d35",
      "padding:12px",
      "border-radius:10px"
    ].join(";");

    close.onclick = () => backdrop.remove();

    save.onclick = async () => {
      save.disabled = true;
      status.textContent = "جارٍ حفظ التصنيف...";

      try {
        await saveClassification(
          t.id, fields.values()
        );

        toast("تم حفظ طبيعة العملية بنجاح", true);
        backdrop.remove();
      } catch (e) {
        status.textContent =
          "تعذر الحفظ: " + (e.message || e);
      } finally {
        save.disabled = false;
      }
    };

    panel.append(
      heading,
      explanation,
      fields.box,
      status,
      save,
      close
    );

    backdrop.append(panel);
    document.body.append(backdrop);

    getClassification(t.id)
      .then(record => {
        fields.set(record);

        status.textContent = record
          ? "يمكنك تعديل التصنيف المحفوظ."
          : "اختر التصنيف المناسب ثم احفظ.";
      })
      .catch(e => {
        status.textContent =
          "تعذر تحميل التصنيف: " + (e.message || e);
      });
  }

  let pendingTransfer = null;
  const handled = new Set();

  function attachTransfer() {
    const title = $("detailTitle");
    const detail = $("detailContent");

    if (!title || !detail) return;

    if (!title.textContent.includes("تحويل إلى مشترك")) {
      return;
    }

    const form = detail.querySelector("form");

    if (!form || form.dataset.jcClassified) return;

    const labels = [...form.querySelectorAll("label")];

    const amountLabel = labels.find(
      x => x.textContent.includes("مبلغ الحوالة")
    );

    if (!amountLabel) return;

    const amount = amountLabel.nextElementSibling;

    if (!amount) return;

    const fields = createFields("out");

    amount.insertAdjacentElement(
      "afterend", fields.box
    );

    form.dataset.jcClassified = "1";

    form.addEventListener("submit", () => {
      pendingTransfer = {
        values: fields.values(),
        createdAt: Date.now()
      };
    }, true);
  }

  async function inspectSuccess() {
    const message = $("msg");

    if (!message || !pendingTransfer) return;

    if (
      Date.now() - pendingTransfer.createdAt >
      120000
    ) {
      pendingTransfer = null;
      return;
    }

    const text = message.textContent || "";

    if (!text.includes("نجح التحويل الافتراضي")) {
      return;
    }

    const match = text.match(/رقم العملية:\s*(\d+)/);

    if (!match) return;

    const id = Number(match[1]);

    if (handled.has(id)) return;

    handled.add(id);

    const values = pendingTransfer.values;
    pendingTransfer = null;

    try {
      await saveClassification(id, values);

      toast(
        "نجح التحويل وتم حفظ تصنيفه المالي.",
        true
      );
    } catch (e) {
      toast(
        "نجح التحويل، لكن تعذر حفظ التصنيف. " +
        "يمكنك تصنيفه من سجل العمليات. " +
        "رقم العملية: " + id,
        false
      );
    }
  }

  function attachHistory() {
    const history = $("historyList");

    if (!history) return;

    let list = [];

    try {
      list = typeof transactions !== "undefined"
        ? transactions
        : [];
    } catch (_) {
      return;
    }

    const rows = history.querySelectorAll(".tx");

    rows.forEach(row => {
      if (row.querySelector(".jc-classify-button")) {
        return;
      }

      const heading = row.querySelector("strong");

      if (!heading) return;

      const match = heading.textContent.match(
        /رقم\s+(\d+)/
      );

      if (!match) return;

      const t = list.find(
        x => Number(x.id) === Number(match[1])
      );

      if (!t) return;

      const b = element(
        "button", "تصنيف العملية المالية"
      );

      b.type = "button";
      b.className = "jc-classify-button";

      b.style.cssText = [
        "display:block",
        "width:100%",
        "margin-top:8px",
        "padding:10px",
        "border-radius:10px",
        "background:#f5ece7",
        "color:#571d35",
        "border:1px solid #e9dedf",
        "font:12px Tahoma,Arial"
      ].join(";");

      b.onclick = () => classificationDialog(t);

      row.append(b);
    });
  }

  function attachDemo() {
    const title = $("detailTitle");
    const detail = $("detailContent");

    if (!title || !detail) return;

    if (title.textContent.includes("تحويل إلى مشترك")) {
      return;
    }

    const form = detail.querySelector("form");

    if (!form || form.dataset.jcClassified) return;

    const amount = form.querySelector(
      'input[type="number"]'
    );

    if (!amount) return;

    const fields = createFields("out");

    amount.insertAdjacentElement(
      "afterend", fields.box
    );

    form.dataset.jcClassified = "1";

    const explanation = element(
      "p",
      "هذا التصنيف للعرض فقط. " +
      "لن تُسجل حركة مالية حتى يتم تفعيل الخدمة."
    );

    explanation.style.cssText =
      "font-size:12px;color:#76676f;line-height:1.8";

    fields.box.append(explanation);
  }

  let updating = false;

  function update() {
    if (updating) return;

    updating = true;

    try {
      attachTransfer();
      attachDemo();
      attachHistory();
      inspectSuccess();
    } finally {
      updating = false;
    }
  }

  function initialize() {
    const observer = new MutationObserver(update);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }
})();
