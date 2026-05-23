import { describe, it, expect, vi, afterEach } from "vitest";
import { FunService } from "./FunService.js";

describe("FunService", () => {
  const fun = new FunService();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("coinflip win pays positive bet", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    expect(fun.coinflip(100).payout).toBe(100);
  });

  it("coinflip loss pays negative bet", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    expect(fun.coinflip(100).payout).toBe(-100);
  });

  it("slots triple match pays 5x bet", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const r = fun.slots(50);
    expect(r.payout).toBe(250);
  });

  it("slots payout stays within expected bounds", () => {
    let i = 0;
    vi.spyOn(Math, "random").mockImplementation(() => [0.1, 0.5, 0.9][i++ % 3]!);
    const r = fun.slots(200);
    expect([-200, 100, 1000]).toContain(r.payout);
  });

  it("roulette red win doubles net", () => {
    vi.spyOn(Math, "random").mockReturnValue(1 / 37);
    expect(fun.roulette(100, "red").payout).toBe(100);
  });

  it("roulette loss is negative bet", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(fun.roulette(50, "red").payout).toBe(-50);
  });

  it("blackjack payout handles win, loss, push", () => {
    expect(fun.blackjackPayout(100, true, false)).toBe(100);
    expect(fun.blackjackPayout(100, false, false)).toBe(-100);
    expect(fun.blackjackPayout(100, false, true)).toBe(0);
  });
});
