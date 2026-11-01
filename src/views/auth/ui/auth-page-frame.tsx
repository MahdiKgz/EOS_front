import styles from "./auth-page.module.css";

type AuthPageFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function AuthPageFrame({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthPageFrameProps) {
  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {children}
      <div className={styles.navigation}>{footer}</div>
    </div>
  );
}
