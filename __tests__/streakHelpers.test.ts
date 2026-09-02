import {
  dunISO,
  tamamlananGunleriBul,
  mevcutStreakHesapla,
  enUzunStreakHesapla,
  StreakPhoto,
} from "@/store/streakStore";

describe("dunISO", () => {
  it("returns the previous day", () => {
    expect(dunISO("2026-09-02")).toBe("2026-09-01");
  });

  it("handles month boundary", () => {
    expect(dunISO("2026-09-01")).toBe("2026-08-31");
  });

  it("handles year boundary", () => {
    expect(dunISO("2026-01-01")).toBe("2025-12-31");
  });
});

describe("tamamlananGunleriBul", () => {
  const userIds = ["user-a", "user-b"];

  it("returns empty for no photos", () => {
    expect(tamamlananGunleriBul([], userIds)).toEqual([]);
  });

  it("returns empty when only one user sent", () => {
    const photos: StreakPhoto[] = [
      {
        id: "1",
        photoUrl: "test",
        sentDate: "2026-09-01",
        createdBy: "user-a",
        createdAt: "",
      },
    ];
    expect(tamamlananGunleriBul(photos, userIds)).toEqual([]);
  });

  it("returns the day when both users sent photos", () => {
    const photos: StreakPhoto[] = [
      {
        id: "1",
        photoUrl: "test",
        sentDate: "2026-09-01",
        createdBy: "user-a",
        createdAt: "",
      },
      {
        id: "2",
        photoUrl: "test",
        sentDate: "2026-09-01",
        createdBy: "user-b",
        createdAt: "",
      },
    ];
    expect(tamamlananGunleriBul(photos, userIds)).toEqual(["2026-09-01"]);
  });
});

describe("mevcutStreakHesapla", () => {
  it("returns 0 for no completed days", () => {
    expect(mevcutStreakHesapla([])).toBe(0);
  });

  it("returns 1 when only today is completed", () => {
    expect(mevcutStreakHesapla(["2026-09-02"], "2026-09-02")).toBe(1);
  });

  it("counts consecutive days from today backwards", () => {
    const gunler = ["2026-08-31", "2026-09-01", "2026-09-02"];
    expect(mevcutStreakHesapla(gunler, "2026-09-02")).toBe(3);
  });

  it("counts from yesterday if today is not completed", () => {
    const gunler = ["2026-08-30", "2026-08-31", "2026-09-01"];
    expect(mevcutStreakHesapla(gunler, "2026-09-02")).toBe(3);
  });

  it("breaks streak on gap", () => {
    const gunler = ["2026-08-29", "2026-09-01", "2026-09-02"];
    expect(mevcutStreakHesapla(gunler, "2026-09-02")).toBe(2);
  });
});

describe("enUzunStreakHesapla", () => {
  it("returns 0 for empty list", () => {
    expect(enUzunStreakHesapla([])).toBe(0);
  });

  it("returns 1 for single day", () => {
    expect(enUzunStreakHesapla(["2026-09-01"])).toBe(1);
  });

  it("finds longest consecutive streak", () => {
    const gunler = [
      "2026-08-01",
      "2026-08-02",
      "2026-08-03", // 3 days
      "2026-08-10",
      "2026-08-11", // 2 days
    ];
    expect(enUzunStreakHesapla(gunler)).toBe(3);
  });
});
