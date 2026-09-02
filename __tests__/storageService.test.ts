import { extractStoragePath, FotoBucket } from "@/services/storageService";

describe("extractStoragePath", () => {
  const bucket: FotoBucket = "memory-photos";

  it("extracts path from legacy public URL", () => {
    const url = "https://abc.supabase.co/storage/v1/object/public/memory-photos/123-abc.jpg";
    expect(extractStoragePath(bucket, url)).toBe("123-abc.jpg");
  });

  it("extracts path from public URL with user namespace", () => {
    const url = "https://abc.supabase.co/storage/v1/object/public/memory-photos/user-id/abc.jpg";
    expect(extractStoragePath(bucket, url)).toBe("user-id/abc.jpg");
  });

  it("extracts path from signed URL", () => {
    const url =
      "https://abc.supabase.co/storage/v1/object/sign/memory-photos/user-id/abc.jpg?token=xyz";
    expect(extractStoragePath(bucket, url)).toBe("user-id/abc.jpg");
  });

  it("returns direct storage path unchanged", () => {
    expect(extractStoragePath(bucket, "user-id/abc.jpg")).toBe("user-id/abc.jpg");
  });

  it("returns null for empty string", () => {
    expect(extractStoragePath(bucket, "")).toBeNull();
  });

  it("returns null for unrelated URL", () => {
    expect(extractStoragePath(bucket, "https://example.com/photo.jpg")).toBeNull();
  });

  it("handles different buckets", () => {
    const url = "https://abc.supabase.co/storage/v1/object/public/surprise-media/photo.jpg";
    expect(extractStoragePath("surprise-media", url)).toBe("photo.jpg");
  });
});
