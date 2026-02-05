"use client";

import { FormEvent, useState } from "react";
import { HttpTransport, ExchangeClient } from "@hotstuff-labs/ts-sdk";
import { createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

type Side = "b" | "s";
type PositionSide = "LONG" | "SHORT" | "BOTH";
type TimeInForce = "GTC" | "IOC" | "FOK";

export default function Home() {
  const [apiWalletKey, setApiWalletKey] = useState("");
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleConnectWallet = (e: FormEvent) => {
    e.preventDefault();
    if (!apiWalletKey.trim()) {
      setStatus("Enter your API wallet private key first.");
      return;
    }
    setIsWalletConnected(true);
    setStatus("API wallet key captured. Ready to send trading actions.");
  };

  const handlePlaceOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isWalletConnected) {
      setStatus("Connect your API wallet first.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const instrumentId = Number(form.get("instrumentId") || 0);
    const side = (form.get("side") || "b") as Side;
    const positionSide = (form.get("positionSide") || "LONG") as PositionSide;
    const price = String(form.get("price") || "");
    const size = String(form.get("size") || "");
    const tif = (form.get("tif") || "GTC") as TimeInForce;
    const isMarket = form.get("isMarket") === "on";
    const cloid = String(form.get("cloid") || "");

    try {
      setIsPlacing(true);
      setStatus("Placing order via Hotstuff SDK…");

      const account = privateKeyToAccount(apiWalletKey as `0x${string}`);
      const wallet = createWalletClient({
        account,
        chain: mainnet,
        transport: http(),
      });

      const httpTransport = new HttpTransport({
        isTestnet: process.env.NEXT_PUBLIC_HOTSTUFF_ENV !== "mainnet",
        timeout: 5_000,
      });

      const exchange = new ExchangeClient({
        transport: httpTransport,
        wallet,
      });

      await exchange.placeOrder({
        orders: [
          {
            instrumentId,
            side,
            positionSide,
            price,
            size,
            tif,
            ro: false,
            po: false,
            cloid,
            triggerPx: "",
            isMarket,
            tpsl: "",
            grouping: "",
          },
        ],
        // Hotstuff expects expiresAfter in milliseconds (see official examples),
        // so use Date.now() + 1h instead of seconds.
        expiresAfter: Date.now() + 60 * 60 * 1000,
      });

      setStatus("Order placed successfully via SDK.");
    } catch (error) {
      console.error(error);
      setStatus("Network or server error while placing order.");
    } finally {
      setIsPlacing(false);
    }
  };

  const handleCancelOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isWalletConnected) {
      setStatus("Connect your API wallet first.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const oid = Number(form.get("oid") || 0);
    const instrumentId = Number(form.get("cancelInstrumentId") || 0);

    try {
      setIsCancelling(true);
      setStatus("Sending cancelByOid via Hotstuff SDK…");

      const account = privateKeyToAccount(apiWalletKey as `0x${string}`);
      const wallet = createWalletClient({
        account,
        chain: mainnet,
        transport: http(),
      });

      const httpTransport = new HttpTransport({
        isTestnet: process.env.NEXT_PUBLIC_HOTSTUFF_ENV !== "mainnet",
        timeout: 5_000,
      });

      const exchange = new ExchangeClient({
        transport: httpTransport,
        wallet,
      });

      await exchange.cancelByOid({
        cancels: [{ oid, instrumentId }],
        // Same here: milliseconds from now, e.g. 5 minutes.
        expiresAfter: Date.now() + 5 * 60 * 1000,
      });

      setStatus("Order cancel request sent via SDK.");
    } catch (error) {
      console.error(error);
      setStatus("Network or server error while cancelling order.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-6 text-slate-50">
      <main className="flex w-full max-w-md flex-col gap-6 rounded-3xl bg-slate-900/70 p-5 shadow-xl backdrop-blur">
        <div className="flex items-center gap-4">
          <video
            src="/ducky.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="h-20 w-20 rounded-2xl border border-white/10 object-cover shadow-md"
          />
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold leading-tight">
              Trading Ducky · API Wallet
            </h1>
            <p className="text-xs text-slate-300">
              Paste your Hotstuff API wallet private key and send simple place / cancel
              orders directly from this Telegram mini-app.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleConnectWallet}
          className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Step 1 · Connect API wallet
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                isWalletConnected ? "bg-emerald-400" : "bg-slate-600"
              }`}
            />
          </div>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-slate-300">API wallet private key</span>
            <input
              type="password"
              name="apiWalletKey"
              className="mt-0.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs outline-none ring-0 placeholder:text-slate-500 focus:border-emerald-500"
              placeholder="0x… (from Hotstuff web app)"
              value={apiWalletKey}
              onChange={(e) => setApiWalletKey(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="mt-1 h-9 rounded-xl bg-emerald-500 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {isWalletConnected ? "API wallet connected" : "Use this key"}
          </button>
        </form>

        <form
          onSubmit={handlePlaceOrder}
          className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Step 2 · Place order
          </span>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="flex flex-col gap-1">
              <span className="text-slate-300">Instrument ID</span>
              <input
                name="instrumentId"
                type="number"
                min={0}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-500"
                placeholder="e.g. 1"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-300">Client OID (cloid)</span>
              <input
                name="cloid"
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-500"
                placeholder="ai-bot-…"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-300">Side</span>
              <select
                name="side"
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-500"
                defaultValue="b"
              >
                <option value="b">Buy (b)</option>
                <option value="s">Sell (s)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-300">Position side</span>
              <select
                name="positionSide"
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-500"
                defaultValue="LONG"
              >
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
                <option value="BOTH">BOTH</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-300">Limit price</span>
              <input
                name="price"
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-500"
                placeholder="100"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-300">Size</span>
              <input
                name="size"
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-500"
                placeholder="1"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-300">Time in force</span>
              <select
                name="tif"
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-500"
                defaultValue="GTC"
              >
                <option value="GTC">GTC</option>
                <option value="IOC">IOC</option>
                <option value="FOK">FOK</option>
              </select>
            </label>
            <label className="mt-4 flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                name="isMarket"
                className="h-3.5 w-3.5 rounded border border-slate-700 bg-slate-900 accent-emerald-500"
              />
              Market order (ignore limit price)
            </label>
          </div>

          <button
            type="submit"
            className="mt-1 h-9 rounded-xl bg-emerald-500 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            disabled={isPlacing}
          >
            {isPlacing ? "Placing…" : "Build & send order"}
          </button>
        </form>

        <form
          onSubmit={handleCancelOrder}
          className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Step 3 · Cancel by server OID
          </span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="flex flex-col gap-1">
              <span className="text-slate-300">Order ID (oid)</span>
              <input
                name="oid"
                type="number"
                min={0}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-500"
                placeholder="123456"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-300">Instrument ID</span>
              <input
                name="cancelInstrumentId"
                type="number"
                min={0}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-500"
                placeholder="1"
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-1 h-9 rounded-xl bg-red-500 text-xs font-semibold text-slate-950 transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelling…" : "Build & send cancel"}
          </button>
        </form>

        {status ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-xs text-slate-200">
            {status}
          </p>
        ) : null}
      </main>
    </div>
  );
}
