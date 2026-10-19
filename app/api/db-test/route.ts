import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    return NextResponse.json(rows);
}