import test from "node:test";
import assert from "node:assert/strict";
import {
  doseRecordSchema,
  doseReference,
  totalAmount,
} from "../lib/aip/dosage.ts";
test("product-specific label totals are not interchangeable or extrapolated", () => {
  assert.equal(doseReference("botox", "glabella")?.total, 20);
  assert.equal(doseReference("dysport", "glabella")?.total, 50);
  assert.equal(doseReference("botox", "forehead-glabella")?.total, 40);
  assert.equal(doseReference("dysport", "forehead-glabella"), undefined);
  assert.equal(doseReference("filler", "lips"), undefined);
});
test("amount records reject unknown products, non-finite values and mismatched regions", () => {
  const record = {
    product: "botox",
    exactProduct: "BOTOX Cosmetic",
    region: "glabella",
    left: 4,
    right: 4,
    central: 12,
    notes: "Discussion only",
  };
  assert.equal(totalAmount(doseRecordSchema.parse(record)), 20);
  for (const change of [
    { left: -1 },
    { right: NaN },
    { product: "unknown" },
    { region: "lips" },
  ])
    assert.equal(
      doseRecordSchema.safeParse({ ...record, ...change }).success,
      false,
    );
});
test("generic categories cannot masquerade as exact formulations",()=>{
  for (const [product,region,exactProduct] of [["filler","lips","Dermal filler"],["other-toxin","glabella","Other neuromodulator"],["filler","lips",""]]) {
    assert.equal(doseRecordSchema.safeParse({product,region,exactProduct,left:1,right:0,central:0,notes:""}).success,false);
  }
});
