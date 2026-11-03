"use client";
import { useCallback, useState, type ReactNode } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import styles from "./select.module.css";
export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: ReactNode;
};
export function Select({
  value,
  onValueChange,
  options,
  disabled = false,
  label,
  placeholder = "انتخاب کنید",
  emptyMessage = "گزینه‌ای برای انتخاب وجود ندارد.",
  id,
  onBlur,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  label: string;
  placeholder?: string;
  emptyMessage?: string;
  id?: string;
  onBlur?: () => void;
}) {
  const [container, setContainer] = useState<HTMLElement | undefined>();
  const attach = useCallback(
    (node: HTMLButtonElement | null) => setContainer(node?.closest("dialog") ?? undefined),
    [],
  );
  const selected = options.find((option) => option.value === value);
  return (
    <SelectPrimitive.Root
      value={value || "__all__"}
      onValueChange={(next) => onValueChange(next === "__all__" ? "" : next)}
      disabled={disabled}
      dir="rtl"
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={label}
        className={styles.trigger}
        onBlur={onBlur}
        ref={attach}
      >
        <SelectPrimitive.Value placeholder={placeholder}>
          <span className={styles.value}>
            {selected?.icon}
            <span>{selected?.label ?? placeholder}</span>
          </span>
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon className={styles.chevron}>
          <ChevronDown size={15} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal container={container}>
        <SelectPrimitive.Content
          className={styles.content}
          position="popper"
          sideOffset={6}
          collisionPadding={12}
        >
          <SelectPrimitive.ScrollUpButton className={styles.scroll}>
            <ChevronUp size={16} />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className={styles.viewport}>
            {options.length === 0 && <p className={styles.empty}>{emptyMessage}</p>}
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value || "__all__"}
                disabled={option.disabled}
                textValue={option.label}
                className={styles.item}
              >
                {option.icon}
                <span className={styles.copy}>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  {option.description && (
                    <span className={styles.description}>{option.description}</span>
                  )}
                </span>
                <SelectPrimitive.ItemIndicator className={styles.check}>
                  <Check size={15} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className={styles.scroll}>
            <ChevronDown size={16} />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
