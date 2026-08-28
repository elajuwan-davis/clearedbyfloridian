import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PermitDoc } from "./permits-api.ts";
import {
  bundleAllFeesConfirmed,
  bundleBudgetedTotal,
  bundleProgress,
  newEmptyTrade,
  slugTrade,
  tradeCardState,
  tradeRowStatus,
  type Bundle,
  type BundleTrade,
} from "./bundle.ts";

function trade(partial: Partial<BundleTrade> & Pick<BundleTrade, "key" | "label">): BundleTrade {
  return {
    sub_id: null,
    sub_snapshot: null,
    signature_status: "pending",
    doc_keys: [],
    ready: false,
    ...partial,
  };
}

function doc(partial: Partial<PermitDoc> & Pick<PermitDoc, "key">): PermitDoc {
  return {
    label: partial.key,
    required: true,
    status: "pending",
    filename: null,
    ...partial,
  };
}

function bundle(trades: BundleTrade[]): Bundle {
  return {
    enabled: true,
    status: "draft",
    gc_fee_cents: 0,
    gc_license_number: "CPC1459161",
    trades,
  };
}

describe("slugTrade", () => {
  it("slugifies labels and strips edge separators", () => {
    assert.equal(slugTrade("Pool / Spa"), "pool_spa");
    assert.equal(slugTrade("  Electric  "), "electric");
    assert.equal(slugTrade("!!!"), "");
  });
});

describe("newEmptyTrade", () => {
  it("disambiguates colliding keys instead of overwriting a sibling trade", () => {
    const first = newEmptyTrade("Pool");
    const second = newEmptyTrade("Pool", [first.key]);
    const third = newEmptyTrade("Pool", [first.key, second.key]);
    assert.equal(first.key, "pool");
    assert.equal(second.key, "pool_2");
    assert.equal(third.key, "pool_3");
  });
});

describe("tradeCardState", () => {
  it("prefers signature status over a filled-in company snapshot", () => {
    const withCompany = { company: "Acme Electric" };
    assert.equal(
      tradeCardState(
        trade({ key: "a", label: "A", signature_status: "signed", sub_snapshot: withCompany }),
      ),
      "signed",
    );
    assert.equal(
      tradeCardState(
        trade({ key: "a", label: "A", signature_status: "sent", sub_snapshot: withCompany }),
      ),
      "invited",
    );
    assert.equal(
      tradeCardState(trade({ key: "a", label: "A", sub_snapshot: withCompany })),
      "active",
    );
    assert.equal(tradeCardState(trade({ key: "a", label: "A" })), "no_sub");
  });
});

describe("bundleProgress", () => {
  it("treats an empty bundle as 0% and not all-signed", () => {
    assert.deepEqual(bundleProgress(null), {
      total: 0,
      signed: 0,
      sent: 0,
      pending: 0,
      percent: 0,
      allSigned: false,
    });
  });

  it("rounds percent from signed/total and requires every trade signed", () => {
    const progress = bundleProgress(
      bundle([
        trade({ key: "a", label: "A", signature_status: "signed" }),
        trade({ key: "b", label: "B", signature_status: "sent" }),
        trade({ key: "c", label: "C" }),
      ]),
    );
    assert.equal(progress.total, 3);
    assert.equal(progress.signed, 1);
    assert.equal(progress.sent, 1);
    assert.equal(progress.pending, 1);
    assert.equal(progress.percent, 33);
    assert.equal(progress.allSigned, false);

    const done = bundleProgress(
      bundle([
        trade({ key: "a", label: "A", signature_status: "signed" }),
        trade({ key: "b", label: "B", signature_status: "signed" }),
      ]),
    );
    assert.equal(done.percent, 100);
    assert.equal(done.allSigned, true);
  });
});

describe("tradeRowStatus", () => {
  it("stays not_contacted / sent until the trade is signed", () => {
    const t = trade({ key: "pool", label: "Pool", doc_keys: ["plans"] });
    assert.equal(tradeRowStatus(t, [doc({ key: "plans", status: "uploaded" })]), "not_contacted");
    assert.equal(
      tradeRowStatus({ ...t, signature_status: "sent" }, [
        doc({ key: "plans", status: "uploaded" }),
      ]),
      "sent",
    );
  });

  it("treats a signed trade with no assigned docs as incomplete", () => {
    const t = trade({ key: "pool", label: "Pool", signature_status: "signed" });
    assert.equal(
      tradeRowStatus(t, [doc({ key: "plans", status: "uploaded" })]),
      "signed_docs_missing",
    );
  });

  it("is complete only when every required assigned doc is uploaded or N/A", () => {
    const t = trade({
      key: "pool",
      label: "Pool",
      signature_status: "signed",
      doc_keys: ["plans", "calcs"],
    });
    const docs = [
      doc({ key: "plans", status: "uploaded" }),
      doc({ key: "calcs", status: "pending" }),
    ];
    assert.equal(tradeRowStatus(t, docs), "signed_docs_missing");
    assert.equal(
      tradeRowStatus(t, [docs[0], doc({ key: "calcs", status: "not_applicable" })]),
      "signed_complete",
    );
    assert.equal(
      tradeRowStatus(t, [docs[0], doc({ key: "calcs", required: false, status: "pending" })]),
      "signed_complete",
    );
  });
});

describe("bundle fee helpers", () => {
  it("sums budgeted cents and requires every trade to confirm", () => {
    const b = bundle([
      trade({ key: "a", label: "A", budgeted_fee_cents: 1000, fee_confirmed: true }),
      trade({ key: "b", label: "B", budgeted_fee_cents: 250, fee_confirmed: false }),
    ]);
    assert.equal(bundleBudgetedTotal(b), 1250);
    assert.equal(bundleAllFeesConfirmed(b), false);
    assert.equal(bundleAllFeesConfirmed(null), false);
    assert.equal(
      bundleAllFeesConfirmed(bundle([trade({ key: "a", label: "A", fee_confirmed: true })])),
      true,
    );
  });
});
