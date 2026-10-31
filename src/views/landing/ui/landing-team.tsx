import Image from "next/image";
import { Gauge, Layers3, Network, ShieldCheck } from "lucide-react";
import portrait from "@/shared/assets/landing/alireza.jpeg";
import { cx } from "./classes";

export function LandingTeam() {
  return (
    <section id="team" className={cx("landing-team landing-section")}>
          <div className={cx("team-portrait")}>
            <Image src={portrait} alt="پرتره علیرضا، متخصص شبکه و امنیت و طراح محصول" sizes="(max-width: 700px) calc(100vw - 56px), 420px" />
            <span><i /> شبکه · امنیت · طراحی محصول</span>
          </div>
          <div className={cx("team-copy")}>
            <span>درباره طراح سامانه</span><h2>علیرضا</h2>
            <h3>متخصص شبکه و امنیت، طراح سامانه</h3>
            <p>علیرضا، متخصص شبکه و امنیت و طراح این سامانه است. در طراحی Firewall SOAR، نمایش روشن وضعیت تجهیزات، دسترسی ساده به فرمان‌ها و بررسی هر اقدام پیش از اجرا در اولویت قرار دارد.</p>
            <div className={cx("team-values")}><span><Network /> معماری شبکه</span><span><ShieldCheck /> عملیات امنیت</span><span><Layers3 /> طراحی محصول</span><span><Gauge /> رابط کاربری</span></div>
          </div>
        </section>
  );
}
