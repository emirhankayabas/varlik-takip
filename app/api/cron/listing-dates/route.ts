import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PublicOffering from '@/lib/models/PublicOffering';
import { fetchAllHalkaArzWithLinks, fetchListingDate } from '@/lib/halkarz-fetcher';

/**
 * GET /api/cron/listing-dates
 *
 * Halka arz detay sayfalarından "Bist İlk İşlem Tarihi" tarihini otomatik çeker ve
 * veritabanındaki ilgili kayda işlem tarihi olarak kaydeder.
 *
 * Vercel Cron tarafından günde 4 kez çağrılır (vercel.json).
 * Authorization: Bearer <CRON_SECRET> ile korunur.
 */
export async function GET(request: Request) {
    // Cron secret ile güvenlik kontrolü
    const authHeader = request.headers.get('authorization');
    if (
        process.env.CRON_SECRET &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    await dbConnect();

    // listingDate henüz girilmemiş, aktif halka arzları bul
    const offerings = await PublicOffering.find({
        status: { $in: ['PENDING', 'ALLOCATED'] },
        listingDate: null,
    }).lean();

    if (offerings.length === 0) {
        console.log('[cron/listing-dates] Kontrol edilecek halka arz yok.');
        return NextResponse.json({ message: 'Kontrol edilecek halka arz yok.', updated: 0 });
    }

    // Aynı sembolü birden fazla bankadan almak mümkün — sembolü tekil al
    const uniqueSymbols = [
        ...new Set(
            offerings.map((o) => (o.symbol as string).replace(/\.IS$/i, '').toUpperCase())
        ),
    ];

    console.log(`[cron/listing-dates] ${offerings.length} kayıt, ${uniqueSymbols.length} tekil sembol kontrol edilecek.`);

    // halkarz.com'dan tüm listeyi sembol + link ile al
    let halkarzList: { symbol: string; link: string }[] = [];
    try {
        halkarzList = await fetchAllHalkaArzWithLinks();
        console.log(`[cron/listing-dates] halkarz.com'dan ${halkarzList.length} kayıt alındı.`);
    } catch (err) {
        console.error('[cron/listing-dates] halkarz.com listesi alınamadı:', err);
        return NextResponse.json({ error: 'halkarz.com listesi alınamadı' }, { status: 500 });
    }

    const result: { symbol: string; status: string; listingDate?: string }[] = [];

    for (const rawSymbol of uniqueSymbols) {
        const halkarzEntry = halkarzList.find(
            (h) => h.symbol.toUpperCase() === rawSymbol
        );

        if (!halkarzEntry) {
            console.log(`[cron/listing-dates] ${rawSymbol} halkarz.com listesinde bulunamadı.`);
            result.push({ symbol: rawSymbol, status: 'not_found_on_halkarz' });
            continue;
        }

        const listingDate = await fetchListingDate(halkarzEntry.link);

        if (!listingDate) {
            console.log(`[cron/listing-dates] ${rawSymbol} için işlem tarihi henüz belli değil.`);
            result.push({ symbol: rawSymbol, status: 'date_not_available' });
            continue;
        }

        // Tarih bulundu — bu sembolle eşleşen TÜM kayıtları güncelle (farklı bankalar)
        const dbSymbolVariants = [rawSymbol, `${rawSymbol}.IS`];
        const updateResult = await PublicOffering.updateMany(
            {
                symbol: { $in: dbSymbolVariants },
                status: { $in: ['PENDING', 'ALLOCATED'] },
                listingDate: null,
            },
            { listingDate }
        );

        console.log(
            `[cron/listing-dates] ${rawSymbol} işlem tarihi güncellendi: ${listingDate.toISOString()} (${updateResult.modifiedCount} kayıt)`
        );
        result.push({
            symbol: rawSymbol,
            status: 'updated',
            listingDate: listingDate.toISOString(),
        });
    }

    const updatedCount = result.filter((r) => r.status === 'updated').length;
    return NextResponse.json({ checked: offerings.length, updated: updatedCount, details: result });
}
