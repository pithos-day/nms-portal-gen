import { AlertTriangle, Check, ChevronsUpDown, Copy, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import {
  galacticCoordsToPortal,
  planetName,
  planetSeeds,
  portalToGalacticCoords,
  regionName,
  systemName,
} from 'system-name-calculator-ts';
import { GALAXY_OPTIONS } from '@/assets/galaxies';
import { CoordViewer } from '@/components/CoordViewer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  galaxy: string;
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

function fromTwosComplement(value: number, bits: number): number {
  const mask = 1 << (bits - 1);
  return value >= mask ? value - (1 << bits) : value;
}

function parsePortalCode(portal: string): FormState {
  const hex = portal.toUpperCase();
  const planet = parseInt(hex[0], 16);
  const system = parseInt(hex.slice(1, 4), 16);
  const y = fromTwosComplement(parseInt(hex.slice(4, 6), 16), 8);
  const z = fromTwosComplement(parseInt(hex.slice(6, 9), 16), 12);
  const x = fromTwosComplement(parseInt(hex.slice(9, 12), 16), 12);
  return {
    galaxy: '1',
    planet: String(planet),
    system: String(system),
    x: String(x),
    y: String(y),
    z: String(z),
  };
}

const PORTAL_RE = /^[0-9A-F]{12}$/i;
const COORDS_RE = /^[0-9A-F]{1,4}:[0-9A-F]{1,4}:[0-9A-F]{1,4}:[0-9A-F]{1,4}$/i;

function getSegColorClass(charIndex: number): string {
  if (charIndex === 0) return 'text-orange-400';
  if (charIndex <= 3) return 'text-yellow-400';
  if (charIndex <= 5) return 'text-blue-400';
  if (charIndex <= 8) return 'text-violet-400';
  return 'text-green-400';
}

// ─── FormField Component ──────────────────────────────────────────────────────────

interface FormFieldProps {
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

function FormField({ label, tooltip, hint, value, onChange, min, max, labelClass, showError }: FormFieldProps) {
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

// Combo FormField

// types
interface ComboOption {
  id: string;
  name: string;
}

interface ComboFieldProps {
  label: string;
  tooltip?: string;
  hint?: string;
  options: ComboOption[];
  value: string; // 選択中のid
  onChange: (id: string) => void;
  labelClass?: string;
  showError?: boolean;
  placeholder?: string;
}

function ComboField({
  label,
  tooltip,
  hint,
  options,
  value,
  onChange,
  labelClass,
  showError,
  placeholder = 'IDまたは名前で検索...',
}: ComboFieldProps) {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.id === value);
  const hasError = showError;

  return (
    <div className="space-y-1.5">
      {/* ── ヘッダー行: FormField と完全に同じ構造 ── */}
      <div className="flex items-baseline justify-between">
        <Label className={`font-medium text-xs tracking-wide ${labelClass}`}>
          {label}
          {tooltip && (
            <Tooltip>
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

      {/* ── コンボボックス本体 ── */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`h-8 w-full justify-between font-mono font-normal text-sm ${hasError ? 'border-destructive focus-visible:ring-destructive' : ''}
              ${!selected ? 'text-muted-foreground' : ''}`}
          >
            {selected ? (
              <span>
                <span className="text-muted-foreground">{selected.id}</span>
                {' — '}
                {selected.name}
              </span>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command
            filter={(id, search) => {
              const opt = options.find((o) => o.id === id);
              if (!opt) return 0;
              const q = search.toLowerCase();
              return opt.id.toLowerCase().includes(q) || opt.name.includes(q) ? 1 : 0;
            }}
          >
            <CommandInput placeholder={placeholder} className="h-8 text-sm" />
            <CommandList>
              <CommandEmpty className="py-2 text-center text-muted-foreground text-xs">見つかりません</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.id}
                    onSelect={(id) => {
                      onChange(id);
                      setOpen(false);
                    }}
                    className="text-sm"
                  >
                    <Check className={`mr-2 h-3.5 w-3.5 ${value === opt.id ? 'opacity-100' : 'opacity-0'}`} />
                    <span className="w-14 shrink-0 font-mono text-muted-foreground text-xs">{opt.id}</span>
                    {opt.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* ── エラー表示: FormField と同じ位置・スタイル ── */}
      {showError && <p className="text-destructive text-xs">選択してください</p>}
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

function PortalDisplay({
  address,
  coords,
  planet,
  system,
  region,
}: {
  address: string;
  coords: string;
  planet: string;
  system: string;
  region: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{planet}</CardTitle>
        <CardDescription>
          星系 {system} - エリア {region}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
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

        <div className="grid grid-cols-[140px_1fr_auto] items-center gap-3">
          {/* ポータルアドレス */}
          <span className="text-[12px] text-muted-foreground">ポータルアドレス</span>

          <span className="font-mono font-semibold text-primary text-xl tracking-[0.25em]">{address}</span>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigator.clipboard?.writeText(address)}
            className="flex cursor-pointer items-center gap-1.5 rounded border border-primary px-3 py-1.5 text-primary text-xs transition-colors hover:bg-primary/10"
          >
            <Copy className="h-3 w-3" />
            コピー
          </Button>
        </div>

        <div className="grid grid-cols-[140px_1fr_auto] items-center gap-3">
          {/* 銀河座標 */}
          <span className="text-[12px] text-muted-foreground">銀河座標</span>

          <span className="font-mono font-semibold text-primary text-xl tracking-[0.25em]">{coords}</span>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigator.clipboard?.writeText(coords)}
            className="flex cursor-pointer items-center gap-1.5 rounded border border-primary px-3 py-1.5 text-primary text-xs transition-colors hover:bg-primary/10"
          >
            <Copy className="h-3 w-3" />
            コピー
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// AddressInput

interface AddressInputProps {
  onLoad: (form: FormState) => void;
}

const HEX_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

function HexKeypad({ onDigit }: { onDigit: (d: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-1">
      {HEX_DIGITS.map((d) => (
        <Button
          key={d}
          variant="outline"
          size="sm"
          className="h-9 w-full px-0 font-mono text-4xl"
          style={{ fontFamily: 'NMS-Glyphs-Mono, monospace' }}
          onClick={() => onDigit(d)}
        >
          {d}
        </Button>
      ))}
    </div>
  );
}

function AddressInput({ onLoad }: AddressInputProps) {
  const [raw, setRaw] = useState('');

  function handleLoad() {
    const trimmed = raw.trim();
    if (!trimmed) return;

    try {
      let portal: string;
      if (PORTAL_RE.test(trimmed)) {
        portal = trimmed.toUpperCase();
      } else if (COORDS_RE.test(trimmed)) {
        portal = galacticCoordsToPortal(trimmed.toUpperCase());
      } else {
        return;
      }
      onLoad(parsePortalCode(portal));
    } catch {
      // ignore invalid input
    }
  }

  function appendDigit(d: string) {
    setRaw((prev) => {
      const next = prev.toUpperCase() + d;
      if (next.length === 12 && PORTAL_RE.test(next)) {
        onLoad(parsePortalCode(next));
      }
      return next;
    });
  }

  return (
    <div className="space-y-2">
      <Field orientation="horizontal">
        <Input
          placeholder="ポータルアドレスか銀河座標を入力…"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleLoad();
          }}
        />
        <Button onClick={handleLoad}>インポート</Button>
      </Field>
      <HexKeypad onDigit={appendDigit} />
    </div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  const location = useLocation();
  const isAbout = location.pathname === '/about';

  return (
    <footer className="border-border border-t py-6">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium text-xl tracking-wide">nms-portal-gen</h2>
            <p className="mt-0.5 text-muted-foreground text-xs">No Man's Sky · 座標 → ポータルアドレス変換</p>
          </div>
          <nav className="flex gap-4">
            <Link
              to="/"
              className={`text-sm transition-colors hover:text-foreground ${!isAbout ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              メイン
            </Link>
            <Link
              to="/about"
              className={`text-sm transition-colors hover:text-foreground ${isAbout ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              About
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Main />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

function Main() {
  const [form, setForm] = useState<FormState>({
    galaxy: '1',
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

  const portalNumber = BigInt(`0x${address}`);
  const coords = portalToGalacticCoords(portalNumber);
  const galaxyNumber = Number(form.galaxy) - 1;
  const planetNumber = Number(form.planet) - 1;

  const ps = planetSeeds(portalNumber, galaxyNumber);
  const planetNames = ps.planet_seeds.map((seed, i) => ({
    id: String(i + 1),
    seed: `0x${seed.toString(16).toUpperCase().padStart(16, '0')}`,
    name: planetName(seed),
  }));

  const planetCount = planetNames.length;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background font-mono text-foreground antialiased">
        <div className="mx-auto max-w-5xl px-6 py-8">
          {/* 2カラムレイアウト */}
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[340px_1fr]">
            {/* 左: 入力フォーム */}
            <section className="space-y-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em]">入力パラメータ</p>
              <div className="space-y-3.5">
                <ComboField
                  label="銀河番号"
                  hint="1 ~ 256"
                  options={GALAXY_OPTIONS}
                  value={form.galaxy}
                  onChange={(v) => update('galaxy', v)}
                  labelClass="text-red-400"
                />
                <ComboField
                  label="惑星番号"
                  tooltip="1,2は全ての惑星に存在します。"
                  hint={`1 ~ ${String(planetCount)}`}
                  options={planetNames}
                  value={form.planet}
                  onChange={(v) => update('planet', v)}
                  labelClass="text-orange-400"
                />
                <FormField
                  label="星系番号"
                  tooltip="121はブラックホール、122はアトラスステーションで固定されています。"
                  hint="1 ~"
                  value={form.system}
                  onChange={(v) => update('system', v)}
                  min={1}
                  labelClass="text-yellow-400"
                />
                <Separator />
                <FormField
                  label="Y座標"
                  hint="-126 ~ 126"
                  value={form.y}
                  onChange={(v) => update('y', v)}
                  min={-126}
                  max={126}
                  labelClass="text-blue-400"
                  showError={isTooClose}
                />
                <FormField
                  label="Z座標"
                  hint="-2047 ~ 2046"
                  value={form.z}
                  onChange={(v) => update('z', v)}
                  min={-2047}
                  max={2046}
                  labelClass="text-violet-400"
                  showError={isTooClose}
                />
                <FormField
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

              <CoordViewer
                x={parseInt(form.x, 10) || 0}
                y={parseInt(form.y, 10) || 0}
                z={parseInt(form.z, 10) || 0}
                isTooClose={isTooClose}
              />
            </section>

            {/* 右: ポータルアドレス */}
            <section className="space-y-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em]">ポータルアドレス</p>
              <PortalDisplay
                address={address}
                coords={coords}
                planet={planetNames[planetNumber]?.name}
                system={systemName(portalNumber, galaxyNumber)}
                region={regionName(portalNumber, galaxyNumber)}
              />
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em]">既知のアドレスをインポート</p>
              <AddressInput onLoad={(f) => setForm(f)} />
            </section>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function About() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background font-mono text-foreground antialiased">
        <div className="mx-auto max-w-5xl px-6 py-8">
          {/* ヘッダー */}
          <header className="mb-5 flex items-center gap-3 border-border border-b pb-6">
            <div>
              <h1 className="font-medium text-xl tracking-wide">nms-portal-gen</h1>
              <p className="mt-0.5 text-muted-foreground text-xs">No Man's Sky · 座標 → ポータルアドレス変換</p>
            </div>
          </header>

          <div className="space-y-8">
            {/* 免責事項 */}
            <section className="space-y-4">
              <h2 className="font-medium text-lg tracking-wide">免責事項</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm">【プレースホルダー】免責事項の内容をここに記載します。</p>
                </CardContent>
              </Card>
            </section>

            {/* 使用ライブラリ */}
            <section className="space-y-4">
              <h2 className="font-medium text-lg tracking-wide">使用ライブラリ</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm">
                    【プレースホルダー】使用しているライブラリのクレジットをここに記載します。
                  </p>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
