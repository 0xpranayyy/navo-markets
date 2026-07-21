import type { CSSProperties, ReactNode } from 'react';
import { useTheme } from '../../theme';
import { groupedListStyle, iosLayout, iosType } from '../../theme/typography';
import { hapticLight } from '../../utils/haptics';

/** iOS large title (34pt bold). */
export function LargeTitle({ children, trailing, compact }: { children: ReactNode; trailing?: ReactNode; compact?: boolean }) {
  const { colors: C } = useTheme();
  return (
    <div style={{
      padding: compact
        ? 'calc(env(safe-area-inset-top, 0px) + 6px) 20px 4px'
        : 'calc(env(safe-area-inset-top, 0px) + 8px) 20px 6px',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ ...iosType.largeTitle, color: C.text, ...(compact ? { fontSize: 28, letterSpacing: -0.5 } : {}) }}>
        {children}
      </div>
      {trailing}
    </div>
  );
}

/** Grouped list section header — HIG footnote uppercase. */
export function SectionHeader({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  const { sectionLabel } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 4px 8px' }}>
      <div style={{ ...sectionLabel, margin: 0 }}>{children}</div>
      {trailing}
    </div>
  );
}

/** Circular nav / toolbar button — 44pt hit target, 36pt visual. */
export function NavIconButton({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: ReactNode;
  label?: string;
}) {
  const { colors: C } = useTheme();
  return (
    <div
      role="button"
      aria-label={label}
      className="pressable pressable-sm ios-hit-44"
      onClick={() => { hapticLight(); onClick(); }}
      style={{
        width: iosLayout.minTouch, height: iosLayout.minTouch, borderRadius: 9999, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9999,
        background: C.closeButtonBg,
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: `0.5px solid ${C.hair}`,
        boxShadow: C.tabBarShine,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </div>
    </div>
  );
}

/** iOS search field — 36pt height, rounded rect. */
export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  onClear,
  onFocus,
  inputRef,
  readOnly,
  onClick,
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onFocus?: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
  readOnly?: boolean;
  onClick?: () => void;
}) {
  const { colors: C } = useTheme();
  return (
    <div
      className={onClick ? 'pressable' : undefined}
      onClick={onClick}
      style={{
        margin: '4px 20px 10px', height: iosLayout.searchHeight, borderRadius: 10,
        background: C.inputBg,
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px 0 12px',
        border: `0.5px solid ${C.hair}`,
        flexShrink: 0,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
        <circle cx="7" cy="7" r="5.2" stroke={C.searchIcon} strokeWidth="1.5" fill="none" />
        <path d="M11 11l3.2 3.2" stroke={C.searchIcon} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {readOnly ? (
        <span style={{ ...iosType.body, color: C.inputPlaceholder, flex: 1 }}>{placeholder}</span>
      ) : (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={onFocus}
          placeholder={placeholder}
          autoCapitalize="off"
          autoCorrect="off"
          enterKeyHint="search"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: C.text, ...iosType.body, fontFamily: 'inherit',
          }}
        />
      )}
      {value && onClear && (
        <div
          role="button"
          aria-label="Clear search"
          className="pressable pressable-sm ios-hit-44"
          onClick={(e) => {
            e.stopPropagation();
            hapticLight();
            onClear();
            if (inputRef && 'current' in inputRef) inputRef.current?.focus();
          }}
          style={{
            width: iosLayout.minTouch, height: iosLayout.minTouch, marginRight: -8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: 9999, background: C.faint,
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.55,
          }}>
            <svg width="8" height="8" viewBox="0 0 8 8">
              <path d="M1 1l6 6M7 1L1 7" stroke={C.bg} strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

/** iOS segmented control — 32pt track height. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
}) {
  const { colors: C } = useTheme();
  return (
    <div style={{
      display: 'flex', gap: 2, padding: 2, borderRadius: 9, minHeight: 32,
      background: C.inputBg,
      border: `0.5px solid ${C.hair}`,
    }}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <div
            key={opt.id}
            role="tab"
            aria-selected={active}
            className="pressable ios-hit-44"
            onClick={() => { hapticLight(); onChange(opt.id); }}
            style={{
              flex: 1, textAlign: 'center', padding: '6px 10px', borderRadius: 7,
              ...iosType.footnote, fontWeight: active ? 600 : 500,
              color: active ? C.text : C.sub,
              background: active ? C.surface2 : 'transparent',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12), inset 0 0.5px 0 rgba(255,255,255,0.2)' : 'none',
              transition: 'background 0.18s cubic-bezier(0.32, 0.72, 0, 1), color 0.18s ease',
            }}
          >
            {opt.label}
          </div>
        );
      })}
    </div>
  );
}

/** Inset grouped list container (Settings-style, 10pt radius). */
export function GroupedList({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const { colors: C } = useTheme();
  return (
    <div style={{ ...groupedListStyle(C), ...style }}>
      {children}
    </div>
  );
}

export function ListRow({
  title,
  subtitle,
  onClick,
  trailing,
  destructive,
  last,
}: {
  title: string;
  subtitle?: string;
  onClick?: () => void;
  trailing?: ReactNode;
  destructive?: boolean;
  last?: boolean;
}) {
  const { colors: C } = useTheme();
  return (
    <div
      className={onClick ? 'pressable ios-list-row' : 'ios-list-row'}
      onClick={onClick ? () => { hapticLight(); onClick(); } : undefined}
      style={{
        padding: '11px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: last ? 'none' : `0.33px solid ${C.divider}`,
        minHeight: iosLayout.minTouch,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          ...iosType.body, fontWeight: 400,
          color: destructive ? C.red : C.text,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ ...iosType.footnote, color: C.faint, marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {trailing ?? (onClick && !destructive ? (
        <svg width="8" height="14" viewBox="0 0 8 14" style={{ opacity: 0.35, flexShrink: 0 }} aria-hidden>
          <path d="M1 1l6 6-6 6" stroke={C.faint} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null)}
    </div>
  );
}

/** Primary filled button — HIG default action. */
export function PrimaryButton({
  label,
  onClick,
  color,
  textColor = '#fff',
  disabled,
}: {
  label: string;
  onClick: () => void;
  color: string;
  textColor?: string;
  disabled?: boolean;
}) {
  return (
    <div
      role="button"
      className="pressable ios-hit-44"
      onClick={() => { if (!disabled) { hapticLight(); onClick(); } }}
      style={{
        background: color,
        color: textColor,
        ...iosType.body,
        fontWeight: 600,
        borderRadius: iosLayout.groupedRadius + 4,
        padding: '14px 18px',
        textAlign: 'center',
        opacity: disabled ? 0.55 : 1,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22)',
        minHeight: iosLayout.minTouch,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {label}
    </div>
  );
}

/** Secondary gray button — HIG alternate action. */
export function SecondaryButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const { colors: C } = useTheme();
  return (
    <div
      role="button"
      className="pressable ios-hit-44"
      onClick={() => { if (!disabled) { hapticLight(); onClick(); } }}
      style={{
        background: C.inputBg,
        color: C.text,
        ...iosType.body,
        fontWeight: 600,
        borderRadius: iosLayout.groupedRadius + 4,
        padding: '14px 16px',
        textAlign: 'center',
        border: `0.5px solid ${C.hair}`,
        opacity: disabled ? 0.55 : 1,
        minHeight: iosLayout.minTouch,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {label}
    </div>
  );
}

/** iOS-style switch — 51×31pt. */
export function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  const { colors: C } = useTheme();
  return (
    <div
      role="switch"
      aria-checked={on}
      className="pressable pressable-sm ios-hit-44"
      onClick={(e) => {
        e.stopPropagation();
        hapticLight();
        onChange(!on);
      }}
      style={{
        width: 51, height: 31, borderRadius: 9999, flexShrink: 0,
        background: on ? C.green : C.inputBg,
        border: on ? 'none' : `0.5px solid ${C.hair}`,
        padding: 2,
        transition: 'background 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        display: 'flex', alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
        boxShadow: on ? 'inset 0 0 0 0.5px rgba(0,0,0,0.04)' : undefined,
      }}
    >
      <div style={{
        width: 27, height: 27, borderRadius: 9999, background: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2), 0 0.5px 1px rgba(0,0,0,0.08)',
        transition: 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
      }} />
    </div>
  );
}
