import { isValidDate, isValidTime, clampString, isValidDayMonth } from "@/lib/validation";

describe("isValidDate", () => {
  it("accepts valid dates", () => {
    expect(isValidDate("2026-01-15")).toBe(true);
    expect(isValidDate("2026-12-31")).toBe(true);
    expect(isValidDate("2024-02-29")).toBe(true); // Leap year
  });

  it("rejects invalid dates", () => {
    expect(isValidDate("2026-02-31")).toBe(false); // Feb doesn't have 31 days
    expect(isValidDate("2026-02-29")).toBe(false); // 2026 is not a leap year
    expect(isValidDate("2026-13-01")).toBe(false); // Month 13
    expect(isValidDate("2026-00-15")).toBe(false); // Month 0
    expect(isValidDate("not-a-date")).toBe(false);
    expect(isValidDate("2026-1-5")).toBe(false); // Not zero-padded
    expect(isValidDate("")).toBe(false);
  });
});

describe("isValidTime", () => {
  it("accepts valid times", () => {
    expect(isValidTime("00:00")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
    expect(isValidTime("12:30")).toBe(true);
  });

  it("rejects invalid times", () => {
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("12:60")).toBe(false);
    expect(isValidTime("9:30")).toBe(false); // Not zero-padded
    expect(isValidTime("noon")).toBe(false);
    expect(isValidTime("")).toBe(false);
  });
});

describe("clampString", () => {
  it("returns short strings unchanged", () => {
    expect(clampString("hello", 10)).toBe("hello");
  });

  it("truncates long strings", () => {
    expect(clampString("hello world", 5)).toBe("hello");
  });

  it("handles exact length", () => {
    expect(clampString("abc", 3)).toBe("abc");
  });

  it("handles empty string", () => {
    expect(clampString("", 10)).toBe("");
  });
});

describe("isValidDayMonth", () => {
  it("accepts valid day/month combos", () => {
    expect(isValidDayMonth(15, 6)).toBe(true);
    expect(isValidDayMonth(29, 2)).toBe(true); // Leap year tolerant
    expect(isValidDayMonth(31, 1)).toBe(true);
    expect(isValidDayMonth(31, 3)).toBe(true);
  });

  it("rejects invalid day/month combos", () => {
    expect(isValidDayMonth(31, 2)).toBe(false); // Feb never has 31
    expect(isValidDayMonth(30, 2)).toBe(false); // Feb never has 30
    expect(isValidDayMonth(31, 4)).toBe(false); // April has 30
    expect(isValidDayMonth(0, 1)).toBe(false);
    expect(isValidDayMonth(1, 0)).toBe(false);
    expect(isValidDayMonth(1, 13)).toBe(false);
    expect(isValidDayMonth(32, 1)).toBe(false);
  });
});
