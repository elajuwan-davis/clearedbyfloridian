export type DbprResult = {
  license_number: string;
  status: "active" | "expired" | "inactive" | "not_found" | "unknown";
  holder_name?: string;
  license_type?: string;
  expiration?: string; // yyyy-mm-dd
  lookup_url: string;
  checked_at: string;
};

export async function verifyDbprLicense(licenseNumber: string): Promise<DbprResult> {
  const resp = await fetch(`/api/verify-license?ln=${encodeURIComponent(licenseNumber)}`);
  if (!resp.ok) {
    return {
      license_number: licenseNumber,
      status: "unknown",
      lookup_url: dbprLookupUrl(licenseNumber),
      checked_at: new Date().toISOString(),
    };
  }
  return (await resp.json()) as DbprResult;
}

export function dbprLookupUrl(licenseNumber: string): string {
  return `https://www.myfloridalicense.com/LicenseDetail.asp?SID=&id=${encodeURIComponent(licenseNumber)}`;
}
