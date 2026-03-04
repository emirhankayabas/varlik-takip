import * as cheerio from 'cheerio';

export interface HalkaArz {
    title: string;
    link: string;
    date?: string;
}

// Türkçe ay adları -> JS ay indeksi (0-tabanlı)
const TR_MONTHS: Record<string, number> = {
    'Ocak': 0, 'Şubat': 1, 'Mart': 2, 'Nisan': 3,
    'Mayıs': 4, 'Haziran': 5, 'Temmuz': 6, 'Ağustos': 7,
    'Eylül': 8, 'Ekim': 9, 'Kasım': 10, 'Aralık': 11,
};

const HALKARZ_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
};

/**
 * Listedeki tüm halka arzları (Yeni! olsun olmasın) sembol ve link ile döner.
 * Cron job'ın symbol eşleştirmesi için kullanılır.
 */
export async function fetchAllHalkaArzWithLinks(): Promise<{ symbol: string; link: string }[]> {
    const response = await fetch('https://halkarz.com/', {
        headers: HALKARZ_HEADERS,
        cache: 'no-store',
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const results: { symbol: string; link: string }[] = [];

    $('ul.halka-arz-list li').each((_, el) => {
        const text = $(el).text().trim();
        const href = $(el).find('a').first().attr('href') || '';
        if (!href) return;

        const link = href.startsWith('http') ? href : `https://halkarz.com${href}`;
        const cleaned = text.replace('Yeni!', '').trim();
        const firstLine = cleaned.split(/\r?\n/).map(l => l.trim()).find(l => l.length > 0) || '';

        // "ATATR  Şirket Adı" formatından sembolü al
        const symbolMatch = firstLine.match(/^([A-Z0-9]+)\s+/);
        if (symbolMatch) {
            results.push({ symbol: symbolMatch[1], link });
        }
    });

    return results;
}

/**
 * Halka arz detay sayfasından "Bist İlk İşlem Tarihi" tarihini çeker.
 * Tarih henüz belli değilse (Hazırlanıyor... vb.) null döner.
 */
export async function fetchListingDate(detailUrl: string): Promise<Date | null> {
    try {
        const response = await fetch(detailUrl, {
            headers: HALKARZ_HEADERS,
            cache: 'no-store',
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        let listingDate: Date | null = null;

        $('tr').each((_, el) => {
            const tds = $(el).find('td');
            if (tds.length < 2) return;

            const label = $(tds[0]).text().trim();
            if (!label.includes('Bist İlk İşlem Tarihi')) return;

            const dateText = $(tds[1]).text().trim();

            // Henüz belli değilse atla
            if (!dateText || dateText.includes('Hazırlanıyor') || dateText.includes('...') || dateText === '-') {
                return false as any;
            }

            // "26 Şubat 2026" formatını parse et
            const match = dateText.match(/(\d+)\s+(\S+)\s+(\d{4})/);
            if (match) {
                const day = parseInt(match[1]);
                const month = TR_MONTHS[match[2]];
                const year = parseInt(match[3]);
                if (month !== undefined) {
                    // Türkiye saati gece yarısı (UTC+3 = 21:00 UTC önceki gün) olarak kaydet
                    listingDate = new Date(Date.UTC(year, month, day, 7, 0, 0)); // 10:00 Türkiye (borsa açılışı)
                }
            }
            return false as any; // .each'i durdur
        });

        return listingDate;
    } catch (err) {
        console.error(`[fetchListingDate] ${detailUrl} için hata:`, err);
        return null;
    }
}

export async function getLatestHalkaArz(): Promise<any> {
    try {
        const response = await fetch('https://halkarz.com/', {
            headers: HALKARZ_HEADERS,
            next: { revalidate: 0 },
        });

        const html = await response.text();
        const $ = cheerio.load(html);

        const results: any[] = [];
        $('ul.halka-arz-list li').each((i, el) => {
            const text = $(el).text().trim();
            const link = $(el).find('a').first().attr('href') || '';

            if (text.startsWith('Yeni!')) {
                const cleaned = text.replace('Yeni!', '').trim();

                // Log for debugging
                // console.log("Cleaned text:", JSON.stringify(cleaned));

                const rawLines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

                // Durum belirteçlerini temizle (Talep toplanıyor, Hazırlanıyor... vb.)
                const lines = rawLines.filter(line =>
                    !line.includes("Talep toplanıyor") &&
                    !line.includes("Talep toplanacak")
                );

                if (lines.length >= 2) {
                    const topRow = lines[0];
                    const date = lines[lines.length - 1];

                    // "ATATR        Company Name" -> symbol and name
                    const symbolMatch = topRow.match(/^([A-Z0-9]+)\s+(.+)$/);
                    const symbol = symbolMatch ? symbolMatch[1] : '';
                    const name = symbolMatch ? symbolMatch[2].trim() : topRow;

                    results.push({
                        symbol,
                        name,
                        date,
                        link: link.startsWith('http') ? link : `https://halkarz.com${link}`
                    });
                }
            }
        });

        return results;
    } catch (error: any) {
        console.error('Halkarz hatası:', error);
        return [];
    }
}
