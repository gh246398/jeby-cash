
/*
 * JEBY CASH - Transfer Parties V1.1
 * Educational wallet - simulated transactions only.
 * Read-only transaction party enrichment.
 * Account-scoped cache and authentication cleanup.
 */
(function () {
  "use strict";

  if (window.JEBY_TRANSFER_PARTIES_V1) return;
  window.JEBY_TRANSFER_PARTIES_V1 = true;

  const partyCache = new Map();
  let pending = null;
  let cacheOwner = null;
  let cacheGeneration = 0;

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

  function transactionList() {
    try {
      return typeof transactions !== "undefined"
        ? transactions : [];
    } catch (_) {
      return [];
    }
  }

  function resetCache(owner = null) {
    cacheGeneration++;
    partyCache.clear();
    pending = null;
    cacheOwner = owner;
  }

  function ensureCacheOwner() {
    const owner = currentUser()?.id || null;

    if (cacheOwner !== owner) {
      resetCache(owner);
    }

    return owner;
  }

  function getParty(t) {
    ensureCacheOwner();
    return partyCache.get(Number(t.id)) || null;
  }

  function fullParty(name, wallet) {
    const displayName = name || "الاسم غير متاح";
    const displayWallet = wallet == null
      ? "رقم المحفظة غير متاح"
      : "محفظة رقم " + wallet;

    return displayName + " — " + displayWallet;
  }

  function senderText(t) {
    const p = getParty(t);

    if (!p) {
      return "جارٍ التحقق من بيانات المرسل";
    }

    return fullParty(p.sender_name, p.sender_wallet);
  }

  function recipientText(t) {
    const p = getParty(t);

    if (!p) {
      return "جارٍ التحقق من بيانات المستفيد";
    }

    return fullParty(p.recipient_name, p.recipient_wallet);
  }

  function counterpartText(t) {
    if (t.kind !== "transfer") {
      return "إدارة جيبي كاش";
    }

    const u = currentUser();

    if (!u?.id) {
      return "بيانات الطرف غير متاحة";
    }

    return t.from_user_id === u.id
      ? recipientText(t)
      : senderText(t);
  }

  async function fetchParties() {
    const d = client();
    const owner = ensureCacheOwner();

    if (!d || !owner) return;
    if (pending) return pending;

    const ids = [
      ...new Set(
        transactionList()
          .filter(t => t.kind === "transfer")
          .map(t => Number(t.id))
          .filter(id =>
            Number.isSafeInteger(id) && id > 0
          )
      )
    ].filter(id => !partyCache.has(id));

    if (!ids.length) return;

    const generation = cacheGeneration;

    const request = (async () => {
      const { data, error } = await d.rpc(
        "jeby_get_transaction_parties",
        { p_transaction_ids: ids }
      );

      if (
        generation !== cacheGeneration ||
        owner !== ensureCacheOwner()
      ) {
        return;
      }

      if (error) {
        console.warn(
          "JEBY CASH: unable to load transfer parties",
          error.message
        );
        return;
      }

      for (const row of data || []) {
        if (
          generation !== cacheGeneration ||
          owner !== ensureCacheOwner()
        ) {
          return;
        }

        partyCache.set(
          Number(row.transaction_id),
          row
        );
      }
    })();

    pending = request;

    try {
      await request;
    } finally {
      if (pending === request) {
        pending = null;
      }
    }
  }

  function updateLedger() {
    ensureCacheOwner();

    const root = document.getElementById(
      "historyList"
    );

    if (!root) return;

    const all = transactionList();

    root.querySelectorAll(
      "[data-jeby-tx]"
    ).forEach(row => {
      const id = Number(row.dataset.jebyTx);

      const t = all.find(
        item => Number(item.id) === id
      );

      if (!t) return;

      const cells = row.querySelectorAll(
        ":scope > td"
      );

      if (cells.length >= 5) {
        const partyCell = cells[4];
        const value = counterpartText(t);

        partyCell.textContent = value;
        partyCell.title = value;
      }
    });

    root.querySelectorAll(
      ".jeby-ledger-details"
    ).forEach(panel => {
      const row = panel.closest("tr");
      const previous = row?.previousElementSibling;

      const id = Number(
        previous?.dataset?.jebyTx
      );

      const t = all.find(
        item => Number(item.id) === id
      );

      if (!t || t.kind !== "transfer") {
        return;
      }

      panel.querySelectorAll("p").forEach(p => {
        if (
          p.textContent.startsWith(
            "الطرف المقابل:"
          )
        ) {
          p.textContent =
            "الطرف المقابل: " +
            counterpartText(t);
        }
      });

      let identities = panel.querySelector(
        ".jeby-transfer-identities"
      );

      if (!identities) {
        identities = document.createElement(
          "div"
        );

        identities.className =
          "jeby-transfer-identities";

        identities.style.cssText =
          "padding:10px;margin:10px 0;" +
          "border:1px solid #e3d4bc;" +
          "border-radius:9px;background:white;" +
          "line-height:2;direction:rtl;";

        panel.insertBefore(
          identities,
          panel.firstChild
        );
      }

      identities.replaceChildren();

      const from = document.createElement(
        "div"
      );

      from.textContent =
        "المرسل: " + senderText(t);

      const to = document.createElement(
        "div"
      );

      to.textContent =
        "المستفيد: " + recipientText(t);

      identities.append(from, to);
    });
  }

  function enhanceReceipt() {
    if (typeof receipt !== "function") {
      return;
    }

    const originalReceipt = receipt;

    receipt = function (t) {
      ensureCacheOwner();

      originalReceipt(t);

      if (!t || t.kind !== "transfer") {
        return;
      }

      const panel = document.querySelector(
        ".dialogback .dialog"
      );

      if (!panel) return;

      const from = document.createElement(
        "div"
      );

      from.className = "kv";

      const fromLabel =
        document.createElement("span");

      fromLabel.textContent = "المرسل";

      const fromValue =
        document.createElement("span");

      fromValue.textContent = senderText(t);

      from.append(fromLabel, fromValue);

      const to = document.createElement(
        "div"
      );

      to.className = "kv";

      const toLabel =
        document.createElement("span");

      toLabel.textContent = "المستفيد";

      const toValue =
        document.createElement("span");

      toValue.textContent = recipientText(t);

      to.append(toLabel, toValue);

      const rows = panel.querySelectorAll(
        ".kv"
      );

      if (rows.length) {
        rows[0].insertAdjacentElement(
          "afterend",
          from
        );

        from.insertAdjacentElement(
          "afterend",
          to
        );
      } else {
        panel.append(from, to);
      }

      const receiptLines = [
        "جيبي كاش | JEBY CASH",
        "إيصال عملية افتراضية لأغراض التدريب",
        "رقم العملية: JEBY-" + t.id,
        "نوع العملية: تحويل",
        "التاريخ: " +
          new Date(
            t.created_at
          ).toLocaleString("ar-YE"),
        "المرسل: " + senderText(t),
        "المستفيد: " + recipientText(t),
        "مبلغ الحوالة: " +
          Number(t.amount)
            .toLocaleString("en-US") +
          " " + t.currency,
        "العمولة: " +
          (
            t.fee_mode == null
              ? "غير مسجلة للعملية السابقة"
              : Number(
                  t.fee_amount || 0
                ).toLocaleString("en-US") +
                " " + t.currency
          ),
        "البيان: " + (t.note || "—"),
        "لا يمثل هذا الإيصال إثبات تحويل أموال حقيقية."
      ].join("\n");

      const buttons = [
        ...panel.querySelectorAll("button")
      ];

      for (const button of buttons) {
        const label = button.textContent.trim();

        if (
          label === "نسخ" ||
          label === "مشاركة" ||
          label.includes("طباعة")
        ) {
          const replacement =
            button.cloneNode(true);

          button.replaceWith(replacement);

          replacement.addEventListener(
            "click",
            async () => {
              if (label === "نسخ") {
                try {
                  await navigator.clipboard.writeText(
                    receiptLines
                  );

                  alert("تم نسخ الإيصال");
                } catch (_) {
                  alert("تعذر نسخ الإيصال");
                }

                return;
              }

              if (label === "مشاركة") {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: "إيصال جيبي كاش",
                      text: receiptLines
                    });
                  } catch (_) {}
                } else {
                  try {
                    await navigator.clipboard.writeText(
                      receiptLines
                    );

                    alert(
                      "تم نسخ الإيصال للمشاركة"
                    );
                  } catch (_) {
                    alert("المشاركة غير متاحة");
                  }
                }

                return;
              }

              const printWindow =
                window.open("", "_blank");

              if (!printWindow) {
                alert(
                  "اسمح بفتح نافذة الطباعة"
                );

                return;
              }

              const pre =
                printWindow.document
                  .createElement("pre");

              pre.textContent = receiptLines;

              pre.style.cssText =
                "direction:rtl;" +
                "white-space:pre-wrap;" +
                "font:16px Tahoma,Arial;" +
                "line-height:2;" +
                "padding:24px;";

              printWindow.document.body
                .appendChild(pre);

              printWindow.document.title =
                "JEBY-" + t.id;

              printWindow.focus();
              printWindow.print();
            }
          );
        }
      }
    };
  }

  function observeLedger() {
    const root = document.getElementById(
      "historyList"
    );

    if (!root) return;

    let queued = false;

    const observer = new MutationObserver(
      () => {
        if (queued) return;

        queued = true;

        setTimeout(() => {
          queued = false;

          ensureCacheOwner();

          if (
            root.querySelector(
              "[data-jeby-tx]"
            )
          ) {
            updateLedger();

            fetchParties().then(
              updateLedger
            );
          }
        }, 150);
      }
    );

    observer.observe(root, {
      childList: true,
      subtree: false
    });

    fetchParties().then(updateLedger);
    updateLedger();
  }

  function start() {
    enhanceReceipt();
    observeLedger();

    const d = client();

    if (d?.auth?.onAuthStateChange) {
      d.auth.onAuthStateChange(
        (event, session) => {
          if (
            event !== "SIGNED_OUT" &&
            event !== "SIGNED_IN" &&
            event !== "USER_UPDATED"
          ) {
            return;
          }

          const owner =
            event === "SIGNED_OUT"
              ? null
              : session?.user?.id || null;

          resetCache(owner);

          const root =
            document.getElementById(
              "historyList"
            );

          if (
            event === "SIGNED_OUT" &&
            root
          ) {
            root.replaceChildren();
          }

          // Authentication callbacks must not
          // await additional Supabase operations.
          // Ledger data will reload normally.
          updateLedger();
        }
      );
    }

    document.getElementById(
      "reloadHistory"
    )?.addEventListener(
      "click",
      () => {
        setTimeout(() => {
          ensureCacheOwner();

          fetchParties().then(
            updateLedger
          );
        }, 500);
      }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      start,
      { once: true }
    );
  } else {
    start();
  }
})();
