import { SmoothSectionNavigation } from "@/features/navigate-sections";
import { iranYekan } from "@/shared/config/fonts";
import { cx } from "./classes";
import { LandingHeader } from "./landing-header";
import { LandingHero } from "./landing-hero";
import { LandingProduct } from "./landing-product";
import { LandingCapabilities } from "./landing-capabilities";
import { LandingWorkflow } from "./landing-workflow";
import { LandingTeam } from "./landing-team";
import { LandingFooter } from "./landing-footer";

export function LandingPage() {
  return (
    <div id="landing" className={`${cx("landing")} ${iranYekan.variable}`} dir="rtl">
      <SmoothSectionNavigation rootId="landing" />
      <a href="#main-content" className={cx("skip-link")}>
        رفتن به محتوای اصلی
      </a>
      <div className={cx("landing-grid")} aria-hidden="true" />
      <LandingHeader />
      <main id="main-content" tabIndex={-1}>
        <LandingHero />
        <LandingProduct />
        <LandingCapabilities />
        <LandingWorkflow />
        <LandingTeam />
      </main>
      <LandingFooter />
    </div>
  );
}
