import styles from "./auth-forms.module.css";
type FormFieldProps = { id: string; label: string; error?: string; children: React.ReactNode; action?: React.ReactNode };
export function FormField({ id, label, error, action, children }: FormFieldProps) {
  return <div className={styles.field}><div className={styles.labelRow}><label htmlFor={id}>{label}</label>{action}</div>{children}{error && <p id={`${id}-error`} role="alert" className={styles.error}>{error}</p>}</div>;
}
export function FormMessage({ message, error = false }: { message?: string; error?: boolean }) {
  return message ? <p role={error ? "alert" : "status"} className={error ? styles.error : styles.notice}>{message}</p> : null;
}
