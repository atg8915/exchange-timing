"use client";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";

import {useState} from "react";
import {LineChart, Line, XAxis , YAxis , Tooltip} from "recharts";
import {
    fetchRate,
    fetchHistory,
    fetchFavorites,
    fetchTargets,
    addTarget,
    deleteFavorite,
    deleteTarget,
    fetchInsight
} from "@/api/exchange";
import {toChartData, calcIndicators, isReached} from "@/lib/indicators";
import {addFavorite} from "@/api/exchange";

type Favorite = {
    id: number;
    pair: string;
    created_at: string;
};

export default function Home() {
    const [base, setBase] = useState("USD");
    const [targetValue, setTargetValue] = useState("");
    const [condition, setCondition] = useState<"이하" | "이상">("이하");
    const {data, isPending, error} = useQuery({
        queryKey:["rate",base,"KRW"],
        queryFn:() => fetchRate(base),
        staleTime: 1000 * 60 * 60,
    });

    const {data: historyData , isPending: isHistoryPending} = useQuery({
        queryKey:["history",base],
        queryFn:() => fetchHistory(base),
        staleTime: 1000 * 60 * 60,
    });

    const {data : favorites} = useQuery({
        queryKey:["favorites"],
        queryFn:fetchFavorites,
    });

    const {data: insight, isPending: isInsightPending} = useQuery({
        queryKey: ["insight", base],
        queryFn: () => fetchInsight(base),
        staleTime: 1000 * 60 * 60,
    });
    const queryClient = useQueryClient();

    const addFavoriteMutation = useMutation({
        mutationFn: addFavorite,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey:["favorites"]});
        },
    });
    const deleteFavoriteMutation = useMutation({
        mutationFn: deleteFavorite,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey:["favorites"]});
        },
    });
    const {data: targets} = useQuery({
        queryKey:["targets"],
        queryFn: fetchTargets,
    });

    const addTargetMutation = useMutation({
        mutationFn: addTarget,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey:["targets"]});
        },
    });
    const deleteTargetMutation = useMutation({
        mutationFn: deleteTarget,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey:["targets"]});
        },
    });

    if(isPending) return <p className="p-6">불러오는중</p>
    if(error) return <p className="p-6 text-red-500">오류가 났습니다</p>


    return (
        <div className="min-h-screen bg-slate-50">
            {/* 헤더 */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-brand">환전 타이밍 도우미</h1>
                    <span className="text-sm text-slate-400">게시판 (준비 중)</span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 왼쪽: 2칸 차지 */}
                    <div className="md:col-span-2 space-y-6">
                        {/* ① 통화 선택 + 현재 환율 */}
                        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
                            <select
                                value={base}
                                onChange={(e) => setBase(e.target.value)}
                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                            >
                                <option value="USD">USD (달러)</option>
                                <option value="JPY">JPY (엔)</option>
                                <option value="EUR">EUR (유로)</option>
                            </select>
                            <p className="text-3xl font-bold text-slate-900">
                                1 {base} = <span className="text-brand">{data.rates.KRW.toFixed(2)}</span> KRW
                            </p>
                            <p className="text-sm text-slate-400">기준일 {data.date}</p>
                        </section>

                        {/* 차트 */}
                        {historyData && (
                            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="font-semibold text-slate-700 mb-4">최근 30일 추이</h3>
                                <LineChart width={560} height={300} data={toChartData(historyData.rates)}>
                                    <XAxis dataKey={"date"} tick={{ fontSize: 12 }}/>
                                    <YAxis domain={["auto","auto"]} tick={{ fontSize: 12 }}/>
                                    <Tooltip/>
                                    <Line type="monotone" dataKey="rate" stroke="#4b93ff" strokeWidth={2} dot={false}/>
                                </LineChart>
                            </section>
                        )}

                        {/* ③ 지표 카드 3개 */}
                        {historyData && data && (() => {
                            const chartData = toChartData(historyData.rates);
                            const indicators = calcIndicators(chartData, data.rates.KRW);

                            return (
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                                        <p className="text-xs text-slate-400">30일 최저 / 최고</p>
                                        <p className="mt-1 font-semibold text-slate-800 text-sm">
                                            {indicators.min.toFixed(2)} / {indicators.max.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                                        <p className="text-xs text-slate-400">현재 위치</p>
                                        <p className="mt-1 font-semibold text-brand">하위 {indicators.position.toFixed(1)}%</p>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                                        <p className="text-xs text-slate-400">평균 대비</p>
                                        <p className="mt-1 font-semibold text-slate-800">{indicators.deviation.toFixed(1)}%</p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ④ AI 해설 */}
                        <section className="bg-blue-50 rounded-xl border border-blue-100 p-6 space-y-2">
                            <h3 className="font-semibold text-brand">AI 해설</h3>
                            {isInsightPending ? (
                                <p className="text-sm text-slate-400">해설을 만드는 중...</p>
                            ) : (
                                <p className="text-sm text-slate-700 leading-relaxed">{insight?.content}</p>
                            )}
                        </section>
                    </div>

                    {/* 오른쪽: 1칸 차지 */}
                    <div className="space-y-6">
                        {/* ⑥ 즐겨찾기 */}
                        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
                            <h3 className="font-semibold text-slate-700">즐겨찾기</h3>
                            <button
                                onClick={() => addFavoriteMutation.mutate(`${base}/KRW`)}
                                className="w-full bg-brand hover:bg-brand-dark text-white rounded-lg py-2 text-sm font-medium transition-colors"
                            >
                                {base}/KRW 추가
                            </button>
                            <ul className="text-sm space-y-2">
                                {favorites?.map((fav) => (
                                    <li key={fav.id} className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2">
                                        {fav.pair}
                                        <button
                                            onClick={() => deleteFavoriteMutation.mutate(fav.id)}
                                            className="text-slate-400 hover:text-red-500"
                                        >
                                            ✕
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* ⑦ 목표 환율 */}
                        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
                            <h3 className="font-semibold text-slate-700">목표 환율</h3>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={targetValue}
                                    onChange={(e) => setTargetValue(e.target.value)}
                                    placeholder="목표 환율"
                                    className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                />
                                <select
                                    value={condition}
                                    onChange={(e) => setCondition(e.target.value as "이하" | "이상")}
                                    className="border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                >
                                    <option value="이하">이하</option>
                                    <option value="이상">이상</option>
                                </select>
                            </div>
                            <button
                                onClick={() => addTargetMutation.mutate({
                                    pair: `${base}/KRW`,
                                    target_value: Number(targetValue),
                                    condition_type: condition,
                                })}
                                className="w-full bg-brand hover:bg-brand-dark text-white rounded-lg py-2 text-sm font-medium transition-colors"
                            >
                                추가
                            </button>
                            <ul className="text-sm space-y-2">
                                {targets?.map((t) => (
                                    <li key={t.id} className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2">
                                    <span>
                                        {t.pair} {t.condition_type} {t.target_value}
                                        {t.pair === `${base}/KRW` &&
                                            isReached(data.rates.KRW, Number(t.target_value), t.condition_type) && (
                                                <span className="ml-2 text-xs font-semibold text-green-600 bg-green-50 rounded px-1.5 py-0.5">도달!</span>
                                            )}
                                    </span>
                                        <button
                                            onClick={() => deleteTargetMutation.mutate(t.id)}
                                            className="text-slate-400 hover:text-red-500"
                                        >
                                            ✕
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}