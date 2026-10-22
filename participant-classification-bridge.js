
/*
 JEBY CASH
 Participant Classification Bridge v1
 Educational simulation only.
 No financial transactions are changed or deleted.
*/
(function () {
  "use strict";

  if (window.JEBY_CLASSIFICATION_BRIDGE_V1) return;
  window.JEBY_CLASSIFICATION_BRIDGE_V1 = true;

  const $ = id => document.getElementById(id);

  const el = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function client() {
    try {
      return typeof db !== "undefined" ? db : null;
    } catch (_) {
      return null;
    }
  }

  function currentUser() {
    try {
      return typeof user !== "undefined" ? user : null;
    } catch (_) {
      return null;
    }
  }

  function notice(message) {
    alert(message);
  }

  async function openClassification(transactionId) {
    const database = client();
    const current = currentUser();

    if (!database || !current?.id) {
      notice("يرجى تسجيل الدخول أولًا.");
      return;
    }

    const [accountsResult, preferencesResult, existingResult] =
      await Promise.all([
        database
          .from("jeby_chart_accounts")
          .select(
            "id,parent_id,code,name,level,owner_user_id,is_active"
          )
          .eq("is_active", true)
          .order("code"),

        database
          .from("jeby_chart_preferences")
          .select("enabled,selected_levels")
          .eq("user_id", current.id)
          .maybeSingle(),

        database
          .from("jeby_account_classification")
          .select("account_id")
          .eq("transaction_id", transactionId)
          .eq("user_id", current.id)
          .maybeSingle()
      ]);

    if (accountsResult.error) {
      notice("تعذر تحميل الحسابات: " +
        accountsResult.error.message);
      return;
    }

    if (preferencesResult.error || existingResult.error) {
      notice("تعذر تحميل إعدادات التصنيف.");
      return;
    }

    const preferences = preferencesResult.data;

    if (!preferences?.enabled) {
      notice(
        "الدليل المحاسبي غير مفعّل. " +
        "يرجى تفعيله من إعدادات المحفظة أولًا."
      );
      return;
    }

    const maxLevel = Number(preferences.selected_levels || 1);
    const accounts = (accountsResult.data || [])
      .filter(account => Number(account.level) <= maxLevel);

    if (!accounts.length) {
      notice("لا توجد حسابات محاسبية متاحة.");
      return;
    }

    const overlay = el("div");
    overlay.dir = "rtl";
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:999999",
      "background:rgba(0,0,0,.65)",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:16px"
    ].join(";");

    const panel = el("section");
    panel.style.cssText = [
      "background:#fff",
      "color:#532139",
      "width:100%",
      "max-width:460px",
      "max-height:85vh",
      "overflow:auto",
      "padding:20px",
      "border-radius:15px",
      "box-sizing:border-box",
      "font:14px/1.8 Tahoma,Arial"
    ].join(";");

    const heading = el(
      "h3",
      "تصنيف العملية JEBY-" + transactionId
    );

    const description = el(
      "p",
      "اختر الحساب المحاسبي المناسب. " +
      "سيُحفظ التصنيف فقط، دون تعديل العملية أو الرصيد."
    );

    const chooser = el("select");
    chooser.style.cssText = [
      "width:100%",
      "padding:12px",
      "border:1px solid #ccc",
      "border-radius:9px",
      "margin:10px 0"
    ].join(";");

    const placeholder = el("option", "اختر الحساب");
    placeholder.value = "";
    chooser.appendChild(placeholder);

    for (const account of accounts) {
      const option = el(
        "option",
        "المستوى " + account.level +
        " | " + account.code +
        " — " + account.name
      );

      option.value = String(account.id);
      chooser.appendChild(option);
    }

    if (existingResult.data?.account_id) {
      chooser.value = String(existingResult.data.account_id);
    }

    const actions = el("div");
    actions.style.cssText =
      "display:flex;gap:10px;margin-top:15px";

    const save = el("button", "حفظ التصنيف");
    const cancel = el("button", "إلغاء");

    for (const button of [save, cancel]) {
      button.type = "button";
      button.style.cssText = [
        "flex:1",
        "padding:12px",
        "border-radius:9px",
        "cursor:pointer"
      ].join(";");
    }

    save.style.background = "#64213f";
    save.style.color = "#fff";
    cancel.style.background = "#eee";

    cancel.onclick = () => overlay.remove();

    overlay.onclick = event => {
      if (event.target === overlay) overlay.remove();
    };

    save.onclick = async () => {
      const accountId = Number(chooser.value);

      if (!Number.isSafeInteger(accountId) || accountId <= 0) {
        notice("اختر الحساب المحاسبي أولًا.");
        return;
      }

      save.disabled = true;
      save.textContent = "جارٍ الحفظ...";

      try {
        const { error } = await database.rpc(
          "jeby_set_account_classification",
          {
            p_transaction_id: transactionId,
            p_account_id: accountId
          }
        );

        if (error) throw error;

        overlay.remove();

        notice(
          "تم حفظ التصنيف المحاسبي للعملية JEBY-" +
          transactionId +
          " بنجاح.\n" +
          "لم تتغير العملية المالية أو الرصيد."
        );

        const reload = $("reloadHistory");
        if (reload) reload.click();

      } catch (error) {
        notice(
          "تعذر حفظ التصنيف:\n" +
          (error.message || "خطأ غير معروف")
        );
      } finally {
        save.disabled = false;
        save.textContent = "حفظ التصنيف";
      }
    };

    actions.append(save, cancel);
    panel.append(heading, description, chooser, actions);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  /*
   Intercept only the classification action
   in the new ledger table.
   Other ledger actions remain unchanged.
  */
  document.addEventListener(
    "click",
    event => {
      const button = event.target.closest(
        ".jeby-ledger-action"
      );

      if (!button) return;

      if (
        button.getAttribute("aria-label") !==
        "تصنيف العملية أو تعديل تصنيفها"
      ) return;

      const row = button.closest("[data-jeby-tx]");
      const transactionId = Number(row?.dataset.jebyTx);

      if (!Number.isSafeInteger(transactionId)) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      openClassification(transactionId);
    },
    true
  );

})();
