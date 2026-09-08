import { describe, it, expect } from "vitest";
import { normalizeCropName } from "../src/ai/tools/aiTools.js";
import {
  resolveTargetDate,
  parseQuantityKg,
  detectIntent,
} from "../src/ai/agent/bookingAgent.js";

describe("AI Voice Agent Parser & Normalizer Tests", () => {
  it("normalizes regional crop names to canonical crop definitions", () => {
    expect(normalizeCropName("गेहूं")).toEqual({ cropId: "wheat", name: "Wheat" });
    expect(normalizeCropName("गहू")).toEqual({ cropId: "wheat", name: "Wheat" });
    expect(normalizeCropName("सरसों")).toEqual({ cropId: "mustard", name: "Mustard" });
    expect(normalizeCropName("धान")).toEqual({ cropId: "rice", name: "Rice" });
    expect(normalizeCropName("चना")).toEqual({ cropId: "chana", name: "Gram (Chana)" });
  });

  it("resolves relative natural language dates accurately", () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowStr = tomorrowObj.toISOString().slice(0, 10);

    expect(resolveTargetDate("kal 9 baje slot book karo")).toBe(tomorrowStr);
    expect(resolveTargetDate("उद्या 100 किलो गहू")).toBe(tomorrowStr);
  });

  it("parses weight strictly in KG from text prompts", () => {
    expect(parseQuantityKg("100 kilo wheat")).toBe(100);
    expect(parseQuantityKg("१०० किलो गेहूं")).toBe(100);
    expect(parseQuantityKg("1 quintal wheat")).toBe(100);
    expect(parseQuantityKg("2.5 quintals")).toBe(250);
  });

  it("detects user intent correctly", () => {
    expect(detectIntent("Book 100 kg wheat")).toBe("BOOK_SLOT");
    expect(detectIntent("मेरी बुकिंग बताओ")).toBe("VIEW_BOOKINGS");
    expect(detectIntent("cancel booking BKG123")).toBe("CANCEL_BOOKING");
  });
});
