import {NextRequest,NextResponse} from "next/server";
import axios from "axios";

function getDataNDaysAgo(n: number){
    const date = new Date();
    date.setDate(date.getDate() - n);
    return date.toISOString().split("T")[0];
}

export async function GET(req : NextRequest){
    const base = req.nextUrl.searchParams.get("base") ?? "USD";
    const start = getDataNDaysAgo(30);

    const res =
        await axios.get(`https://api.frankfurter.dev/v1/${start}..?base=${base}&symbols=KRW`)

    return NextResponse.json(res.data);
}