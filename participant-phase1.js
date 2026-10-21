
/*
  JEBY CASH
  Phase 1 — Subscriber Services
  Educational simulation only
*/

(function () {
  "use strict";

  const STYLE_ID = "jeby-phase1-style";
  const PANEL_ID = "jeby-phase1-panel";

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID} {
        direction: rtl;
        margin: 20px auto;
        padding: 18px;
        max-width: 1100px;
        background: #fff;
        border: 1px solid #e8dce1;
        border-radius: 16px;
        font-family: Tahoma, Arial, sans-serif;
      }

      #${PANEL_ID} h2 {
        color: #571d35;
        margin: 0 0 8px;
      }

      #${PANEL_ID} .jeby-note {
        color: #66565d;
        font-size: 13px;
        line-height: 1.8;
      }

      #${PANEL_ID} .jeby-grid {
        display: grid;
        grid-template-columns:
          repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
        margin-top: 16px;
      }

      #${PANEL_ID} .jeby-tile {
        padding: 20px 12px;
        border: 1px solid #e8dce1;
        border-radius: 12px;
        background: #fcf9f7;
        color: #571d35;
        cursor: pointer;
        font: inherit;
        text-align: center;
      }

      #${PANEL_ID} .jeby-tile:hover {
        background: #f3e9e8;
      }

      #${PANEL_ID} .jeby-icon {
        display: block;
        font-size: 30px;
        margin-bottom: 10px;
      }

      #${PANEL_ID} .jeby-detail {
        margin-top: 16px;
        padding: 15px;
        background: #f8f4f0;
        border-radius: 12px;
        line-height: 2;
      }

      #${PANEL_ID} .jeby-detail[hidden] {
        display: none;
      }
    `;

    document.head.appendChild(style);
  }

  const services = [
    {
      title: "نظامي المالي",
      icon: "📊",
      description:
        "تصنيف العمليات المالية ومتابعة الإيرادات " +
        "والمصروفات والتقارير."
    },
    {
      title: "تقاريري المالية",
      icon: "📈",
      description:
        "تقارير يومية وأسبوعية ونصف شهرية وشهرية، " +
        "مع تحليل الحركة حسب العملة."
    },
    {
      title: "ميزانياتي",
      icon: "🎯",
      description:
        "إعداد ميزانيات تدريبية للمصروفات " +
        "ومتابعة الانحرافات."
    },
    {
      title: "مرتبات وحوافز الموظفين",
      icon: "👥",
      description:
        "خدمة مخصصة للحسابات التجارية. " +
        "تتطلب تفعيل نوع الحساب والصلاحيات " +
        "قبل السماح بصرف أي مبالغ افتراضية."
    }
  ];

  function createPanel() {
    if (document.getElementById(PANEL_ID)) return;

    addStyles();

    const panel = document.createElement("section");
    panel.id = PANEL_ID;

    const heading = document.createElement("h2");
    heading.textContent = "خدمات المشترك — المرحلة الأولى";

    const note = document.createElement("p");
    note.className = "jeby-note";
    note.textContent =
      "هذه واجهة تمهيدية للخدمات قيد التطوير. " +
      "لا تنفذ تحويلات أو خصومات أو إضافات إلى الرصيد.";

    const grid = document.createElement("div");
    grid.className = "jeby-grid";

    const detail = document.createElement("div");
    detail.className = "jeby-detail";
    detail.hidden = true;
    detail.setAttribute("role", "status");
    detail.setAttribute("aria-live", "polite");

    services.forEach(function (service) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "jeby-tile";

      const icon = document.createElement("span");
      icon.className = "jeby-icon";
      icon.textContent = service.icon;

      const label = document.createElement("span");
      label.textContent = service.title;

      button.appendChild(icon);
      button.appendChild(label);

      button.addEventListener("click", function () {
        detail.hidden = false;
        detail.textContent =
          service.title + " — " + service.description +
          " هذه الخدمة لم تُفعّل بعد.";
      });

      grid.appendChild(button);
    });

    panel.appendChild(heading);
    panel.appendChild(note);
    panel.appendChild(grid);
    panel.appendChild(detail);

    const main = document.querySelector("main");

    if (main) {
      main.appendChild(panel);
    } else {
      document.body.appendChild(panel);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      createPanel,
      { once: true }
    );
  } else {
    createPanel();
  }
})();
