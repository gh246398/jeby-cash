
/*
 JEBY CASH — Unified Subscriber Dashboard
 Version 3.0
 Educational simulation only
*/

(function () {
  "use strict";

  const STYLE_ID = "jeby-unified-v3-style";
  const PERSONAL_SERVICES_ID = "jeby-personal-services";
  const FINANCIAL_SERVICES_ID = "jeby-financial-services";

  function element(tag, className, text) {
    const node = document.createElement(tag);

    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;

    return node;
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = element("style");
    style.id = STYLE_ID;

    style.textContent = `
      .jeby-group {
        margin-bottom: 15px;
      }

      .jeby-group-title {
        color: #571d35;
        font-size: 19px;
        margin: 0 0 9px;
      }

      .jeby-group-desc {
        color: #76676f;
        font-size: 12px;
        line-height: 1.8;
        margin: 0 0 15px;
      }

      .jeby-group-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 9px;
      }

      .jeby-group-tile {
        min-width: 0;
        min-height: 96px;
        padding: 12px 5px;
        border: 1px solid #eaded6;
        border-radius: 13px;
        background: #fcf8f5;
        color: #571d35;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 8px;
        text-align: center;
        font-size: 12px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      .jeby-group-tile:focus-visible {
        outline: 3px solid #b58b42;
        outline-offset: 2px;
      }

      .jeby-group-icon {
        font-size: 27px;
        line-height: 1.2;
      }

      .jeby-group-note {
        background: #fff2d8;
        border: 1px solid #e4c899;
        color: #624521;
        padding: 11px;
        border-radius: 12px;
        font-size: 12px;
        line-height: 1.8;
        margin-top: 12px;
      }

      #serviceGrid .service {
        min-width: 0;
        padding: 10px 5px;
        overflow-wrap: anywhere;
      }

      @media (max-width: 360px) {
        .jeby-group-grid,
        #serviceGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createTile(icon, title, action) {
    const button = element(
      "button",
      "jeby-group-tile"
    );

    button.type = "button";

    const symbol = element(
      "span",
      "jeby-group-icon",
      icon
    );

    const label = element("span", "", title);

    button.append(symbol, label);
    button.addEventListener("click", action);

    return button;
  }

  function showNotice(title, description) {
    const overlay = element("div", "dialogback");
    const panel = element("div", "dialog");

    panel.append(
      element("h2", "", title),
      element("p", "muted", description)
    );

    const close = element(
      "button",
      "full",
      "إغلاق"
    );

    close.type = "button";
    close.onclick = () => overlay.remove();

    panel.append(close);
    overlay.append(panel);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) overlay.remove();
    });

    document.body.append(overlay);
  }

  function openReports() {
    const tab = document.querySelector(
      '[data-tab="reports"]'
    );

    if (tab) tab.click();
  }

  function openProfile() {
    const tab = document.querySelector(
      '[data-tab="profile"]'
    );

    if (tab) tab.click();
  }

  function makeGroup(id, title, description) {
    const section = element(
      "section",
      "card jeby-group"
    );

    section.id = id;

    section.append(
      element("h2", "jeby-group-title", title),
      element("p", "jeby-group-desc", description)
    );

    const grid = element(
      "div",
      "jeby-group-grid"
    );

    section.append(grid);

    return { section, grid };
  }

  function findExistingButton(container, title) {
    if (!container) return null;

    return Array.from(
      container.querySelectorAll("button")
    ).find(button =>
      button.textContent.includes(title)
    ) || null;
  }

  function buildDashboard() {
    const home = document.getElementById("homeView");
    const serviceGrid = document.getElementById("serviceGrid");

    if (!home || !serviceGrid) return;

    if (document.getElementById(FINANCIAL_SERVICES_ID)) {
      return;
    }

    addStyles();

    // إزالة القسم التمهيدي المكرر.
    const oldPanel = document.getElementById(
      "jeby-phase1-panel"
    );

    if (oldPanel) oldPanel.remove();

    const oldExtras = document.getElementById(
      "jebyExtras"
    );

    // الاحتفاظ بالأزرار القديمة الفعالة.
    const customize = findExistingButton(
      oldExtras,
      "تخصيص خدماتي"
    );

    const feedback = findExistingButton(
      oldExtras,
      "شاركنا رأيك"
    );

    // القسم الأول: العمليات المالية.
    const originalCard = serviceGrid.closest(".card");

    if (originalCard) {
      const heading = originalCard.querySelector("h2");

      if (heading) {
        heading.textContent = "العمليات المالية";
      }

      originalCard.classList.add("jeby-group");

      const description = element(
        "p",
        "jeby-group-desc",
        "التحويلات والإيداع والسحب والسداد والمشتريات."
      );

      if (heading) {
        heading.insertAdjacentElement(
          "afterend",
          description
        );
      }
    }

    // القسم الثاني: الإدارة المالية والتخطيط.
    const financial = makeGroup(
      FINANCIAL_SERVICES_ID,
      "الإدارة المالية والتخطيط",
      "متابعة أموالك الافتراضية والتخطيط والادخار والتقارير."
    );

    financial.grid.append(
      createTile("📊", "نظامي المالي", () => {
        showNotice(
          "نظامي المالي",
          "يجري تطوير تصنيف الإيرادات والمصروفات " +
          "وربط العمليات بالتقارير المالية التدريبية."
        );
      }),

      createTile("🎯", "ميزانياتي", () => {
        showNotice(
          "ميزانياتي",
          "يجري تجهيز الميزانيات التدريبية " +
          "ومتابعة الانحرافات بين المخطط والفعلي."
        );
      }),

      createTile("🏦", "الادخار", () => {
        const button = findExistingButton(
          serviceGrid,
          "الادخار"
        );

        if (button) button.click();
      }),

      createTile("📁", "مشاريعي", () => {
        const button = findExistingButton(
          serviceGrid,
          "إدارة المشاريع"
        );

        if (button) button.click();
      }),

      createTile("📈", "التقارير", openReports)
    );

    // الرواتب: لا تظهر دون صلاحية تجارية موثوقة.
    // يُضاف الزر هنا مستقبلًا بعد التحقق من نوع الحساب
    // على الخادم وتفعيل صلاحيات خدمة الرواتب.
    //
    // الاسم المعتمد:
    // "رواتب وحوافز الموظفين"

    // إخفاء تكرار الادخار والمشاريع في العمليات.
    // تظل الأزرار الأصلية موجودة لتعمل وظائفها.
    ["الادخار", "إدارة المشاريع"].forEach(title => {
      const button = findExistingButton(
        serviceGrid,
        title
      );

      if (button) {
        button.style.display = "none";
      }
    });

    // القسم الثالث: الخدمات الشخصية.
    const personal = makeGroup(
      PERSONAL_SERVICES_ID,
      "الخدمات الشخصية والمساندة",
      "تخصيص الواجهة والتواصل وإعدادات الحساب."
    );

    if (customize) {
      customize.className = "jeby-group-tile";
      personal.grid.append(customize);
    } else {
      personal.grid.append(
        createTile("⚙️", "تخصيص خدماتي", () => {
          showNotice(
            "تخصيص خدماتي",
            "خدمة التخصيص غير متاحة حاليًا."
          );
        })
      );
    }

    if (feedback) {
      feedback.className = "jeby-group-tile";
      personal.grid.append(feedback);
    } else {
      personal.grid.append(
        createTile("💬", "شاركنا رأيك", () => {
          showNotice(
            "شاركنا رأيك",
            "يجري تجهيز استقبال المقترحات والملاحظات."
          );
        })
      );
    }

    personal.grid.append(
      createTile("🔐", "الأمان والحساب", openProfile)
    );

    // إدراج القسمين بعد العمليات المالية.
    if (originalCard) {
      originalCard.insertAdjacentElement(
        "afterend",
        financial.section
      );

      financial.section.insertAdjacentElement(
        "afterend",
        personal.section
      );
    } else {
      home.append(financial.section, personal.section);
    }

    // إزالة قسم الخدمات الذكية القديم بعد نقل أزراره.
    if (oldExtras) oldExtras.remove();

    // لا يتم تنفيذ أي عملية مالية جديدة من هذا الملف.
  }

  function init() {
    buildDashboard();
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
