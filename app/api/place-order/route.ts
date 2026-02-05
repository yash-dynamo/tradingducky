import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const backendUrl = process.env.TRADING_BACKEND_URL;

    if (!backendUrl) {
      return NextResponse.json(
        { error: "TRADING_BACKEND_URL is not set on the server." },
        { status: 500 },
      );
    }

    const body = await req.json();

    const res = await fetch(new URL("/place-order", backendUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error ?? "Upstream place-order failed." },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to place order." },
      { status: 500 },
    );
  }
}

