import { aracOzeti } from "@/services/feyziService";

describe("aracOzeti (tool summary)", () => {
  it("generates calendar event summary", () => {
    const ozet = aracOzeti("takvimeEtkinlikEkle", {
      title: "Sinema",
      date: "2026-09-05",
      time: "20:00",
      category: "bulusma",
    });
    expect(ozet).toContain("Sinema");
    expect(ozet).toContain("2026-09-05");
    expect(ozet).toContain("20:00");
    expect(ozet).toContain("Buluşma");
  });

  it("generates special day summary", () => {
    const ozet = aracOzeti("ozelGunEkle", {
      title: "Yıldönümü",
      emoji: "💕",
      gun: 15,
      ay: 6,
    });
    expect(ozet).toContain("Yıldönümü");
    expect(ozet).toContain("💕");
    expect(ozet).toContain("15.6");
  });

  it("generates love reason summary", () => {
    const ozet = aracOzeti("sevmeSebebiEkle", {
      text: "Gülüşün her şeyi güzelleştiriyor",
    });
    expect(ozet).toContain("Gülüşün");
  });

  it("truncates long love reason text", () => {
    const longText = "A".repeat(200);
    const ozet = aracOzeti("sevmeSebebiEkle", { text: longText });
    expect(ozet.length).toBeLessThan(200);
  });

  it("returns tool name for unknown tools", () => {
    expect(aracOzeti("unknownTool", {})).toBe("unknownTool");
  });
});
