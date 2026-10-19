import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { toChartData, calcIndicators } from "@/lib/indicators";

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

function getDateNDaysAgo(n: number) {
    const date = new Date();
    date.setDate(date.getDate() - n);
    return date.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
    const base = req.nextUrl.searchParams.get("base") ?? "USD";
    const pair = `${base}/KRW`;

    // ① 환율 데이터 가져오기
    const [latestRes, historyRes] = await Promise.all([
        axios.get(`https://api.frankfurter.dev/v1/latest?base=${base}&symbols=KRW`),
        axios.get(
            `https://api.frankfurter.dev/v1/${getDateNDaysAgo(30)}..?base=${base}&symbols=KRW`
        ),
    ]);

    const baseDate: string = latestRes.data.date;
    const current: number = latestRes.data.rates.KRW;

    // ③ 캐시 확인
    const [rows] = await pool.query(
        "SELECT content FROM insight_cache WHERE pair = ? AND base_date = ?",
        [pair, baseDate]
    );
    const cached = rows as { content: string }[];
    if (cached.length > 0) {
        return NextResponse.json({ content: cached[0].content, cached: true });
    }

    // ② 지표 계산 (코드가 계산)
    const indicators = calcIndicators(toChartData(historyRes.data.rates), current);

    // ④ AI 호출 (문장만 작성)
    const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [
            {
                role: "user",
                content: `다음은 ${pair} 환율의 최근 30일 지표야. 이 수치만 근거로 현재 수준을 2~3문장으로 설명해줘. 환율이 오를지 내릴지 예측하지 말고, 투자 조언도 하지 마.
- 현재: ${current.toFixed(2)}
- 30일 최저: ${indicators.min.toFixed(2)}
- 30일 최고: ${indicators.max.toFixed(2)}
- 최저~최고 구간에서의 위치: ${indicators.position.toFixed(1)}% (0%가 최저, 100%가 최고)
- 30일 평균 대비: ${indicators.deviation.toFixed(1)}%`,
            },
        ],
    });

    const block = message.content[0];
    const content = block.type === "text" ? block.text : "";

    // ⑤ 저장 (동시 요청이 겹쳐도 중복 안 생기게)
    await pool.query(
        "INSERT IGNORE INTO insight_cache (pair, base_date, content) VALUES (?, ?, ?)",
        [pair, baseDate, content]
    );

    return NextResponse.json({ content, cached: false });
}