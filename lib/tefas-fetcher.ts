import * as cheerio from 'cheerio';

export interface FundData {
    KOD: string;
    AD: string;
    FIYAT: number;
    GUNLUK_GETIRI: number;
    PAY_SAYISI: number;
    FON_TOPLAM_DEGER: number;
}

/**
 * Fetches fund data from TEFAS by scraping the fund detail page.
 * @param symbol The fund code (e.g., "AFY")
 */
export async function fetchFundPrice(symbol: string): Promise<FundData | null> {
    try {
        const url = `https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${symbol.toUpperCase()}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            console.error(`TEFAS fetch failed for ${symbol}: ${response.statusText}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // TEFAS detail page usually has these labels in spans/divs
        // We look for specific IDs or classes if possible, but scraping is fragile.
        // A common pattern on TEFAS detail page:
        // Price is usually in a class like .top-list span 
        // We'll try to find the price and daily return from the header section.

        const priceText = $('.top-list li:nth-child(1) span').text().trim().replace(',', '.');
        const changePercentText = $('.top-list li:nth-child(2) span').text().trim().replace('%', '').replace(',', '.');
        const fundName = $('#MainContent_FormViewMain_LabelFonAd').text().trim() ||
            $('.main-title h1').text().trim() ||
            symbol.toUpperCase();

        const price = parseFloat(priceText);
        const dailyReturn = parseFloat(changePercentText);

        if (isNaN(price)) {
            console.error(`Could not parse price for ${symbol}`);
            return null;
        }

        return {
            KOD: symbol.toUpperCase(),
            AD: fundName,
            FIYAT: price,
            GUNLUK_GETIRI: isNaN(dailyReturn) ? 0 : dailyReturn,
            PAY_SAYISI: 0, // Not critical for basic price display
            FON_TOPLAM_DEGER: 0 // Not critical for basic price display
        };
    } catch (error) {
        console.error(`Error fetching TEFAS data for ${symbol}:`, error);
        return null;
    }
}
