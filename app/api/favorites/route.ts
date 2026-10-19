import {NextRequest, NextResponse} from "next/server";
import {pool} from "@/lib/db";

export async function GET(){
    const [rows] =
        await pool.query("SELECT * FROM favorite_pair ORDER BY created_at DESC");
    return NextResponse.json(rows);
}
export async function POST(req: NextRequest){
    const body = await req.json();
    const { pair } = body;

    await pool.query("INSERT INTO favorite_pair (pair) VALUES (?)",[pair]);

    return NextResponse.json({success:true});
}