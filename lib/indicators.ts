
export function toChartData(rates:Record<string, { KRW:number }>){
    return Object.entries(rates).map(([date, value]) => ({
        date,
        rate:value.KRW,
    }))
}
export function calcIndicators(history : {date:string; rate:number}[], current:number){
    const rates = history.map((item) => item.rate);

    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const avg =  rates.reduce((sum,r) => sum + r,0) / rates.length;

    const position = ((current - min) / (max - min)) * 100;
    const deviation = ((current - avg) / avg) * 100;

    return {min,max,avg,position,deviation};
}

export function isReached(
    current: number,
    targetValue: number,
    condition: "이하" | "이상"
) {
    if (condition === "이하") return current <= targetValue;
    return current >= targetValue;
}