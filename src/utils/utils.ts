import { getImage } from "astro:assets";
// Generates an optimized WebP image using Astro's getImage() function
// Learn more about the getImage() function here
// https://docs.astro.build/en/guides/images/#generating-images-with-getimage
export async function getOptimizedImage(image) {
  const optimizedImage = await getImage({
    src: image,
    format: "webp",
  });

  return optimizedImage
}

// ----------------------------------------------------------------
// Helper function to parse show start date and time
// Parses show start date and time into a Date object for filtering and sorting
// Expects show object with data.startDate and optional data.startTime
export function parseShowStart(show) {
  const dateRaw = show?.data?.startDate;
  if (!dateRaw) return new Date(0);
  // If the frontmatter date lacks a 4-digit year, append current year
  const hasYear = /\d{4}/.test(dateRaw);
  const datePart = hasYear ? dateRaw : `${dateRaw}, ${new Date().getFullYear()}`;

  // Parse time like "11:00pm" into 24-hour HH:MM
  let timePart = "00:00";
  const t = show?.data?.startTime;
  if (t && typeof t === "string") {
    const m = t.trim().match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
    if (m) {
      let hh = parseInt(m[1], 10);
      const mm = m[2];
      const ampm = m[3].toLowerCase();
      if (ampm === "pm" && hh !== 12) hh += 12;
      if (ampm === "am" && hh === 12) hh = 0;
      timePart = `${String(hh).padStart(2, "0")}:${mm}`;
    }
  }

  // Build a parseable local datetime string
  const local = `${datePart} ${timePart}:00`;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) {
    // fallback: try parsing datePart alone
    const dd = new Date(datePart);
    return Number.isNaN(dd.getTime()) ? new Date(0) : dd;
  }
  return d;
}

// ----------------------------------------------------------------
// Helper to parse date and time strings into ISO format
// Handles formats like "Jun 12, 2028" for date and "9:32pm" or "11:00am" for time
// Returns a Date object in ISO format (UTC) or undefined if parsing fails
export function parseDateTime(
  dateStr: string,
  timeStr: string,
): Date | string | undefined {
  if (!dateStr || !timeStr) return undefined;

  // Parse date
  const dateParts = dateStr.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})$/,
  );
  if (!dateParts) return undefined;
  const monthMap: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  const month = monthMap[dateParts[1]];
  const day = parseInt(dateParts[2], 10);
  const year = parseInt(dateParts[3], 10);

  // Parse time
  const timeParts = timeStr.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!timeParts) return undefined;
  let hours = parseInt(timeParts[1], 10);
  const minutes = parseInt(timeParts[2], 10);
  const ampm = timeParts[3].toLowerCase();
  if (ampm === "pm" && hours < 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;

  // Create Date object in UTC
  // Determine if the date is in Eastern DST (user rule: DST begins on last Sunday of April
  // and ends on last Sunday of October). If DST is active, Eastern is UTC-4, else UTC-5.
  function lastSundayOfMonth(y: number, m: number) {
    const lastDay = new Date(y, m + 1, 0).getDate();
    const lastDayWeek = new Date(y, m, lastDay).getDay();
    const date = lastDay - lastDayWeek; // date number of last Sunday
    return new Date(y, m, date);
  }

  const dstStart = lastSundayOfMonth(year, 3); // April (monthIndex 3)
  const dstEnd = lastSundayOfMonth(year, 9); // October (monthIndex 9)

  const localDateTime = new Date(year, month, day, hours, minutes);
  const inDST = localDateTime >= dstStart && localDateTime < dstEnd;
  const offsetHours = inDST ? -4 : -5; // Eastern offset relative to UTC

  // Convert local Eastern time to UTC by subtracting the offset (e.g., EST -5 -> add 5 hours)
  const utcMillis = Date.UTC(year, month, day, hours - offsetHours, minutes);
  const dateObj = new Date(utcMillis);
  return dateObj.toISOString();
}

// ----------------------------------------------------------------
// Helper to format date string for display with weekday
// Formats a raw date string to include the weekday
// Expects formats like "Jun 12, 2028" or "Sat, Jun 12, 2028"
export function formatDisplayWithWeekday(raw) {
  if (!raw) return "";
  const dr = raw.toString();
  // remove any leading weekday like "Sat, " for parsing
  const withoutWeekday = dr.replace(/^[A-Za-z]{3},\s*/, "");
  // ensure a year exists for reliable parsing
  const hasYear = /\d{4}/.test(withoutWeekday);
  const parseStr = hasYear ? withoutWeekday : `${withoutWeekday}, ${new Date().getFullYear()}`;
  const d = new Date(parseStr);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }
  // fallback: strip year and return
  return dr;
}

// ----------------------------------------------------------------
// Helper to parse address string into parts
// Returns an object with streetAddress, addressLocality, addressRegion, postalCode, addressCountry
// Expects format like "123 Wallaby Way, Cincinnati, OH 45213"
export function parseAddress(addressStr) {
  // Example: "123 Wallaby Way, Cincinnati, OH 45213"
  if (!addressStr) return {};
  const regex = /^(.+?),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5})?$/;
  const match = addressStr.match(regex);
  if (!match) return {};
  return {
    streetAddress: match[1].trim(),
    addressLocality: match[2].trim(),
    addressRegion: match[3].trim(),
    postalCode: match[4] ? match[4].trim() : "",
    addressCountry: "US",
  };
}