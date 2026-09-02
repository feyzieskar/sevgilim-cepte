import { bugunISO, isoToDate, tarihUzun, tarihKisa, yilOnce, gunMetni } from "@/constants/tarih";

describe("bugunISO", () => {
  it("formats a date as YYYY-MM-DD", () => {
    const d = new Date(2026, 8, 2); // 2 Eylül 2026
    expect(bugunISO(d)).toBe("2026-09-02");
  });

  it("pads single-digit months and days", () => {
    const d = new Date(2026, 0, 5); // 5 Ocak 2026
    expect(bugunISO(d)).toBe("2026-01-05");
  });

  it("handles December 31", () => {
    const d = new Date(2026, 11, 31);
    expect(bugunISO(d)).toBe("2026-12-31");
  });
});

describe("isoToDate", () => {
  it("parses ISO date string", () => {
    const d = isoToDate("2026-09-02");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8); // 0-indexed
    expect(d.getDate()).toBe(2);
  });
});

describe("tarihUzun", () => {
  it("formats to Turkish long date", () => {
    const result = tarihUzun("2026-06-22");
    expect(result).toContain("22");
    expect(result).toContain("Haziran");
    expect(result).toContain("2026");
  });
});

describe("tarihKisa", () => {
  it("formats to Turkish short date", () => {
    expect(tarihKisa("2026-01-15")).toBe("15 Ocak");
    expect(tarihKisa("2026-12-25")).toBe("25 Aralık");
  });
});

describe("yilOnce", () => {
  it("returns 0 for same year", () => {
    const bugun = new Date(2026, 5, 1);
    expect(yilOnce("2026-01-15", bugun)).toBe(0);
  });

  it("returns correct difference", () => {
    const bugun = new Date(2026, 5, 1);
    expect(yilOnce("2023-06-01", bugun)).toBe(3);
  });
});

describe("gunMetni", () => {
  it('returns "Bugün" for current year', () => {
    const bugun = new Date(2026, 5, 15);
    expect(gunMetni("2026-06-15", bugun)).toBe("Bugün");
  });

  it('returns "Geçen yıl bugün" for 1 year ago', () => {
    const bugun = new Date(2026, 5, 15);
    expect(gunMetni("2025-06-15", bugun)).toBe("Geçen yıl bugün");
  });

  it("returns N years ago for older dates", () => {
    const bugun = new Date(2026, 5, 15);
    expect(gunMetni("2023-06-15", bugun)).toBe("3 yıl önce bugün");
  });
});
