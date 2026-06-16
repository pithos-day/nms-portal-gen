import { AlertTriangle, Copy, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  planet: string;
  system: string;
  x: string;
  y: string;
  z: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toTwosComplement(value: number, bits: number): number {
  if (value < 0) return (1 << bits) + value;
  return value;
}

export function encodeXZ(raw: number): string {
  const clamped = Math.max(-2047, Math.min(2046, raw));
  return toTwosComplement(clamped, 12).toString(16).toUpperCase().padStart(3, '0');
}

export function encodeY(raw: number): string {
  const clamped = Math.max(-126, Math.min(126, raw));
  return toTwosComplement(clamped, 8).toString(16).toUpperCase().padStart(2, '0');
}

export function encodePlanet(raw: number): string {
  return Math.max(1, Math.min(6, raw)).toString(16).toUpperCase();
}

export function encodeSystem(raw: number): string {
  return Math.max(1, Math.min(4095, raw)).toString(16).toUpperCase().padStart(3, '0');
}

function calcDistance(x: number, y: number, z: number): number {
  return x * x + y * y + z * z;
}

function buildPortalAddress(form: FormState): string {
  const p = encodePlanet(parseInt(form.planet, 10) || 0);
  const s = encodeSystem(parseInt(form.system, 10) || 0);
  const y = encodeY(parseInt(form.y, 10) || 0);
  const z = encodeXZ(parseInt(form.z, 10) || 0);
  const x = encodeXZ(parseInt(form.x, 10) || 0);
  return `${p}${s}${y}${z}${x}`;
}

function getSegColorClass(charIndex: number): string {
  if (charIndex === 0) return 'text-orange-400';
  if (charIndex <= 3) return 'text-yellow-400';
  if (charIndex <= 5) return 'text-blue-400';
  if (charIndex <= 8) return 'text-violet-400';
  return 'text-green-400';
}

// ─── Field Component ──────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  tooltip?: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max?: number;
  labelClass: string;
  showError?: boolean;
}

function Field({ label, tooltip, hint, value, onChange, min, max, labelClass, showError }: FieldProps) {
  const num = parseInt(value, 10) || 0;
  const inRange = num >= min && (max === undefined || num <= max);
  const showRangeError = value !== '' && !inRange;
  const hasError = showRangeError || showError;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label className={`font-medium text-xs tracking-wide ${labelClass}`}>
          {label}
          {tooltip && (
            <Tooltip key="top">
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </Label>
        <span className="text-muted-foreground text-xs">{hint}</span>
      </div>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 font-mono text-sm ${hasError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
      />
      {showRangeError && (
        <p className="text-destructive text-xs">
          範囲: {min} ～ {max ?? '可変'}
        </p>
      )}
    </div>
  );
}

// ─── PortalDisplay Component ──────────────────────────────────────────────────

const GLYPH_POSITIONS = ['planet', 'sys-0', 'sys-1', 'sys-2', 'y-0', 'y-1', 'z-0', 'z-1', 'z-2', 'x-0', 'x-1', 'x-2'] as const;

const SEGMENTS = [
  { slice: [0, 1] as [number, number], label: 'PLANET', colorClass: 'text-orange-400' },
  { slice: [1, 4] as [number, number], label: 'SYSTEM', colorClass: 'text-yellow-400' },
  { slice: [4, 6] as [number, number], label: 'Y AXIS', colorClass: 'text-blue-400' },
  { slice: [6, 9] as [number, number], label: 'Z AXIS', colorClass: 'text-violet-400' },
  { slice: [9, 12] as [number, number], label: 'X AXIS', colorClass: 'text-green-400' },
];

function PortalDisplay({ address }: { address: string }) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        {/* グリフ */}
        <div className="flex flex-wrap gap-1.5">
          {address.split('').map((ch, i) => (
            <div key={GLYPH_POSITIONS[i]} className={`flex w-9 flex-col items-center gap-1 ${getSegColorClass(i)}`}>
              <span className="text-[42px] leading-none" style={{ fontFamily: 'NMS-Glyphs-Mono, monospace' }}>
                {ch}
              </span>
              <span className="font-semibold text-[11px] tracking-wide">{ch}</span>
            </div>
          ))}
        </div>

        <Separator />

        {/* セグメントラベル */}
        <div className="flex flex-wrap gap-3">
          {SEGMENTS.map((seg) => (
            <div key={seg.label} className={`flex flex-col items-center gap-0.5 ${seg.colorClass}`}>
              <span className="font-semibold text-base tracking-widest">{address.slice(...seg.slice)}</span>
              <span className="text-[9px] text-muted-foreground tracking-[0.15em]">{seg.label}</span>
            </div>
          ))}
        </div>

        <Separator />

        {/* コピー行 */}
        <div className="flex items-center gap-3">
          <span className="flex-1 font-mono font-semibold text-2xl text-primary tracking-[0.25em]">{address}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(address)}
            className="flex cursor-pointer items-center gap-1.5 rounded border border-primary px-3 py-1.5 text-primary text-xs transition-colors hover:bg-primary/10"
          >
            <Copy className="h-3 w-3" />
            コピー
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [form, setForm] = useState<FormState>({
    planet: '2',
    system: '33',
    x: '1655',
    y: '1',
    z: '-704',
  });

  const address = useMemo(() => buildPortalAddress(form), [form]);
  const distance = useMemo(
    () => calcDistance(parseInt(form.x, 10) || 0, parseInt(form.y, 10) || 0, parseInt(form.z, 10) || 0),
    [form.x, form.y, form.z],
  );
  const isTooClose = distance < 64;

  function update(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background font-mono text-foreground antialiased">
        <div className="mx-auto max-w-5xl px-6 py-8">
          {/* ヘッダー */}
          <header className="mb-10 flex items-center gap-3 border-border border-b pb-6">
            <Badge className="px-2 py-1 font-semibold text-[11px] tracking-widest">NMS</Badge>
            <div>
              <h1 className="font-medium text-xl tracking-wide">Portal Address Generator</h1>
              <p className="mt-0.5 text-muted-foreground text-xs">No Man's Sky · 銀河座標 → ポータルアドレス変換</p>
            </div>
          </header>

          {/* 2カラムレイアウト */}
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[340px_1fr]">
            {/* 左: 入力フォーム */}
            <section className="space-y-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em]">入力パラメータ</p>
              <div className="space-y-3.5">
                <Field
                  label="惑星番号"
                  tooltip="1,2は全ての惑星に存在します。"
                  hint="1 ~ 6"
                  value={form.planet}
                  onChange={(v) => update('planet', v)}
                  min={1}
                  max={6}
                  labelClass="text-orange-400"
                />
                <Field
                  label="星系番号"
                  tooltip="121はブラックホール、122はアトラスステーションで固定されています。"
                  hint="1 ~"
                  value={form.system}
                  onChange={(v) => update('system', v)}
                  min={1}
                  labelClass="text-yellow-400"
                />
                <Separator />
                <Field
                  label="Y座標"
                  hint="-126 ~ 126"
                  value={form.y}
                  onChange={(v) => update('y', v)}
                  min={-126}
                  max={126}
                  labelClass="text-blue-400"
                  showError={isTooClose}
                />
                <Field
                  label="Z座標"
                  hint="-2047 ~ 2046"
                  value={form.z}
                  onChange={(v) => update('z', v)}
                  min={-2047}
                  max={2046}
                  labelClass="text-violet-400"
                  showError={isTooClose}
                />
                <Field
                  label="X座標"
                  hint="-2047 ~ 2046"
                  value={form.x}
                  onChange={(v) => update('x', v)}
                  min={-2047}
                  max={2046}
                  labelClass="text-green-400"
                  showError={isTooClose}
                />
              </div>

              {isTooClose && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>銀河中心付近の制限</AlertTitle>
                  <AlertDescription>銀河の中心から半径3000光年以内の領域はポータルが使用できません。</AlertDescription>
                </Alert>
              )}
            </section>

            {/* 右: ポータルアドレス */}
            <section className="space-y-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em]">ポータルアドレス</p>
              <PortalDisplay address={address} />
            </section>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
