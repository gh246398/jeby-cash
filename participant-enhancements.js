
/*
 JEBY CASH
 Participant Dashboard Enhancements
 Version: 1.0
 Educational simulation only.
*/

(function () {
  "use strict";

  const STORAGE_PREFIX = "jeby_participant_ui_v1_";

  const SERVICES = [
    "تحويلات مالية",
    "إيداع",
    "سحب إداري",
    "الشحن والسداد",
    "دفع المشتريات",
    "السحب النقدي",
    "المدفوعات",
    "شراء أونلاين",
    "فواتير الخدمات",
    "الادخار",
    "إدارة المشاريع"
  ];

  const STYLE = `
    .jeby-extra-card {
      background: #fff;
      border: 1px solid #e9dedf;
      border-radius: 18px;
      padding: 17px;
      margin-bottom: 15px;
    }

    .jeby-extra-title {
      color: #571d35;
      font-size: 19px;
      margin: 0 0 10px;
    }

    .jeby-extra-note {
      color: #76676f;
      font-size: 13px;
      line-height: 1.9;
    }

    .jeby-extra-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 12px;
    }

    .jeby-extra-tile {
      min-height: 90px;
      background: #fcf8f5;
      color: #571d35;
      border: 1px solid #eaded6;
      border-radius: 14px;
      padding: 12px 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 8px;
      font-size: 13px;
      font-weight: bold;
      text-align: center;
      cursor: pointer;
    }

    .jeby-extra-icon {
      font-size: 26px;
      line-height: 1.3;
    }

    .jeby-extra-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;
    }

    .jeby-extra-actions button {
      flex: 1;
      min-width: 125px;
    }

    .jeby-extra-outline {
      background: #f6eee9;
      color: #571d35;
      border: 1px solid #dfc9bd;
    }

    .jeby-extra-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 5px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }

    .jeby-extra-option input {
      width: 20px;
      height: 20px;
      accent-color: #571d35;
    }

    .jeby-extra-hidden {
      display: none !important;
    }

    .jeby-extra-badge {
      display: inline-block;
      color: #77551c;
      background: #fff2d8;
      padding: 5px 10px;
      border-radius: 10px;
      font-size: 12px;
      margin-top: 8px;
    }

    @media (min-width: 650px) {
      .jeby-extra-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
  `;

  function element(tag, className, text) {
    const node = document.createElement(tag);

    if (className) {
      node.className = className;
    }

    if (text !== undefined) {
      node.textContent = text;
    }

    return node;
  }

  function createButton(text, className, action) {
    const button = element("button", className, text);
    button.type = "button";
    button.addEventListener("click", action);
    return button;
  }

  function getAccountKey() {
    const profile = document.getElementById("profileWallet");

    if (!profile) {
      return null;
    }

    const number = profile.textContent.trim();

    if (!number || number === "—") {
      return null;
    }

    return STORAGE_PREFIX + number;
  }

  function readPreferences() {
    const key = getAccountKey();

    if (!key) {
      return null;
    }

    try {
      const saved = localStorage.getItem(key);

      if (!saved) {
        return null;
      }

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        return null;
      }

      return parsed.filter(name => SERVICES.includes(name));
    } catch (error) {
      return null;
    }
  }

  function savePreferences(names) {
    const key = getAccountKey();

    if (!key) {
      alert("يرجى تسجيل الدخول أولاً.");
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(names));
      return true;
    } catch (error) {
      alert("تعذر حفظ التفضيلات على هذا الجهاز.");
      return false;
    }
  }

  function showNotice(title, description) {
    const overlay = element("div", "dialogback");
    const panel = element("div", "dialog");

    panel.appendChild(element("h2", "", title));
    panel.appendChild(element("p", "jeby-extra-note", description));

    const warning = element(
      "div",
      "jeby-extra-badge",
      "خدمة تعليمية افتراضية"
    );

    panel.appendChild(warning);

    panel.appendChild(
      createButton("إغلاق", "full", function () {
        overlay.remove();
      })
    );

    overlay.appendChild(panel);

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        overlay.remove();
      }
    });

    document.body.appendChild(overlay);
  }

  function getServiceButtons() {
    const grid = document.getElementById("serviceGrid");

    if (!grid) {
      return [];
    }

    return Array.from(grid.querySelectorAll("button.service"));
  }

  function serviceName(button) {
    const text = button.textContent.trim();

    return SERVICES.find(name => text.includes(name)) || null;
  }

  function applyPreferences() {
    const saved = readPreferences();
    const selected = saved === null ? SERVICES : saved;

    getServiceButtons().forEach(button => {
      const name = serviceName(button);

      if (!name) {
        return;
      }

      button.classList.toggle(
        "jeby-extra-hidden",
        !selected.includes(name)
      );
    });

    const count = document.getElementById("jebyServiceCount");

    if (count) {
      count.textContent =
        "الخدمات المعروضة: " + selected.length +
        " من " + SERVICES.length;
    }
  }

  function openCustomizer() {
    if (!getAccountKey()) {
      alert("سجل الدخول إلى حساب المشترك أولاً.");
      return;
    }

    const saved = readPreferences();
    const selected = new Set(saved === null ? SERVICES : saved);

    const overlay = element("div", "dialogback");
    const panel = element("div", "dialog");

    panel.appendChild(
      element("h2", "", "تخصيص خدماتي")
    );

    panel.appendChild(
      element(
        "p",
        "jeby-extra-note",
        "اختر الخدمات التي تريد ظهورها في مصفوفة المشترك. إخفاء الخدمة لا يحذف بياناتها أو عملياتها."
      )
    );

    const checks = [];

    SERVICES.forEach(name => {
      const label = element("label", "jeby-extra-option");
      const checkbox = document.createElement("input");

      checkbox.type = "checkbox";
      checkbox.checked = selected.has(name);

      label.appendChild(checkbox);
      label.appendChild(element("span", "", name));

      panel.appendChild(label);

      checks.push({
        name: name,
        checkbox: checkbox
      });
    });

    const actions = element("div", "jeby-extra-actions");

    actions.appendChild(
      createButton("حفظ الاختيارات", "", function () {
        const names = checks
          .filter(item => item.checkbox.checked)
          .map(item => item.name);

        if (savePreferences(names)) {
          applyPreferences();
          overlay.remove();
        }
      })
    );

    actions.appendChild(
      createButton(
        "إظهار جميع الخدمات",
        "jeby-extra-outline",
        function () {
          checks.forEach(item => {
            item.checkbox.checked = true;
          });
        }
      )
    );

    panel.appendChild(actions);

    panel.appendChild(
      createButton(
        "إلغاء",
        "jeby-extra-outline full",
        function () {
          overlay.remove();
        }
      )
    );

    overlay.appendChild(panel);

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        overlay.remove();
      }
    });

    document.body.appendChild(overlay);
  }

  function buildDashboard() {
    const grid = document.getElementById("serviceGrid");

    if (!grid || document.getElementById("jebyExtras")) {
      return;
    }

    const card = element("section", "jeby-extra-card");
    card.id = "jebyExtras";

    card.appendChild(
      element("h2", "jeby-extra-title", "خدمات المشترك الذكية")
    );

    card.appendChild(
      element(
        "p",
        "jeby-extra-note",
        "وصول سريع إلى الخدمات والتخصيص والإدارة المالية التعليمية."
      )
    );

    const tiles = element("div", "jeby-extra-grid");

    const items = [
      {
        icon: "📊",
        title: "نظامي المالي",
        action: function () {
          showNotice(
            "نظامي المالي",
            "سيتيح لك هذا القسم مستقبلًا متابعة الإيرادات والمصروفات والميزانية والتقارير الشخصية. لم يتم تفعيل المعالجة المالية لهذه الخدمة بعد."
          );
        }
      },
      {
        icon: "⚙️",
        title: "تخصيص خدماتي",
        action: openCustomizer
      },
      {
        icon: "💬",
        title: "شاركنا رأيك",
        action: function () {
          showNotice(
            "شاركنا رأيك",
            "يجري تجهيز خدمة المقترحات والشكاوى والاستبيانات. لم يتم تفعيل إرسال البيانات إلى الإدارة بعد."
          );
        }
      },
      {
        icon: "📈",
        title: "تقاريري",
        action: function () {
          const tab = document.querySelector(
            '[data-tab="reports"]'
          );

          if (tab) {
            tab.click();
          }
        }
      }
    ];

    items.forEach(item => {
      const tile = element("button", "jeby-extra-tile");
      tile.type = "button";

      tile.appendChild(
        element("span", "jeby-extra-icon", item.icon)
      );

      tile.appendChild(
        element("span", "", item.title)
      );

      tile.addEventListener("click", item.action);

      tiles.appendChild(tile);
    });

    card.appendChild(tiles);

    const count = element(
      "p",
      "jeby-extra-note",
      ""
    );

    count.id = "jebyServiceCount";

    card.appendChild(count);

    const serviceCard = grid.closest(".card");

    if (serviceCard && serviceCard.parentNode) {
      serviceCard.parentNode.insertBefore(card, serviceCard);
    }

    applyPreferences();
  }

  function init() {
    const style = document.createElement("style");
    style.textContent = STYLE;
    document.head.appendChild(style);

    buildDashboard();

    const profileWallet = document.getElementById(
      "profileWallet"
    );

    if (profileWallet) {
      const observer = new MutationObserver(function () {
        applyPreferences();
      });

      observer.observe(profileWallet, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }

    document.addEventListener("click", function (event) {
      const button = event.target.closest(
        '[data-tab="home"], [data-tab="services"]'
      );

      if (button) {
        applyPreferences();
      }
    });

    console.info(
      "JEBY CASH: Participant enhancements loaded."
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();


/*
 JEBY CASH
 Header Notifications Bell - V1
 Educational wallet simulation
*/
(function () {
  "use strict";

  if (window.JEBY_HEADER_BELL_V1) return;
  window.JEBY_HEADER_BELL_V1 = true;

  const $ = id => document.getElementById(id);

  function getDB() {
    try {
      return typeof db !== "undefined" ? db : null;
    } catch (e) {
      return null;
    }
  }

  function getUser() {
    try {
      return typeof user !== "undefined" ? user : null;
    } catch (e) {
      return null;
    }
  }

  function make(tag, text) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    return element;
  }

  const style = make("style");
  style.textContent = `
    .jeby-header-notifications {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .jeby-header-bell {
      position: relative;
      flex-shrink: 0;
      width: 43px;
      height: 43px;
      border: 1px solid #ffffff66;
      border-radius: 12px;
      background: #ffffff18;
      color: #fff;
      font-size: 23px;
      cursor: pointer;
    }

    .jeby-bell-count {
      position: absolute;
      top: -7px;
      left: -7px;
      min-width: 21px;
      height: 21px;
      padding: 0 4px;
      border-radius: 20px;
      background: #b58b42;
      color: #fff;
      font: bold 11px/21px Tahoma, Arial;
      text-align: center;
    }

    .jeby-bell-count[hidden] {
      display: none !important;
    }

    .jeby-notifications-overlay {
      position: fixed;
      inset: 0;
      z-index: 100050;
      background: #0009;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 15px;
      direction: rtl;
    }

    .jeby-notifications-panel {
      width: min(100%, 520px);
      max-height: 85vh;
      overflow-y: auto;
      border-radius: 16px;
      background: #fff;
      color: #342a30;
      padding: 18px;
      font: 14px/1.8 Tahoma, Arial;
    }

    .jeby-notification-card {
      border: 1px solid #e9dedf;
      border-radius: 10px;
      padding: 12px;
      margin: 10px 0;
    }

    .jeby-notification-unread {
      background: #fff8e9;
    }

    .jeby-notification-action {
      padding: 9px 13px;
      margin: 5px;
      border: 1px solid #b58b42;
      border-radius: 9px;
      background: #fffaf2;
      color: #571d35;
      cursor: pointer;
      font: 13px Tahoma, Arial;
    }
  `;

  document.head.appendChild(style);

  function action(text, handler) {
    const button = make("button", text);
    button.type = "button";
    button.className = "jeby-notification-action";
    button.addEventListener("click", handler);
    return button;
  }

  function createBell() {
    const header = document.querySelector("header");

    if (!header || $("jeby-header-bell")) return;

    const heading = header.querySelector("h1");

    if (!heading) return;

    const container = make("div");
    container.className = "jeby-header-notifications";

    const bell = make("button", "🔔");
    bell.id = "jeby-header-bell";
    bell.type = "button";
    bell.className = "jeby-header-bell";
    bell.setAttribute("aria-label", "مركز الإشعارات");

    const badge = make("span");
    badge.id = "jeby-bell-count";
    badge.className = "jeby-bell-count";
    badge.hidden = true;

    bell.appendChild(badge);

    heading.parentNode.insertBefore(container, heading);
    container.append(heading, bell);

    bell.addEventListener("click", openNotifications);
  }

  let countLoading = false;

  async function refreshCount() {
    if (countLoading) return;

    const client = getDB();
    const current = getUser();
    const badge = $("jeby-bell-count");

    if (!badge) return;

    if (!client || !current?.id) {
      badge.hidden = true;
      badge.textContent = "";
      return;
    }

    countLoading = true;

    try {
      const { count, error } = await client
        .from("jeby_notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_user_id", current.id)
        .is("read_at", null);

      if (error) {
        console.warn("JEBY notification count:", error.message);
        return;
      }

      badge.hidden = !count;
      badge.textContent = count > 99
        ? "99+"
        : String(count || "");

    } catch (error) {
      console.warn("JEBY notification count:", error);
    } finally {
      countLoading = false;
    }
  }

  async function openNotifications() {
    const existing = $("jeby-notifications-overlay");

    if (existing) return;

    const overlay = make("div");
    overlay.id = "jeby-notifications-overlay";
    overlay.className = "jeby-notifications-overlay";

    const panel = make("section");
    panel.className = "jeby-notifications-panel";

    const title = make("h2", "🔔 مركز الإشعارات");
    const close = action("إغلاق", () => overlay.remove());

    panel.append(title, close);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) overlay.remove();
    });

    const client = getDB();
    const current = getUser();

    if (!client || !current?.id) {
      panel.appendChild(
        make("p", "يرجى تسجيل الدخول لعرض الإشعارات.")
      );
      return;
    }

    const loading = make("p", "جارٍ تحميل الإشعارات...");
    panel.appendChild(loading);

    try {
      const { data, error } = await client
        .from("jeby_notifications")
        .select("id,title,body,created_at,read_at")
        .eq("recipient_user_id", current.id)
        .order("created_at", { ascending: false })
        .limit(100);

      loading.remove();

      if (error) {
        panel.appendChild(
          make("p", "تعذر تحميل الإشعارات: " + error.message)
        );
        return;
      }

      const notifications = data || [];

      if (!notifications.length) {
        panel.appendChild(make("p", "لا توجد إشعارات حاليًا."));
        return;
      }

      const unread = notifications.filter(n => !n.read_at);

      if (unread.length) {
        const markAll = action(
          "✓ تحديد الكل كمقروء",
          async () => {
            markAll.disabled = true;

            const ids = notifications
              .filter(n => !n.read_at)
              .map(n => n.id);

            if (!ids.length) {
              markAll.remove();
              return;
            }

            const { error: updateError } = await client
              .from("jeby_notifications")
              .update({
                read_at: new Date().toISOString()
              })
              .eq("recipient_user_id", current.id)
              .in("id", ids);

            if (updateError) {
              markAll.disabled = false;
              alert("تعذر تحديث الإشعارات.");
              return;
            }

            notifications.forEach(n => {
              n.read_at = n.read_at || new Date().toISOString();
            });

            panel
              .querySelectorAll(".jeby-notification-unread")
              .forEach(card => {
                card.classList.remove(
                  "jeby-notification-unread"
                );
              });

            panel
              .querySelectorAll("[data-mark-one]")
              .forEach(button => button.remove());

            markAll.remove();
            await refreshCount();
          }
        );

        panel.appendChild(markAll);
      }

      for (const notification of notifications) {
        const card = make("article");
        card.className = "jeby-notification-card";

        if (!notification.read_at) {
          card.classList.add("jeby-notification-unread");
        }

        const itemTitle = make(
          "strong",
          notification.title || "إشعار"
        );

        const body = make(
          "p",
          notification.body || ""
        );

        const date = make(
          "small",
          new Date(
            notification.created_at
          ).toLocaleString("ar-YE")
        );

        card.append(itemTitle, body, date);

        if (!notification.read_at) {
          const mark = action("✓ مقروء", async () => {
            mark.disabled = true;

            const { error: updateError } = await client
              .from("jeby_notifications")
              .update({
                read_at: new Date().toISOString()
              })
              .eq("recipient_user_id", current.id)
              .eq("id", notification.id);

            if (updateError) {
              mark.disabled = false;
              alert("تعذر تحديث الإشعار.");
              return;
            }

            notification.read_at = new Date().toISOString();
            card.classList.remove(
              "jeby-notification-unread"
            );
            mark.remove();

            await refreshCount();
          });

          mark.dataset.markOne = "1";
          card.appendChild(mark);
        }

        panel.appendChild(card);
      }

    } catch (error) {
      loading.remove();
      panel.appendChild(
        make("p", "حدث خطأ أثناء تحميل الإشعارات.")
      );
      console.warn(error);
    }
  }

  function start() {
    createBell();
    refreshCount();

    let lastUserId = getUser()?.id || null;

    setInterval(() => {
      const currentId = getUser()?.id || null;

      if (currentId !== lastUserId) {
        lastUserId = currentId;
      }

      refreshCount();
    }, 15000);
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

