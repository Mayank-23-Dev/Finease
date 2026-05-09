// src/components/ui/Savings_UI/PortfolioTab.tsx
import { useState, useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { type ManualInvestment } from "@/lib/savings";
import {
    Pencil,
    Trash2,
    Plus,
    Briefcase,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    CalendarDays,
    ChevronDown,
    MoreHorizontal,
    IndianRupee,
    Hash,
    Activity,
} from "lucide-react";
import { format } from "date-fns";

ChartJS.register(ArcElement, Tooltip, Legend);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
    stocks: "Stocks",
    mutual_fund: "Mutual Fund",
    gold: "Gold",
    fd: "Fixed Deposit",
    crypto: "Crypto",
    ppf: "PPF",
    nps: "NPS",
    etf: "ETF",
    other: "Other",
};

// Pure B&W greyscale palette
const TYPE_COLORS: Record<string, string> = {
    stocks: "#22c55e",
    mutual_fund: "#3b82f6",
    gold: "#f59e0b",
    fd: "#6366f1",
    crypto: "#ef4444",
    ppf: "#14b8a6",
    nps: "#a855f7",
    etf: "#06b6d4",
    other: "#9ca3af",
};


// ─── EXTENDED TYPE ────────────────────────────────────────────────────────────

export interface ExtendedInvestment extends ManualInvestment {
    ticker?: string;
    quantity?: number;
    bought_price?: number;
    current_price?: number;
    bought_date?: string;
}

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface PortfolioTabProps {
    investments: ExtendedInvestment[];
    loadingInvestments: boolean;
    createInvestment: (
        payload: Omit<ExtendedInvestment, "id" | "firebase_uid" | "added_at">
    ) => Promise<void>;
    editInvestment: (
        id: string,
        payload: Partial<Omit<ExtendedInvestment, "id" | "firebase_uid" | "added_at">>
    ) => Promise<void>;
    removeInvestment: (id: string) => Promise<void>;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function calcCurrentValue(inv: ExtendedInvestment): number {
    if (inv.type === "stocks" && inv.quantity && inv.current_price)
        return inv.quantity * inv.current_price;
    const yrs =
        (Date.now() - new Date(inv.added_at).getTime()) /
        (1000 * 60 * 60 * 24 * 365);
    return inv.amount_invested * Math.pow(1 + inv.expected_return / 100, Math.max(yrs, 0));
}

function calcStockGrowth(inv: ExtendedInvestment) {
    if (!inv.quantity || !inv.bought_price || !inv.current_price) return null;
    const invested = inv.quantity * inv.bought_price;
    const currentValue = inv.quantity * inv.current_price;
    const gain = currentValue - invested;
    const gainPct = (gain / invested) * 100;
    const from = inv.bought_date ? new Date(inv.bought_date) : new Date(inv.added_at);
    const daysHeld = (Date.now() - from.getTime()) / (1000 * 60 * 60 * 24);
    return { invested, currentValue, gain, gainPct, daysHeld };
}

function calcCAGR(vi: number, vf: number, years: number): number | null {
    if (vi <= 0 || vf <= 0 || years < 0.01) return null;
    return (Math.pow(vf / vi, 1 / years) - 1) * 100;
}

function formatINR(n: number) {
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatDays(days: number): string {
    if (days < 30) return `${Math.round(days)}d`;
    if (days < 365) return `${Math.round(days / 30)}mo`;
    return `${(days / 365).toFixed(1)}yr`;
}

// ─── DIALOG FORM ─────────────────────────────────────────────────────────────

interface DialogForm {
    name: string;
    type: string;
    amount_invested: string;
    expected_return: string;
    ticker: string;
    quantity: string;
    bought_price: string;
    current_price: string;
    bought_date: Date | undefined;
}

const EMPTY_FORM: DialogForm = {
    name: "",
    type: "stocks",
    amount_invested: "",
    expected_return: "12",
    ticker: "",
    quantity: "",
    bought_price: "",
    current_price: "",
    bought_date: new Date(),
};

function toForm(inv: ExtendedInvestment): DialogForm {
    return {
        name: inv.name,
        type: inv.type,
        amount_invested: String(inv.amount_invested),
        expected_return: String(inv.expected_return),
        ticker: inv.ticker ?? "",
        quantity: inv.quantity != null ? String(inv.quantity) : "",
        bought_price: inv.bought_price != null ? String(inv.bought_price) : "",
        current_price: inv.current_price != null ? String(inv.current_price) : "",
        bought_date: inv.bought_date ? new Date(inv.bought_date) : new Date(),
    };
}

// ─── INPUT FIELD ─────────────────────────────────────────────────────────────

function BwInput(props: React.ComponentProps<typeof Input>) {
    return (
        <Input
            {...props}
            className={`bg-white/[0.04] border-white/10 text-white placeholder:text-white/20
        h-9 text-sm rounded-lg focus-visible:ring-0 focus-visible:border-white/40
        hover:border-white/20 transition-colors ${props.className ?? ""}`}
        />
    );
}

function BwLabel({ children }: { children: React.ReactNode }) {
    return (
        <Label className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
            {children}
        </Label>
    );
}

// ─── ADD / EDIT DIALOG ────────────────────────────────────────────────────────

interface AddInvestmentDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editData: ExtendedInvestment | null;
    onSubmit: (
        payload: Omit<ExtendedInvestment, "id" | "firebase_uid" | "added_at">
    ) => Promise<void>;
}

function AddInvestmentDialog({ open, onOpenChange, editData, onSubmit }: AddInvestmentDialogProps) {
    const [form, setForm] = useState<DialogForm>(EMPTY_FORM);
    const [calOpen, setCalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useMemo(() => {
        if (open) { setForm(editData ? toForm(editData) : EMPTY_FORM); setError(""); }
    }, [open, editData]);

    const isStock = form.type === "stocks";

    const autoInvested =
        isStock && form.quantity && form.bought_price
            ? (parseFloat(form.quantity) * parseFloat(form.bought_price)).toFixed(2)
            : null;

    const previewPnl = useMemo(() => {
        if (!isStock || !form.quantity || !form.bought_price || !form.current_price) return null;
        const qty = parseFloat(form.quantity);
        const bp = parseFloat(form.bought_price);
        const cp = parseFloat(form.current_price);
        if (isNaN(qty) || isNaN(bp) || isNaN(cp)) return null;
        const invested = qty * bp;
        const current = qty * cp;
        const gain = current - invested;
        const pct = (gain / invested) * 100;
        return { invested, current, gain, pct };
    }, [form.quantity, form.bought_price, form.current_price, isStock]);

    const set = (key: keyof DialogForm, val: any) =>
        setForm((f) => ({ ...f, [key]: val }));

    const handleSubmit = async () => {
        setError("");
        if (!form.name.trim()) return setError("Name is required.");
        if (!form.type) return setError("Select an asset type.");
        if (isStock) {
            if (!form.quantity || parseFloat(form.quantity) <= 0) return setError("Enter valid quantity.");
            if (!form.bought_price || parseFloat(form.bought_price) <= 0) return setError("Enter valid bought price.");
            if (!form.current_price || parseFloat(form.current_price) <= 0) return setError("Enter valid current price.");
        } else {
            if (!form.amount_invested || parseFloat(form.amount_invested) <= 0)
                return setError("Enter valid amount invested.");
        }
        setLoading(true);
        try {
            await onSubmit({
                name: form.name.trim(),
                type: form.type,
                amount_invested: isStock && autoInvested
                    ? parseFloat(autoInvested)
                    : parseFloat(form.amount_invested),
                expected_return: parseFloat(form.expected_return) || 12,
                ...(isStock && {
                    ticker: form.ticker.trim() || undefined,
                    quantity: parseFloat(form.quantity),
                    bought_price: parseFloat(form.bought_price),
                    current_price: parseFloat(form.current_price),
                    bought_date: form.bought_date?.toISOString() ?? undefined,
                }),
            });
            onOpenChange(false);
        } catch (err: any) {
            console.error("Investment Error:", err);
            setError(err?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-black border border-white/10 text-white p-0 overflow-hidden rounded-2xl shadow-2xl">

                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-5 border-b border-white/[0.07]">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl border border-white/15 bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                            <Activity className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-white font-semibold text-[15px] tracking-tight">
                                {editData ? "Edit Investment" : "Add Investment"}
                            </DialogTitle>
                            <p className="text-white/35 text-xs mt-0.5 leading-relaxed">
                                {isStock
                                    ? "Track your stock with real P&L calculation"
                                    : "Record any investment to monitor growth"}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="px-6 py-5 flex flex-col gap-5 max-h-[65vh] overflow-y-auto">

                    {/* Name + Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <BwLabel>Investment Name</BwLabel>
                            <BwInput
                                placeholder={isStock ? "Reliance Industries" : "SBI Bluechip Fund"}
                                value={form.name}
                                onChange={(e) => set("name", e.target.value)}
                            />
                        </div>

                        {/* Asset Type — DropdownMenu */}
                        <div className="flex flex-col gap-2">
                            <BwLabel>Asset Type</BwLabel>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center justify-between w-full h-9 px-3 rounded-lg
                    bg-white/[0.04] border border-white/10 text-sm text-white
                    hover:bg-white/[0.07] hover:border-white/20 transition-colors
                    focus:outline-none focus:border-white/40">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: TYPE_COLORS[form.type] ?? "#595959" }}
                                            />
                                            <span>{TYPE_LABELS[form.type] ?? "Select type"}</span>
                                        </div>
                                        <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#0a0a0a] border-white/10 text-white min-w-[180px] rounded-xl p-1">
                                    <DropdownMenuLabel className="text-[10px] text-white/25 uppercase tracking-widest px-2 py-1.5">
                                        Asset Class
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/[0.07] my-1" />
                                    {Object.entries(TYPE_LABELS).map(([val, label]) => (
                                        <DropdownMenuItem
                                            key={val}
                                            onClick={() => set("type", val)}
                                            className="text-sm text-white/70 hover:text-white focus:bg-white/[0.08]
                        focus:text-white cursor-pointer rounded-lg gap-2.5 px-2 py-1.5"
                                        >
                                            <span
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: TYPE_COLORS[val] }}
                                            />
                                            {label}
                                            {form.type === val && (
                                                <span className="ml-auto text-white/60 text-xs">✓</span>
                                            )}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* ── STOCK FIELDS ── */}
                    {isStock && (
                        <div className="flex flex-col gap-4 rounded-xl bg-white/[0.025] border border-white/[0.08] p-4">
                            <div className="flex items-center gap-2">
                                <div className="w-0.5 h-3.5 bg-white/50 rounded-full" />
                                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                                    Stock Details
                                </span>
                            </div>

                            {/* Ticker + Quantity */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <BwLabel><span className="flex items-center gap-1"><Hash className="w-3 h-3" /> Ticker</span></BwLabel>
                                    <BwInput
                                        placeholder="RELIANCE.NS"
                                        value={form.ticker}
                                        onChange={(e) => set("ticker", e.target.value.toUpperCase())}
                                        className="font-mono"
                                    />
                                    <span className="text-[10px] text-white/20">NSE → .NS · BSE → .BO</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <BwLabel>Quantity (Shares)</BwLabel>
                                    <BwInput
                                        type="number"
                                        placeholder="10"
                                        min={0}
                                        value={form.quantity}
                                        onChange={(e) => set("quantity", e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Bought Price + Bought Date via Calendar */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <BwLabel><span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Bought Price</span></BwLabel>
                                    <BwInput
                                        type="number"
                                        placeholder="2450.00"
                                        min={0}
                                        value={form.bought_price}
                                        onChange={(e) => set("bought_price", e.target.value)}
                                    />
                                </div>

                                {/* Calendar Popover */}
                                <div className="flex flex-col gap-2">
                                    <BwLabel><span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Bought Date</span></BwLabel>
                                    <Popover open={calOpen} onOpenChange={setCalOpen}>
                                        <PopoverTrigger asChild>
                                            <button className="flex items-center justify-between w-full h-9 px-3 rounded-lg
                        bg-white/[0.04] border border-white/10 text-sm
                        hover:bg-white/[0.07] hover:border-white/20 transition-colors
                        focus:outline-none focus:border-white/40">
                                                <span className={form.bought_date ? "text-white" : "text-white/20"}>
                                                    {form.bought_date
                                                        ? format(form.bought_date, "dd MMM yyyy")
                                                        : "Pick date"}
                                                </span>
                                                <CalendarDays className="w-3.5 h-3.5 text-white/25" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={form.bought_date}
                                                onSelect={(d) => { set("bought_date", d); setCalOpen(false); }}
                                                disabled={{ after: new Date() }}
                                                className="
                          [&_.rdp-day_button]:text-white/70
                          [&_.rdp-day_button:hover]:bg-white/10
                          [&_.rdp-day_button:hover]:text-white
                          [&_[data-selected-single=true]]:bg-white
                          [&_[data-selected-single=true]]:text-black
                          [&_.rdp-nav_button]:text-white/50
                          [&_.rdp-nav_button:hover]:bg-white/10
                          [&_.rdp-caption_label]:text-white
                          [&_.rdp-head_cell]:text-white/30
                        "
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Current Price */}
                            <div className="flex flex-col gap-2">
                                <BwLabel><span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Current Price / Share</span></BwLabel>
                                <BwInput
                                    type="number"
                                    placeholder="2780.00"
                                    min={0}
                                    value={form.current_price}
                                    onChange={(e) => set("current_price", e.target.value)}
                                />
                                <span className="text-[10px] text-white/20">Update manually to reflect latest market price</span>
                            </div>

                            {/* Auto total */}
                            {autoInvested && (
                                <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 flex items-center justify-between">
                                    <span className="text-xs text-white/35">Total Invested (qty × price)</span>
                                    <span className="text-sm font-semibold text-white tabular-nums">
                                        {formatINR(parseFloat(autoInvested))}
                                    </span>
                                </div>
                            )}

                            {/* Live P&L Preview */}
                            {previewPnl && (
                                <div className={`rounded-xl border px-4 py-3.5 flex items-center justify-between ${previewPnl.gain >= 0
                                    ? "bg-green-500/10 border-green-500/30"
                                    : "bg-red-500/10 border-red-500/30"

                                    }`}>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] text-white/25 uppercase tracking-widest font-semibold">
                                            Live P&L Preview
                                        </span>
                                        <span className={`text-2xl font-bold tabular-nums ${previewPnl.gain >= 0 ? "text-white" : "text-white/40"
                                            }`}>
                                            {previewPnl.gain >= 0 ? "+" : ""}{formatINR(previewPnl.gain)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-[10px] text-white/25">Current Value</span>
                                        <span className="text-sm font-semibold text-white tabular-nums">
                                            {formatINR(previewPnl.current)}
                                        </span>
                                        <span className={`text-xs font-semibold flex items-center gap-0.5 tabular-nums ${previewPnl.pct >= 0 ? "text-white/80" : "text-white/30"
                                            }`}>
                                            {previewPnl.pct >= 0
                                                ? <ArrowUpRight className="w-3 h-3 text-green-400" />
                                                : <ArrowDownRight className="w-3 h-3 text-red-400" />}
                                            {previewPnl.pct >= 0 ? "+" : ""}{previewPnl.pct.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── NON-STOCK FIELDS ── */}
                    {!isStock && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <BwLabel>Amount Invested (₹)</BwLabel>
                                <BwInput
                                    type="number"
                                    placeholder="50000"
                                    min={0}
                                    value={form.amount_invested}
                                    onChange={(e) => set("amount_invested", e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <BwLabel>Expected Return % p.a.</BwLabel>
                                <BwInput
                                    type="number"
                                    placeholder="12"
                                    min={0}
                                    max={100}
                                    value={form.expected_return}
                                    onChange={(e) => set("expected_return", e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <p className="text-xs text-white/60 bg-white/[0.04] border border-white/15 rounded-lg px-3 py-2.5">
                            ⚠ {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t border-white/[0.07] flex gap-2.5">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-9 text-white/35 hover:text-white/70 hover:bg-white/[0.05]
              border border-white/[0.08] rounded-lg text-sm"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 h-9 bg-white text-black hover:bg-white/90
              font-semibold rounded-lg text-sm transition-colors"
                    >
                        {loading ? "Saving..." : editData ? "Save Changes" : "Add Investment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export function PortfolioTab({
    investments,
    loadingInvestments,
    createInvestment,
    editInvestment,
    removeInvestment,
}: PortfolioTabProps) {
    const [addOpen, setAddOpen] = useState(false);
    const [editData, setEditData] = useState<ExtendedInvestment | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleteLoading(true);
        try { await removeInvestment(deleteId); setDeleteId(null); }
        finally { setDeleteLoading(false); }
    };

    const totalInvested = investments.reduce((s, i) => s + i.amount_invested, 0);
    const totalCurrentValue = investments.reduce((s, i) => s + calcCurrentValue(i), 0);
    const totalGain = totalCurrentValue - totalInvested;
    const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    const byType = investments.reduce<Record<string, number>>((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + i.amount_invested;
        return acc;
    }, {});

    const donutData = useMemo(() => {
        const types = Object.keys(byType);
        return {
            labels: types.map((t) => TYPE_LABELS[t] || t),
            datasets: [{
                data: types.map((t) => byType[t]),
                backgroundColor: types.map((t) => TYPE_COLORS[t] || "#595959"),
                borderColor: "#000000",
                borderWidth: 2,
                hoverOffset: 4,
            }],
        };
    }, [byType]);

    const donutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#111",
                titleColor: "#fff",
                bodyColor: "#aaa",
                borderColor: "#333",
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    label: (ctx: any) =>
                        ` ${ctx.label}: ${formatINR(ctx.parsed)} (${Math.round((ctx.parsed / totalInvested) * 100)}%)`,
                },
            },
        },
    } as any;

    if (loadingInvestments) {
        return (
            <div className="flex items-center justify-center py-16 text-white/25 text-sm">
                Loading portfolio...
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-white tracking-tight">Manual Portfolio</h2>
                    <p className="text-xs text-white/35 mt-0.5">
                        Track and manage all your investments in one place
                    </p>
                </div>
                <Button
                    size="sm"
                    onClick={() => { setEditData(null); setAddOpen(true); }}
                    className="bg-white text-black hover:bg-white/90 font-semibold text-xs h-8 px-3 rounded-lg"
                >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Investment
                </Button>
            </div>

            {/* ── Summary Cards ── */}
            {investments.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 flex flex-col gap-1">
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Invested</span>
                        <span className="text-xl font-bold text-white tabular-nums">{formatINR(totalInvested)}</span>
                        <span className="text-[10px] text-white/25">
                            {investments.length} holding{investments.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 flex flex-col gap-1">
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Current Value</span>
                        <span className="text-xl font-bold text-white tabular-nums">{formatINR(totalCurrentValue)}</span>
                        <span className="text-[10px] text-white/25">estimated</span>
                    </div>

                    <div className={`rounded-xl border p-4 flex flex-col gap-1 ${totalGain >= 0
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-red-500/10 border-red-500/30"
                        }`}>
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Total P&L</span>
                        <span className="text-xl font-bold text-white tabular-nums">
                            {totalGain >= 0 ? "+" : ""}{formatINR(totalGain)}
                        </span>
                        <span className={`text-[10px] flex items-center gap-0.5 font-medium ${totalGain >= 0 ? "text-white/60" : "text-white/25"
                            }`}>
                            {totalGain >= 0
                                ? <ArrowUpRight className="w-3 h-3 text-green-400" />
                                : <ArrowDownRight className="w-3 h-3 text-red-400" />
                            }
                            {totalGainPct >= 0 ? "+" : ""}{totalGainPct.toFixed(1)}% overall
                        </span>
                    </div>
                </div>
            )}

            {/* ── Donut + Allocation ── */}
            {investments.length > 0 && (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                    <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                        Allocation by Asset Class
                    </span>
                    <div className="flex items-center gap-8 mt-4">
                        <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                            <Doughnut data={donutData} options={donutOptions} />
                        </div>
                        <div className="flex flex-col gap-2.5 flex-1">
                            {Object.entries(byType).map(([type, amount]) => {
                                const pct = totalInvested > 0
                                    ? Math.round((amount / totalInvested) * 100)
                                    : 0;
                                return (
                                    <div key={type} className="flex items-center gap-3">
                                        <span
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: TYPE_COLORS[type] || "#595959" }}
                                        />
                                        <span className="text-sm text-white/45 flex-1">{TYPE_LABELS[type] || type}</span>
                                        <span className="text-sm font-medium text-white tabular-nums">{formatINR(amount)}</span>
                                        <span className="text-xs text-white/25 w-8 text-right tabular-nums">{pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Empty State ── */}
            {investments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center
          border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.04]
            flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-white/25" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-white/40">No investments recorded yet</p>
                        <p className="text-xs text-white/20">
                            Add your first holding to begin tracking portfolio performance
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEditData(null); setAddOpen(true); }}
                        className="border-white/15 text-white/40 hover:text-white/70 hover:bg-white/[0.05]
              text-xs h-8 px-4 rounded-lg"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add your first investment
                    </Button>
                </div>
            )}

            {/* ── Holdings List ── */}
            {investments.length > 0 && (
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                        Holdings
                    </span>

                    {investments.map((inv) => {
                        const stockGrowth = calcStockGrowth(inv);
                        const msHeld = Date.now() - new Date(inv.added_at).getTime();
                        const yrsHeld = msHeld / (1000 * 60 * 60 * 24 * 365);
                        const curVal = calcCurrentValue(inv);
                        const gain = curVal - inv.amount_invested;
                        const gainPct = inv.amount_invested > 0 ? (gain / inv.amount_invested) * 100 : 0;
                        const cagr = calcCAGR(inv.amount_invested, curVal, yrsHeld);
                        const displayGain = stockGrowth ? stockGrowth.gain : gain;
                        const displayPct = stockGrowth ? stockGrowth.gainPct : gainPct;
                        const displayVal = stockGrowth ? stockGrowth.currentValue : curVal;
                        const isUp = displayGain >= 0;

                        return (
                            <div
                                key={inv.id}
                                className="group rounded-xl border border-white/[0.07] bg-white/[0.02]
                  hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-150
                  p-4 flex items-center gap-4"
                            >
                                {/* Color dot */}
                                <div
                                    className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-black"
                                    style={{ backgroundColor: TYPE_COLORS[inv.type] || "#595959" }}
                                />

                                {/* Info */}
                                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-sm text-white truncate">{inv.name}</span>
                                        {inv.ticker && (
                                            <span className="text-[10px] font-mono bg-white/[0.06] text-white/40
                        border border-white/[0.08] px-1.5 py-0.5 rounded">
                                                {inv.ticker}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] px-1.5 py-0 border-white/[0.08]
                        text-white/30 bg-transparent rounded"
                                        >
                                            {TYPE_LABELS[inv.type] || inv.type}
                                        </Badge>

                                        {stockGrowth ? (
                                            <>
                                                <span className="text-[11px] text-white/25">
                                                    {inv.quantity} shares · bought {formatINR(inv.bought_price!)}
                                                </span>
                                                <span className="text-[11px] text-white/25">
                                                    now {formatINR(inv.current_price!)}
                                                </span>
                                                <span className="text-[11px] text-white/25">
                                                    {formatDays(stockGrowth.daysHeld)} held
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                {cagr !== null && yrsHeld >= 0.08 && (
                                                    <span className="text-[11px] font-medium text-white/45">
                                                        CAGR {cagr >= 0 ? "+" : ""}{cagr.toFixed(1)}%
                                                    </span>
                                                )}
                                                <span className="text-[11px] text-white/25">
                                                    {yrsHeld < 1
                                                        ? `${Math.round(yrsHeld * 12)}mo held`
                                                        : `${yrsHeld.toFixed(1)}yr held`}
                                                </span>
                                                <span className="text-[11px] text-white/25">
                                                    {inv.expected_return}% p.a.
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Amounts */}
                                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                    <span className="text-sm font-semibold text-white tabular-nums">
                                        {formatINR(displayVal)}
                                    </span>
                                    <span className={`text-xs flex items-center gap-0.5 tabular-nums font-medium ${isUp ? "text-green-400" : "text-red-400"
                                        }`}>
                                        {isUp
                                            ? <ArrowUpRight className="w-3 h-3 text-green-400" />
                                            : <ArrowDownRight className="w-3 h-3 text-red-400" />
                                        }
                                        {displayPct >= 0 ? "+" : ""}{displayPct.toFixed(2)}%
                                        &nbsp;·&nbsp;
                                        {displayGain >= 0 ? "+" : ""}{formatINR(Math.abs(displayGain))}
                                    </span>
                                    <span className="text-[10px] text-white/20 tabular-nums">
                                        invested {formatINR(inv.amount_invested)}
                                    </span>
                                </div>

                                {/* Actions — DropdownMenu shown on hover */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity
                      w-7 h-7 rounded-lg border border-white/[0.08] bg-white/[0.04]
                      hover:bg-white/[0.09] hover:border-white/15 flex items-center
                      justify-center focus:outline-none flex-shrink-0">
                                            <MoreHorizontal className="w-3.5 h-3.5 text-white/40" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="bg-[#0a0a0a] border-white/10 text-white min-w-[130px] rounded-xl p-1"
                                    >
                                        <DropdownMenuItem
                                            onClick={() => { setEditData(inv); setAddOpen(true); }}
                                            className="text-sm text-white/60 hover:text-white focus:bg-white/[0.08]
                        focus:text-white cursor-pointer gap-2 rounded-lg"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-white/[0.07] my-1" />
                                        <DropdownMenuItem
                                            onClick={() => setDeleteId(inv.id)}
                                            className="text-sm text-white/35 hover:text-white/60 focus:bg-white/[0.05]
                        focus:text-white/60 cursor-pointer gap-2 rounded-lg"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Disclaimer ── */}
            {investments.length > 0 && (
                <p className="text-[10px] text-white/15 border-t border-white/[0.06] pt-3 leading-relaxed">
                    Stock values are calculated from manually entered current prices. Non-stock values use
                    compound interest based on expected annual return. Update current prices periodically for accuracy.
                </p>
            )}

            {/* ── Dialogs ── */}
            <AddInvestmentDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                editData={editData}
                onSubmit={async (payload) => {
                    if (editData) await editInvestment(editData.id, payload);
                    else await createInvestment(payload);
                }}
            />
            <DeleteConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Delete Investment?"
                description="This will permanently remove this investment record from your portfolio."
                onConfirm={handleDelete}
                loading={deleteLoading}
            />
        </div>
    );
}