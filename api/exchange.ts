import axios from 'axios';
import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {base} from "next/dist/build/webpack/config/blocks/base";
type Favorite = {
    id: number;
    pair: string;
    created_at: string;
};
export async function fetchRate(base: string){
    const res =
        await axios.get(`/api/rate?base=${base}`);
    return res.data;
}

export async function fetchHistory(base: string){
    const res =
        await axios.get(`/api/history?base=${base}`);
    return res.data;
}
export async function fetchInsight(base: string): Promise<{ content: string; cached: boolean }> {
    const res = await axios.get(`/api/insight?base=${base}`);
    return res.data;
}
export async function fetchFavorites():Promise<Favorite[]>{
    const res = await axios.get("/api/favorites");
    return res.data;
}

export async function addFavorite(pair : string){
    const res = await axios.post("/api/favorites", {pair});
    return res.data;
}

export async function deleteFavorite(id : number){
    const res = await axios.delete(`/api/favorites/${id}`);
    return res.data;
}

export type Target = {
    id : number;
    pair: string;
    target_value: number;
    condition_type: "이하" | "이상";
    created_at : string;
};

export async function fetchTargets(): Promise<Target[]>{
    const res = await axios.get("/api/targets");
    return res.data;
}

export async function addTarget(data: {
    pair: string;
    target_value: number;
    condition_type: "이하" | "이상";
}){
    const res = await axios.post("/api/targets", data);
    return res.data;
}

export async function deleteTarget(id : number){
    const res = await axios.delete(`/api/targets/${id}`);
    return res.data;
}