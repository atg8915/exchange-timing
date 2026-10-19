import {NextRequest, NextResponse} from "next/server";
import  axios from "axios";


export async function GET(req: NextRequest){
    const base = req.nextUrl.searchParams.get("base") ?? "USD";

    const res =
        await axios.get(`https://api.frankfurter.dev/v1/latest?base=${base}&symbols=KRW`);
    return NextResponse.json(res.data);
}