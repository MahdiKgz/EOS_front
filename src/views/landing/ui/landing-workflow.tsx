import { Eye, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { cx } from "./classes";

export function LandingWorkflow() {
  return (
    <section id="workflow" className={cx("landing-workflow landing-section")}>
      <div className={cx("workflow-copy")}>
        <span>مراحل اجرای فرمان</span>
        <h2>از انتخاب فرمان تا مشاهده نتیجه</h2>
        <p>
          پیش از اجرا، دستگاه مقصد و تنظیمات فرمان را بررسی می‌کنید. پس از تأیید شما و بررسی مجوزها،
          فرمان اجرا می‌شود و نتیجه آن در سوابق سامانه ثبت می‌شود.
        </p>
      </div>
      <ol className={cx("workflow-steps")}>
        <li>
          <span>01</span>
          <div>
            <Sparkles />
            <strong>انتخاب فرمان</strong>
            <small>از فهرست یا پیشنهاد دستیار</small>
          </div>
        </li>
        <li>
          <span>02</span>
          <div>
            <Eye />
            <strong>بررسی جزئیات</strong>
            <small>دستگاه مقصد و تنظیمات</small>
          </div>
        </li>
        <li>
          <span>03</span>
          <div>
            <ShieldCheck />
            <strong>تأیید اجرا</strong>
            <small>تأیید شما و بررسی مجوزها</small>
          </div>
        </li>
        <li>
          <span>04</span>
          <div>
            <Workflow />
            <strong>مشاهده نتیجه</strong>
            <small>وضعیت اجرا و سوابق آن</small>
          </div>
        </li>
      </ol>
    </section>
  );
}
