import styles from "./landing.module.css";

export function cx(names: string) {
  return names
    .split(/\s+/)
    .map((name) => styles[name])
    .join(" ");
}
