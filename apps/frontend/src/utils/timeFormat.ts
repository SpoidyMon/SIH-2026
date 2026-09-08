export const TIME_OPTIONS: string[] = [
  "06:00 AM",
  "06:30 AM",
  "07:00 AM",
  "07:30 AM",
  "08:00 AM",
  "08:30 AM",
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
  "07:30 PM",
  "08:00 PM",
  "08:30 PM",
  "09:00 PM",
];

export const TIMEZONES = [
  { label: "India Standard Time (IST, GMT+5:30)", value: "Asia/Kolkata" },
  { label: "UTC (GMT+0)", value: "UTC" },
  { label: "Gulf Standard Time (GST, GMT+4)", value: "Asia/Dubai" },
  { label: "British Summer Time (BST, GMT+1)", value: "Europe/London" },
  { label: "Eastern Time (ET, GMT-5)", value: "America/New_York" },
];

/**
 * Converts "9:00 AM" or "09:00 AM" to 24h format "09:00".
 * If already in 24h format (e.g. "09:00"), returns it normalized.
 */
export function to24Hour(timeStr: string): string {
  if (!timeStr) return "09:00";
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return timeStr;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();

  if (meridiem) {
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

/**
 * Converts 24h format "09:00" or "17:00" to 12h display format "9:00 AM" or "5:00 PM".
 */
export function to12Hour(timeStr: string): string {
  if (!timeStr) return "9:00 AM";
  const trimmed = timeStr.trim();
  if (trimmed.toUpperCase().includes("AM") || trimmed.toUpperCase().includes("PM")) {
    return trimmed;
  }

  const parts = trimmed.split(":");
  if (parts.length < 2) return timeStr;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const meridiem = hours >= 12 ? "PM" : "AM";

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes} ${meridiem}`;
}

/**
 * Calculates the next YYYY-MM-DD date for a given day of the week (starting from today).
 */
export function getNextDateForDay(
  dayName: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday",
  baseDate = new Date()
): string {
  const dayIndexMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const targetDayIndex = dayIndexMap[dayName];
  const currentDayIndex = baseDate.getDay();

  let daysAhead = targetDayIndex - currentDayIndex;
  if (daysAhead < 0) {
    daysAhead += 7;
  }

  const targetDate = new Date(baseDate);
  targetDate.setDate(baseDate.getDate() + daysAhead);

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
