// Inspection labels and upcoming/stage rules. Isolated from inspections-api.ts so
// the rules can load under tsx without the Supabase client or notification side effects.

export type InspectionType =
  | "rough"
  | "framing"
  | "final"
  | "pool_shell"
  | "pool_steel"
  | "electric_bond"
  | "deck"
  | "wet_niche"
  | "electrical_rough"
  | "plumbing_rough"
  | "final_building";

export type InspectionResult = "pending" | "passed" | "failed" | "reinspect" | "cancelled";

export const INSPECTION_TYPES: { value: InspectionType; label: string }[] = [
  { value: "rough", label: "Rough" },
  { value: "framing", label: "Framing" },
  { value: "pool_shell", label: "Pool Shell" },
  { value: "pool_steel", label: "Pool Steel" },
  { value: "electric_bond", label: "Electric Bond" },
  { value: "deck", label: "Deck" },
  { value: "wet_niche", label: "Wet Niche" },
  { value: "electrical_rough", label: "Electrical Rough" },
  { value: "plumbing_rough", label: "Plumbing Rough" },
  { value: "final_building", label: "Final Building" },
  { value: "final", label: "Final" },
];

export const TIME_WINDOWS = [
  { value: "morning", label: "Morning (8am–12pm)" },
  { value: "afternoon", label: "Afternoon (12pm–5pm)" },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
] as const;

export type InspectionStatusInput = {
  inspection_type: InspectionType | string;
  requested_date?: string | null;
  scheduled_date?: string | null;
  result?: InspectionResult | string | null;
};

/** Returns the most recent inspection stage for Victoria summary. */
export function currentInspectionStage(inspections: InspectionStatusInput[]): string | null {
  if (!inspections.length) return null;
  const passed = inspections.filter((i) => i.result === "passed");
  if (passed.length === 0) return `Awaiting ${labelFor(inspections[0].inspection_type)}`;
  const last = passed[0];
  return `${labelFor(last.inspection_type)} passed`;
}

export function labelFor(type: string): string {
  return INSPECTION_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function labelForTime(time: string | null | undefined): string {
  if (!time) return "";
  const hit = TIME_WINDOWS.find((t) => t.value === time);
  return hit?.label ?? time;
}

/** Has a recorded outcome that can be shown in View report. */
export function hasReport(i: InspectionStatusInput): boolean {
  return i.result === "passed" || i.result === "failed" || i.result === "reinspect";
}

export function isUpcoming(
  i: InspectionStatusInput,
  today = new Date().toISOString().slice(0, 10),
): boolean {
  if (i.result === "passed" || i.result === "failed" || i.result === "cancelled") return false;
  const d = i.scheduled_date || i.requested_date;
  if (!d) return true;
  return d >= today;
}
