import { sonrakiTarih, kalanGun, enYakinOzelGun, OzelGun } from "@/data/ozelGunler";

const ornekGunler: OzelGun[] = [
  { id: "1", baslik: "Yıldönümü", ay: 6, gun: 15, emoji: "💕" },
  { id: "2", baslik: "Doğum Günü", ay: 12, gun: 25, emoji: "🎂" },
  { id: "3", baslik: "Sevgililer Günü", ay: 2, gun: 14, emoji: "❤️" },
];

describe("sonrakiTarih", () => {
  it("returns this year if the date has not passed", () => {
    const bugun = new Date(2026, 0, 1); // 1 Ocak
    const gun: OzelGun = { id: "1", baslik: "Test", ay: 6, gun: 15, emoji: "💕" };
    const hedef = sonrakiTarih(gun, bugun);
    expect(hedef.getFullYear()).toBe(2026);
    expect(hedef.getMonth()).toBe(5); // Haziran
    expect(hedef.getDate()).toBe(15);
  });

  it("rolls over to next year if the date has passed", () => {
    const bugun = new Date(2026, 6, 1); // 1 Temmuz — Haziran 15 geçti
    const gun: OzelGun = { id: "1", baslik: "Test", ay: 6, gun: 15, emoji: "💕" };
    const hedef = sonrakiTarih(gun, bugun);
    expect(hedef.getFullYear()).toBe(2027);
  });

  it("returns today if the date is today", () => {
    const bugun = new Date(2026, 5, 15); // 15 Haziran
    const gun: OzelGun = { id: "1", baslik: "Test", ay: 6, gun: 15, emoji: "💕" };
    const hedef = sonrakiTarih(gun, bugun);
    expect(hedef.getFullYear()).toBe(2026);
    expect(kalanGun(hedef, bugun)).toBe(0);
  });
});

describe("kalanGun", () => {
  it("returns 0 for today", () => {
    const bugun = new Date(2026, 5, 15);
    expect(kalanGun(bugun, bugun)).toBe(0);
  });

  it("returns positive for future dates", () => {
    const bugun = new Date(2026, 0, 1);
    const hedef = new Date(2026, 0, 11);
    expect(kalanGun(hedef, bugun)).toBe(10);
  });
});

describe("enYakinOzelGun", () => {
  it("returns null for empty list", () => {
    expect(enYakinOzelGun([])).toBeNull();
  });

  it("finds the nearest special day", () => {
    const bugun = new Date(2026, 5, 10); // 10 Haziran
    const yakin = enYakinOzelGun(ornekGunler, bugun);
    expect(yakin).not.toBeNull();
    expect(yakin!.gun.baslik).toBe("Yıldönümü"); // 15 Haziran — en yakın
    expect(yakin!.kalan).toBe(5);
  });

  it("handles year rollover correctly", () => {
    const bugun = new Date(2026, 11, 26); // 26 Aralık — Noel geçti
    const yakin = enYakinOzelGun(ornekGunler, bugun);
    expect(yakin).not.toBeNull();
    // Sonraki en yakın: 14 Şubat 2027
    expect(yakin!.gun.baslik).toBe("Sevgililer Günü");
  });
});
