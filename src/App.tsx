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
  return Math.max(0, Math.min(6, raw)).toString(16).toUpperCase();
}

export function encodeSystem(raw: number): string {
  return Math.max(0, Math.min(4095, raw)).toString(16).toUpperCase().padStart(3, "0");
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

// ─── Glyph SVG Component ─────────────────────────────────────────────────────

const GLYPHS: string[] = [
  "M4 2 L8 6 L8 10 L4 14 L0 10 L0 6 Z",            // 0 - Hexagon
  "M4 0 L4 14 M2 0 L6 0",                            // 1 - Pillar
  "M0 4 Q0 0 4 0 Q8 0 8 4 L8 6 L0 8 L0 14 L8 14",  // 2 - S-curve
  "M0 0 L8 0 L8 7 L4 7 L8 7 L8 14 L0 14",           // 3 - Z
  "M0 0 L0 7 L8 7 M8 0 L8 14",                       // 4 - F-mirror
  "M8 0 L0 0 L0 7 L8 7 L8 14 L0 14",                // 5 - S
  "M8 0 L0 0 L0 14 L8 14 L8 7 L0 7",                // 6 - E
  "M0 0 L8 0 L4 14",                                 // 7 - Lambda
  "M0 4 Q0 0 4 0 Q8 0 8 4 L8 10 Q8 14 4 14 Q0 14 0 10 Z", // 8 - Pill
  "M8 7 L0 7 L0 0 Q0 0 8 0 L8 14",                  // 9 - P
  "M0 14 L0 0 L8 7",                                 // A - Arrow
  "M4 0 L0 7 L0 14 M4 0 L8 7 L8 14",                // B - Y
  "M8 0 L0 7 L8 14",                                 // C - Chevron
  "M0 0 L8 7 L0 14",                                 // D - Chevron-R
  "M0 0 L8 0 L8 4 L0 4 L0 14",                      // E - Gamma
  "M0 0 L0 14 L4 7 L8 14 L8 0",                     // F - M-down
];

function GlyphIcon({ index, size = 22 }: { index: number; size?: number }) {
  const d = GLYPHS[index] ?? GLYPHS[0];
  const strokeWidth = (1 / size) * 14;
  return (
    <svg
      width={size}
      height={size * (14 / 8)}
      viewBox="0 0 8 14"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Field Component ──────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  accentClass: string;
}

function Field({ label, hint, value, onChange, min, max, accentClass }: FieldProps) {
  const num = parseInt(value) || 0;
  const inRange = num >= min && num <= max;
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
        <span className="field-error">範囲: {min} ～ {max}</span>
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
            <GlyphIcon index={charToGlyphIndex(ch)} size={22} />
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
    planet: "0",
    system: "0",
    x: "0",
    y: "0",
    z: "0",
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
              label="P — 惑星番号"
              hint="0–6"
              value={form.planet}
              onChange={(v) => update("planet", v)}
              min={0}
              max={6}
              accentClass="seg-planet"
            />
            <Field
              label="SSS — 星系番号"
              hint="0–4095"
              value={form.system}
              onChange={(v) => update("system", v)}
              min={0}
              max={4095}
              accentClass="seg-system"
            />
            <div className="divider" />
            <Field
              label="YY — Y座標"
              hint="-126 ～ 126（銀河面からの高さ）"
              value={form.y}
              onChange={(v) => update("y", v)}
              min={-126}
              max={126}
              accentClass="seg-y"
            />
            <Field
              label="ZZZ — Z座標"
              hint="-2047 ～ 2046（南北方向）"
              value={form.z}
              onChange={(v) => update("z", v)}
              min={-2047}
              max={2046}
              accentClass="seg-z"
            />
            <Field
              label="XXX — X座標"
              hint="-2047 ～ 2046（東西方向）"
              value={form.x}
              onChange={(v) => update("x", v)}
              min={-2047}
              max={2046}
              accentClass="seg-x"
            />
          </div>

          <div className="info-box">
            <p className="info-title">⚠ 銀河中心付近の制限</p>
            <p className="info-text">
              XYZ座標が中心から半径3000光年以内の領域はポータルが使用不可能です。
              中心付近のアドレスはゲーム内でエラーとなる場合があります。
            </p>
          </div>
        </section>

        {/* ── 右カラム: 結果表示 ── */}
        <section className="result-section">
          <p className="section-title">ポータルアドレス</p>
          <PortalDisplay address={address} />

          <div className="coord-table">
            <p className="section-title">エンコード詳細</p>
            <table className="detail-table">
              <thead>
                <tr>
                  <th>セグメント</th>
                  <th>入力値</th>
                  <th>Hex</th>
                  <th>説明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="seg-planet">P</td>
                  <td>{form.planet || "0"}</td>
                  <td className="mono">{encodePlanet(parseInt(form.planet) || 0)}</td>
                  <td>惑星インデックス</td>
                </tr>
                <tr>
                  <td className="seg-system">SSS</td>
                  <td>{form.system || "0"}</td>
                  <td className="mono">{encodeSystem(parseInt(form.system) || 0)}</td>
                  <td>星系インデックス</td>
                </tr>
                <tr>
                  <td className="seg-y">YY</td>
                  <td>{form.y || "0"}</td>
                  <td className="mono">{encodeY(parseInt(form.y) || 0)}</td>
                  <td>8bit 2の補数</td>
                </tr>
                <tr>
                  <td className="seg-z">ZZZ</td>
                  <td>{form.z || "0"}</td>
                  <td className="mono">{encodeXZ(parseInt(form.z) || 0)}</td>
                  <td>12bit 2の補数</td>
                </tr>
                <tr>
                  <td className="seg-x">XXX</td>
                  <td>{form.x || "0"}</td>
                  <td className="mono">{encodeXZ(parseInt(form.x) || 0)}</td>
                  <td>12bit 2の補数</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
