import {NextRequest, NextResponse} from "next/server";
import {pool} from "@/lib/db";

export async function GET(){
    const [rows] =
    await pool.query("SELECT * FROM target_rate ORDER BY created_at DESC");
    return NextResponse.json(rows);
}
export async function POST(req:NextRequest){
    const body = await req.json();
    const {pair,target_value,condition_type} = body;

    await pool.query("INSERT INTO target_rate (pair, target_value, condition_type) VALUES (?,?,?)" , [pair, target_value, condition_type])
    return NextResponse.json({success:true});
}