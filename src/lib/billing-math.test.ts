import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeTransactionFee,
  fmtUsd,
  hasOverdueInvoices,
  invoiceTotal,
  mapInvoiceStatus,
  outstandingBalanceForInvoices,
} from "./billing-math.ts";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-08-31T12:00:00.000Z");

describe("computeTransactionFee", () => {
  it("charges half of the municipal savings, rounded", () => {
    assert.deepEqual(computeTransactionFee(10_000, 4_000), {
      savingsCents: 6_000,
      feeCents: 3_000,
    });
    assert.deepEqual(computeTransactionFee(101, 0), { savingsCents: 101, feeCents: 51 });
  });

  it("is zero when the private-provider path is not cheaper", () => {
    assert.deepEqual(computeTransactionFee(5_000, 5_000), { savingsCents: 0, feeCents: 0 });
    assert.deepEqual(computeTransactionFee(5_000, 8_000), { savingsCents: 0, feeCents: 0 });
  });
});

describe("mapInvoiceStatus", () => {
  it("keeps paid and refunded even when the row is old", () => {
    const old = new Date(NOW - 40 * DAY).toISOString();
    assert.equal(mapInvoiceStatus("paid", old, NOW), "paid");
    assert.equal(mapInvoiceStatus("refunded", old, NOW), "refunded");
  });

  it("marks a pending invoice overdue only after 14 days", () => {
    const exactly14 = new Date(NOW - 14 * DAY).toISOString();
    const justOver = new Date(NOW - 14 * DAY - 1).toISOString();
    const under = new Date(NOW - 13 * DAY).toISOString();
    assert.equal(mapInvoiceStatus("pending", exactly14, NOW), "pending");
    assert.equal(mapInvoiceStatus("pending", justOver, NOW), "overdue");
    assert.equal(mapInvoiceStatus("pending", under, NOW), "pending");
  });

  it("treats missing createdAt or an unknown status as pending", () => {
    assert.equal(mapInvoiceStatus("pending", null, NOW), "pending");
    assert.equal(mapInvoiceStatus("unknown", new Date(NOW - 40 * DAY).toISOString(), NOW), "pending");
  });
});

describe("outstandingBalanceForInvoices / hasOverdueInvoices", () => {
  const a = "tenant-a";
  const b = "tenant-b";
  const invoices = [
    { accountId: a, status: "pending", lineItems: [{ amountCents: 1_000 }, { amountCents: 200 }] },
    { accountId: a, status: "overdue", lineItems: [{ amountCents: 500 }] },
    { accountId: a, status: "paid", lineItems: [{ amountCents: 9_999 }] },
    { accountId: a, status: "refunded", lineItems: [{ amountCents: 400 }] },
    { accountId: b, status: "overdue", lineItems: [{ amountCents: 8_000 }] },
  ];

  it("sums only unpaid rows for that tenant", () => {
    assert.equal(invoiceTotal(invoices[0]), 1_200);
    assert.equal(outstandingBalanceForInvoices(invoices, a), 1_700);
    assert.equal(outstandingBalanceForInvoices(invoices, b), 8_000);
  });

  it("does not flag overdue from another tenant's invoice", () => {
    assert.equal(hasOverdueInvoices(invoices, a), true);
    assert.equal(hasOverdueInvoices(invoices.filter((i) => i.status !== "overdue"), a), false);
    assert.equal(hasOverdueInvoices(invoices, "tenant-c"), false);
  });
});

describe("fmtUsd", () => {
  it("formats cents in en-US with two decimals", () => {
    assert.equal(fmtUsd(0), "$0.00");
    assert.equal(fmtUsd(123456), "$1,234.56");
  });
});
