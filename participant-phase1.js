
/*
 JEBY CASH
 Compact Subscriber Dashboard — V4
 Educational simulation only
*/

(function () {
  "use strict";

  const STYLE_ID = "jeby-compact-v4-css";

  function node(tag, className = "", text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function styles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = node("style");
    style.id = STYLE_ID;

    style.textContent = `
      /* شبكة موحدة: أربعة أعمدة */
      #serviceGrid,
      .jeby-compact-grid {
        display: grid !important;
        grid-template-columns:
          repeat(4, minmax(0, 1fr)) !important;
        gap: 7px !important;
        align-items: stretch;
      }

      /* حجم أيقونات العمليات */
      #serviceGrid .service,
      .jeby-compact-tile {
        width: 100%;
        min-width: 0;
        min-height: 75px !important;
        padding: 8px 3px !important;
        border-radius: 11px !important;
        background: #fcf9f7 !important;
        border: 1px solid #eee3df !important;
        color: #571d35 !important;
        font-family: Tahoma, Arial, sans-serif;
        font-size: 10px !important;
        font-weight: 500;
        line-height: 1.5;
        text-align: center;
        overflow-wrap: anywhere;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        box-shadow: none !important;
        transition: background .15s ease;
      }

      #serviceGrid .service:hover,
      .jeby-compact-tile:hover {
        background: #f4eae6 !important;
      }

      .jeby-compact-icon {
        font-size: 22px;
        line-height: 1.15;
        display: block;
      }

      .jeby-compact-label {
        display: block;
        font-size: 10px;
        line-height: 1.45;
        max-width: 100%;
      }

      .jeby-compact-section {
        margin-bottom: 13px;
        padding: 14px 12px;
      }

      .jeby-compact-section h2 {
        font-size: 16px;
        margin-bottom: 5px;
        color: #571d35;
      }

      .jeby-compact-description {
        font-size: 11px;
        color: #887980;
        margin: 0 0 12px;
        line-height: 1.7;
      }

      .jeby-compact-tile:focus-visible,
      #serviceGrid .service:focus-visible {
        outline: 2px solid #b58b42;
        outline-offset: 2px;
      }

      /* إخفاء تكرار الخدمات دون تعطيلها */
      .jeby-compact-moved {
        display: none !important;
      }

      @media (max-width: 340px) {
        #serviceGrid,
        .jeby-compact-grid {
          grid-template-columns:
            repeat(3, minmax(0, 1fr)) !important;
        }
      }
    `;

    document.head.append(style);
  }

  function tile(icon, label, action) {
    const b = node("button", "jeby-compact-tile");
    b.type = "button";

    b.append(
      node("span", "jeby-compact-icon", icon),
      node("span", "jeby-compact-label", label)
    );

    b.addEventListener("click", action);
    return b;
  }

  function group(id, title, description) {
    const section = node(
      "section",
      "card jeby-compact-section"
    );
    section.id = id;

    section.append(
      node("h2", "", title),
      node(
        "p",
        "jeby-compact-description",
        description
      )
    );

    const grid = node("div", "jeby-compact-grid");
    section.append(grid);

    return { section, grid };
  }

  function findButton(container, name) {
    if (!container) return null;

    return Array.from(
      container.querySelectorAll("button")
    ).find(b => b.textContent.includes(name)) || null;
  }

  function notice(title, message) {
    const overlay = node("div", "dialogback");
    const panel = node("div", "dialog");

    const close = node("button", "full", "إغلاق");
    close.type = "button";
    close.onclick = () => overlay.remove();

    panel.append(
      node("h2", "", title),
      node("p", "muted", message),
      close
    );

    overlay.append(panel);

    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.append(overlay);
  }

  function clickTab(tab) {
    const b = document.querySelector(
      '[data-tab="' + tab + '"]'
    );
    if (b) b.click();
  }

  function runOriginal(name) {
    const grid = document.getElementById("serviceGrid");
    const b = findButton(grid, name);

    if (b) {
      b.click();
    } else {
      notice(
        name,
        "الخدمة غير متاحة في النسخة الحالية."
      );
    }
  }

  function compactOriginalButtons(grid) {
    Array.from(grid.querySelectorAll("button.service"))
      .forEach(button => {
        if (button.dataset.jebyCompact === "1") return;

        const text = button.textContent.trim();
        const match = text.match(
          /^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s+(.+)$/u
        );

        if (match) {
          button.replaceChildren(
            node("span", "jeby-compact-icon", match[1]),
            node("span", "jeby-compact-label", match[2])
          );
        }

        button.dataset.jebyCompact = "1";
      });
  }

  function init() {
    const home = document.getElementById("homeView");
    const grid = document.getElementById("serviceGrid");

    if (!home || !grid) return;

    if (document.getElementById("jeby-finance-v4")) {
      return;
    }

    styles();

    const original = grid.closest(".card");
    if (!original) return;

    original.classList.add("jeby-compact-section");

    const heading = original.querySelector("h2");
    if (heading) {
      heading.textContent = "العمليات المالية";
    }

    compactOriginalButtons(grid);

    const oldExtras = document.getElementById("jebyExtras");
    const customize = findButton(
      oldExtras,
      "تخصيص خدماتي"
    );
    const feedback = findButton(
      oldExtras,
      "شاركنا رأيك"
    );

    const financial = group(
      "jeby-finance-v4",
      "الإدارة المالية والتخطيط",
      "التخطيط والادخار والتحليل المالي."
    );

    financial.grid.append(
      tile("📊", "نظامي المالي", () => {
        notice(
          "نظامي المالي",
          "يجري تطوير تصنيف العمليات والإيرادات والمصروفات."
        );
      }),
      tile("🎯", "ميزانياتي", () => {
        notice(
          "ميزانياتي",
          "يجري تطوير الميزانيات التدريبية ومتابعة الانحرافات."
        );
      }),
      tile("🏦", "الادخار", () => {
        runOriginal("الادخار");
      }),
      tile("📁", "مشاريعي", () => {
        runOriginal("إدارة المشاريع");
      }),
      tile("📈", "التقارير", () => {
        clickTab("reports");
      })
    );

    // رواتب وحوافز الموظفين:
    // موقعها المعتمد هنا ضمن الإدارة المالية.
    // لا تظهر حتى يتأكد الخادم من صلاحية الحساب التجاري.

    ["الادخار", "إدارة المشاريع"].forEach(name => {
      const b = findButton(grid, name);
      if (b) b.classList.add("jeby-compact-moved");
    });

    const personal = group(
      "jeby-personal-v4",
      "الخدمات الشخصية والمساندة",
      "إعدادات المحفظة والتواصل."
    );

    if (customize) {
      const originalClick = () => customize.click();

      personal.grid.append(
        tile("⚙️", "تخصيص خدماتي", originalClick)
      );
    }

    if (feedback) {
      const originalClick = () => feedback.click();

      personal.grid.append(
        tile("💬", "شاركنا رأيك", originalClick)
      );
    }

    personal.grid.append(
      tile("🔐", "الأمان والحساب", () => {
        clickTab("profile");
      })
    );

    original.insertAdjacentElement(
      "afterend",
      financial.section
    );

    financial.section.insertAdjacentElement(
      "afterend",
      personal.section
    );

    if (oldExtras) {
      oldExtras.style.display = "none";
    }

    const oldPanel = document.getElementById(
      "jeby-phase1-panel"
    );
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
