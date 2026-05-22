import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.github.com/repos/enderak54/isgapp/commits?per_page=30", {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json([], { status: 200 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
