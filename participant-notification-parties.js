
/*
 * JEBY CASH — Notification Transfer Parties
 * Version 1.0
 * Educational simulation only
 *
 * Adds verified sender and recipient details to
 * existing notification cards without modifying
 * the original notification system.
 */

(function () {
  "use strict";

  if (window.JEBY_NOTIFICATION_PARTIES_V1) return;
  window.JEBY_NOTIFICATION_PARTIES_V1 = true;

  const OVERLAY_ID = "jeby-notifications-overlay";
  const RPC_NAME = "jeby_get_transaction_parties";

  let activeOverlay = null;
  let processing = false;

  function getClient() {
    try {
      return typeof db !== "undefined" ? db : null;
    } catch (_) {
      return null;
    }
  }

  function getCurrentUser() {
    try {
      return typeof user !== "undefined" ? user : null;
    } catch (_) {
      return null;
    }
  }

  function validTransactionId(value) {
    if (value === null || value === undefined) {
      return null;
    }

    const id = Number(value);

    return Number.isSafeInteger(id) && id > 0
      ? id
      : null;
  }

  function walletLabel(name, wallet) {
    const safeName =
      typeof name === "string" && name.trim()
        ? name.trim()
        : "غير متاح";

    const safeWallet =
      wallet !== null &&
      wallet !== undefined &&
      String(wallet).trim()
        ? String(wallet)
        : "غير متاح";

    return safeName + " — رقم المحفظة: " + safeWallet;
  }

  function makeIdentityPanel(parties) {
    const container = document.createElement("div");

    container.className = "jeby-notification-parties";
    container.setAttribute(
      "aria-label",
      "بيانات أطراف التحويل"
    );

    container.style.cssText = [
      "direction:rtl",
      "text-align:right",
      "margin-top:10px",
      "padding:10px",
      "border:1px solid #e5d8bf",
      "border-radius:10px",
      "background:#fffaf2",
      "color:#571d35",
      "font-size:12px",
      "line-height:2",
      "overflow-wrap:anywhere"
    ].join(";");

    const heading = document.createElement("strong");
    heading.textContent = "بيانات أطراف التحويل";
    heading.style.display = "block";

    const sender = document.createElement("div");
    sender.textContent =
      "المرسل: " +
      walletLabel(
        parties.sender_name,
        parties.sender_wallet
      );

    const recipient = document.createElement("div");
    recipient.textContent =
      "المستفيد: " +
      walletLabel(
        parties.recipient_name,
        parties.recipient_wallet
      );

    container.append(heading, sender, recipient);

    return container;
  }

  async function loadNotificationData(client, userId) {
    const result = await client
      .from("jeby_notifications")
      .select(
        "id,transaction_id,title,body,created_at"
      )
      .eq("recipient_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (result.error) {
      throw result.error;
    }

    return result.data || [];
  }

  async function loadParties(client, notifications) {
    const ids = [
      ...new Set(
        notifications
          .map(n => validTransactionId(n.transaction_id))
          .filter(id => id !== null)
      )
    ];

    const resultMap = new Map();

    if (!ids.length) return resultMap;

    // Query only transactions associated with the
    // current user's visible notifications.
    // The RPC independently verifies access rights.

    const result = await client.rpc(RPC_NAME, {
      p_transaction_ids: ids
    });

    if (result.error) {
      throw result.error;
    }

    for (const item of result.data || []) {
      const id = validTransactionId(
        item.transaction_id
      );

      if (id !== null) {
        resultMap.set(id, item);
      }
    }

    return resultMap;
  }

  function normalize(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cardMatchesNotification(card, notification) {
    const title = card.querySelector("strong");
    const body = card.querySelector("p");

    if (!title || !body) return false;

    return (
      normalize(title.textContent) ===
        normalize(notification.title || "إشعار") &&
      normalize(body.textContent) ===
        normalize(notification.body || "")
    );
  }

  function enhanceCards(
    overlay,
    notifications,
    partiesMap
  ) {
    if (!overlay.isConnected) return;

    const cards = Array.from(
      overlay.querySelectorAll(
        ".jeby-notification-card"
      )
    );

    // The original notification screen displays
    // notifications in the same descending date order.
    // Do not attach identities when this correspondence
    // cannot be verified.

    if (cards.length !== notifications.length) {
      return;
    }

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const notification = notifications[i];

      if (!cardMatchesNotification(card, notification)) {
        continue;
      }

      if (
        card.querySelector(
          ".jeby-notification-parties"
        )
      ) {
        continue;
      }

      const transactionId = validTransactionId(
        notification.transaction_id
      );

      if (transactionId === null) continue;

      const parties = partiesMap.get(transactionId);

      if (!parties) continue;

      const panel = makeIdentityPanel(parties);

      const date = card.querySelector("small");

      if (date) {
        date.insertAdjacentElement(
          "beforebegin",
          panel
        );
      } else {
        card.appendChild(panel);
      }
    }
  }

  async function enhanceOverlay(overlay) {
    if (
      processing ||
      !overlay ||
      !overlay.isConnected
    ) {
      return;
    }

    const client = getClient();
    const current = getCurrentUser();

    if (!client || !current?.id) return;

    processing = true;

    try {
      const notifications =
        await loadNotificationData(
          client,
          current.id
        );

      if (!overlay.isConnected) return;

      const partiesMap = await loadParties(
        client,
        notifications
      );

      if (!overlay.isConnected) return;

      // Wait for the original notification renderer
      // if its asynchronous request is still running.

      let attempts = 0;

      while (
        overlay.isConnected &&
        attempts < 30
      ) {
        const cards = overlay.querySelectorAll(
          ".jeby-notification-card"
        );

        if (cards.length === notifications.length) {
          enhanceCards(
            overlay,
            notifications,
            partiesMap
          );
          break;
        }

        if (
          !notifications.length ||
          overlay.querySelector(
            ".jeby-notification-card"
          ) === null &&
          overlay.textContent.includes(
            "تعذر تحميل الإشعارات"
          )
        ) {
          break;
        }

        await new Promise(resolve => {
          setTimeout(resolve, 200);
        });

        attempts++;
      }
    } catch (error) {
      console.warn(
        "JEBY notification parties:",
        error?.message || error
      );
    } finally {
      processing = false;
    }
  }

  function checkOverlay() {
    const overlay = document.getElementById(
      OVERLAY_ID
    );

    if (!overlay) {
      activeOverlay = null;
      return;
    }

    if (overlay === activeOverlay) return;

    activeOverlay = overlay;
    enhanceOverlay(overlay);
  }

  function start() {
    const observer = new MutationObserver(
      checkOverlay
    );

    observer.observe(document.body, {
      childList: true
    });

    checkOverlay();

    console.info(
      "JEBY notification party extension ready."
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
