import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchPortalForAddress } from "./address-portal.ts";

const LIST = [
  { name: "Palm Beach" },
  { name: "West Palm Beach" },
  { name: "North Palm Beach" },
  { name: "Palm Beach Gardens" },
  { name: "Royal Palm Beach" },
  { name: "Miami" },
  { name: "Miami Beach" },
  { name: "Ft. Lauderdale" },
  { name: "Ft Myers" },
  { name: "Port St. Lucie" },
  { name: "Stuart" },
];

describe("matchPortalForAddress", () => {
  it("returns undefined for an empty or unknown address", () => {
    assert.equal(matchPortalForAddress("", LIST), undefined);
    assert.equal(matchPortalForAddress("123 Main St, Orlando, FL", LIST), undefined);
  });

  it("picks the longest catalog name contained in the address", () => {
    assert.equal(
      matchPortalForAddress("418 Seabreeze Ave, West Palm Beach, FL 33401", LIST)?.name,
      "West Palm Beach",
    );
    assert.equal(
      matchPortalForAddress("1 Ocean Blvd, North Palm Beach, FL", LIST)?.name,
      "North Palm Beach",
    );
    assert.equal(
      matchPortalForAddress("77 Worth Ave, Palm Beach, FL 33480", LIST)?.name,
      "Palm Beach",
    );
    assert.equal(
      matchPortalForAddress("100 Collins Ave, Miami Beach, FL", LIST)?.name,
      "Miami Beach",
    );
  });

  it("maps Fort-spelling aliases onto the catalog name", () => {
    assert.equal(
      matchPortalForAddress("500 E Las Olas, Fort Lauderdale, FL", LIST)?.name,
      "Ft. Lauderdale",
    );
    assert.equal(
      matchPortalForAddress("1 Downtown, Fort Myers, FL", LIST)?.name,
      "Ft Myers",
    );
    assert.equal(
      matchPortalForAddress("200 Port St Lucie Blvd, Port St. Lucie, FL", LIST)?.name,
      "Port St. Lucie",
    );
  });

  it("does not match an alias unless that catalog row exists", () => {
    assert.equal(matchPortalForAddress("Fort Lauderdale, FL", [{ name: "Miami" }]), undefined);
  });
});
