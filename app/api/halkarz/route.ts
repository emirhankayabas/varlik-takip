import { NextResponse } from 'next/server';
import { getLatestHalkaArz } from '@/lib/halkarz-fetcher';

export async function GET() {
    try {
        const data = await getLatestHalkaArz();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Veri çekilemedi' }, { status: 500 });
    }
}
