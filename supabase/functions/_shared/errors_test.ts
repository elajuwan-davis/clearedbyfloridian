import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { errorMessage } from "./errors.ts";

Deno.test("errorMessage reads an Error's message", () => {
  assertEquals(errorMessage(new Error("permit not found")), "permit not found");
});

Deno.test("errorMessage never returns [object Object] for a PostgrestError", () => {
  // The shape that produced {"error":"[object Object]"} for an invalid uuid.
  const pg = {
    code: "22P02",
    details: null,
    hint: null,
    message: 'invalid input syntax for type uuid: "not-a-uuid"',
  };
  assertEquals(errorMessage(pg), 'invalid input syntax for type uuid: "not-a-uuid" [22P02]');
});

Deno.test("errorMessage keeps details and hint when Postgres supplies them", () => {
  assertEquals(
    errorMessage({
      code: "23503",
      message: "insert or update on table violates foreign key constraint",
      details: "Key (permit_id) is not present in table permits.",
      hint: "check the permit id",
    }),
    "insert or update on table violates foreign key constraint [23503] — " +
      "Key (permit_id) is not present in table permits. — check the permit id",
  );
});

Deno.test("errorMessage passes strings through and names the empty cases", () => {
  assertEquals(errorMessage("plain failure"), "plain failure");
  assertEquals(errorMessage(""), "unknown error");
  assertEquals(errorMessage(null), "unknown error");
  assertEquals(errorMessage(undefined), "unknown error");
  assertEquals(errorMessage(new Error()), "Error");
});

Deno.test("errorMessage falls back to a real toString, then to JSON", () => {
  assertEquals(errorMessage(new URL("https://example.test/x")), "https://example.test/x");
  assertEquals(errorMessage({ status: 502 }), '{"status":502}');
  const circular: Record<string, unknown> = {};
  circular.self = circular;
  assertEquals(errorMessage(circular), "unknown error object");
});

Deno.test("errorMessage handles non-object primitives", () => {
  assertEquals(errorMessage(404), "404");
  assertEquals(errorMessage(false), "false");
});
