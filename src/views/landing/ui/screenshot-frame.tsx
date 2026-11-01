import Image, { type StaticImageData } from "next/image";
import { cx } from "./classes";

type ScreenshotFrameProps = {
  image: StaticImageData;
  alt: string;
  label?: string;
  hero?: boolean;
};

export function ScreenshotFrame({
  image,
  alt,
  label = "firewall / operations",
  hero = false,
}: ScreenshotFrameProps) {
  return (
    <div className={cx(`showcase-frame${hero ? " showcase-frame--hero" : ""}`)}>
      <div className={cx("showcase-frame__bar")} aria-hidden="true">
        <span />
        <span />
        <span />
        <small>{label}</small>
      </div>
      <div className={cx("showcase-frame__image")}>
        <Image
          src={image}
          alt={alt}
          preload={hero}
          sizes="(max-width: 700px) 95vw, (max-width: 980px) 85vw, 720px"
        />
      </div>
      <i className={cx("showcase-frame__shine")} aria-hidden="true" />
    </div>
  );
}
