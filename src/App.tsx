import { useState, useMemo } from "react";
import "./App.css";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  planet: string;
  system: string;
  x: string;
  y: string;
  z: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * 2の補数エンコード
 * X/Z: 12bit → 3桁 hex (000–FFF)
 * Y:    8bit → 2桁 hex (00–FF)
 */
function toTwosComplement(value: number, bits: number): number {
  if (value < 0) return (1 << bits) + value;
  return value;
}

export function encodeXZ(raw: number): string {
  const clamped = Math.max(-2047, Math.min(2046, raw));
  return toTwosComplement(clamped, 12).toString(16).toUpperCase().padStart(3, "0");
}

export function encodeY(raw: number): string {
  const clamped = Math.max(-126, Math.min(126, raw));
  return toTwosComplement(clamped, 8).toString(16).toUpperCase().padStart(2, "0");
}

export function encodePlanet(raw: number): string {
  return Math.max(1, Math.min(6, raw)).toString(16).toUpperCase();
}

export function encodeSystem(raw: number): string {
  return Math.max(1, Math.min(4095, raw)).toString(16).toUpperCase().padStart(3, "0");
}

/** 12グリフのポータルアドレス文字列を生成する (P SSS YY ZZZ XXX) */
function buildPortalAddress(form: FormState): string {
  const p = encodePlanet(parseInt(form.planet) || 0);
  const s = encodeSystem(parseInt(form.system) || 0);
  const y = encodeY(parseInt(form.y) || 0);
  const z = encodeXZ(parseInt(form.z) || 0);
  const x = encodeXZ(parseInt(form.x) || 0);
  return `${p}${s}${y}${z}${x}`;
}

function charToGlyphIndex(c: string): number {
  return parseInt(c, 16);
}

function getSegColor(charIndex: number): string {
  if (charIndex === 0) return "seg-planet";
  if (charIndex <= 3) return "seg-system";
  if (charIndex <= 5) return "seg-y";
  if (charIndex <= 8) return "seg-z";
  return "seg-x";
}

// ─── Field Component ──────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max?: number;
  accentClass: string;
}

function Field({ label, hint, value, onChange, min, max, accentClass }: FieldProps) {
  const num = parseInt(value) || 0;
  const inRange = num >= min && (max === undefined || num <= max);
  const showError = value !== "" && !inRange;

  return (
    <div className="field">
      <div className="field-header">
        <span className={`field-label ${accentClass}`}>{label}</span>
        <span className="field-hint">{hint}</span>
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className={`field-input${showError ? " error" : ""}`}
      />
      {showError && (
        <span className="field-error">範囲: {min} ～ {max ?? "可変"}</span>
      )}
    </div>
  );
}

// ─── PortalDisplay Component ──────────────────────────────────────────────────

function PortalDisplay({ address }: { address: string }) {
  const segments = [
    { chars: address.slice(0, 1),  label: "PLANET", colorClass: "seg-planet" },
    { chars: address.slice(1, 4),  label: "SYSTEM", colorClass: "seg-system" },
    { chars: address.slice(4, 6),  label: "Y AXIS", colorClass: "seg-y" },
    { chars: address.slice(6, 9),  label: "Z AXIS", colorClass: "seg-z" },
    { chars: address.slice(9, 12), label: "X AXIS", colorClass: "seg-x" },
  ];

  return (
    <div className="portal-display">
      <div className="portal-glyphs">
        {address.split("").map((ch, i) => (
          <div key={i} className={`glyph-cell ${getSegColor(i)}`}>
            <span className="glyph">{ch}</span>
            <span className="glyph-hex">{ch}</span>
          </div>
        ))}
      </div>

      <div className="portal-segments">
        {segments.map((seg) => (
          <div key={seg.label} className={`seg-label ${seg.colorClass}`}>
            <span className="seg-chars">{seg.chars}</span>
            <span className="seg-name">{seg.label}</span>
          </div>
        ))}
      </div>

      <div className="portal-copy">
        <span className="portal-raw">{address}</span>
        <button
          className="copy-btn"
          onClick={() => navigator.clipboard?.writeText(address)}
        >
          コピー
        </button>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [form, setForm] = useState<FormState>({
    planet: "2",
    system: "33",
    x: "1655",
    y: "1",
    z: "-704",
  });

  const address = useMemo(() => buildPortalAddress(form), [form]);

  function update(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-badge">NMS</div>
        <div>
          <h1 className="header-title">Portal Address Generator</h1>
          <p className="header-sub">No Man's Sky · 銀河座標 → ポータルアドレス変換</p>
        </div>
      </header>

      <div className="layout">
        {/* ── 左カラム: 入力フォーム ── */}
        <section className="form-section">
          <p className="section-title">入力パラメータ</p>
          <div className="fields">
            <Field
              label="惑星番号"
              hint="1~6"
              value={form.planet}
              onChange={(v) => update("planet", v)}
              min={1}
              max={6}
              accentClass="seg-planet"
            />
            <Field
              label="星系番号"
              hint="1~"
              value={form.system}
              onChange={(v) => update("system", v)}
              min={1}
              accentClass="seg-system"
            />
            <div className="divider" />
            <Field
              label="Y座標"
              hint="-126 ～ 126"
              value={form.y}
              onChange={(v) => update("y", v)}
              min={-126}
              max={126}
              accentClass="seg-y"
            />
            <Field
              label="Z座標"
              hint="-2047 ～ 2046"
              value={form.z}
              onChange={(v) => update("z", v)}
              min={-2047}
              max={2046}
              accentClass="seg-z"
            />
            <Field
              label="X座標"
              hint="-2047 ～ 2046"
              value={form.x}
              onChange={(v) => update("x", v)}
              min={-2047}
              max={2046}
              accentClass="seg-x"
            />
          </div>
        </section>

        {/* ── 右カラム: 結果表示 ── */}
        <section className="result-section">
          <p className="section-title">ポータルアドレス</p>
          <PortalDisplay address={address} />
        </section>
      </div>
    </div>
  );
}
