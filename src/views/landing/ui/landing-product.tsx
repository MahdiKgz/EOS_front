import { Check } from "lucide-react";
import { productViews } from "../model/content";
import { ScreenshotFrame } from "./screenshot-frame";
import { cx } from "./classes";

export function LandingProduct() {
  return (
    <section id="product" className={cx("landing-product landing-section")}>
      <div className={cx("landing-section__intro")}>
        <span>معرفی سامانه</span>
        <h2>پایش و مدیریت شبکه در یک محیط</h2>
        <p>
          وضعیت شبکه را در داشبورد ببینید، فرمان‌ها را مدیریت کنید و برای بررسی هشدارها از دستیار
          هوشمند کمک بگیرید.
        </p>
      </div>

      <div className={cx("product-stories product-stories--images")}>
        {productViews.map((item) => (
          <article
            className={cx(`product-story product-story--image product-story--${item.accent}`)}
            key={item.index}
          >
            <div className={cx("product-story__copy")}>
              <span>
                <b>{item.index}</b>
                {item.eyebrow}
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className={cx("story-facts")}>
                {item.facts.map((fact) => (
                  <span key={fact}>
                    <Check />
                    {fact}
                  </span>
                ))}
              </div>
            </div>
            <div className={cx("showcase-stage")}>
              <ScreenshotFrame
                image={item.image}
                alt={item.alt}
                label={`Firewall SOAR · ${item.index}`}
              />
              <span className={cx("showcase-depth showcase-depth--one")} aria-hidden="true" />
              <span className={cx("showcase-depth showcase-depth--two")} aria-hidden="true" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
