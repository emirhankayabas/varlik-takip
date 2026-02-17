import * as cheerio from 'cheerio';

export interface HalkaArz {
    title: string;
    link: string;
    date?: string;
}

export async function getLatestHalkaArz(): Promise<any> {
    try {
        const response = await fetch('https://halkarz.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            next: { revalidate: 0 } // Disable cache for debugging
        });

        const html = await response.text();
        const $ = cheerio.load(html);

        const results: any[] = [];
        $('ul.halka-arz-list li').each((i, el) => {
            const text = $(el).text().trim();
            const link = $(el).find('a').first().attr('href') || '';

            if (text.startsWith('Yeni!')) {
                const cleaned = text.replace('Yeni!', '').trim();

                // "ATATR                                Ata Turizm ...\n\n11-12-13 Şubat 2026"
                const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

                const topRow = lines[0] || '';
                const date = lines[lines.length - 1] || 'Tarih Belirtilmemiş';

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
        });

        return results;
    } catch (error: any) {
        console.error('Halkarz hatası:', error);
        return [];
    }
}
