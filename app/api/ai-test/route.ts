import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET() {
    const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: "안녕이라고 한 문장으로 답해줘" }],
    });

    return NextResponse.json(message.content);
}