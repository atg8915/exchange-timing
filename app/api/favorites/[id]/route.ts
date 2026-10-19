import {NextRequest, NextResponse} from "next/server";
import {pool} from "@/lib/db";

export async function DELETE(
    req: NextRequest,
    { params} : {params: Promise<{id: string}>}
){
    const {id} = await params;

    await pool.query("DELETE FROM favorite_pair WHERE id = ?", [id]);

    return NextResponse.json({success: true});
}