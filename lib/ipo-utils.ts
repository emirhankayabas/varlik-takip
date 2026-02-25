export function isTodayInIpoDate(dateStr: string | undefined): boolean {
    if (!dateStr) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const months: Record<string, number> = {
        'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'haziran': 5,
        'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11
    };

    // Örnek: "26-27 Şubat 2026" veya "26-27 Şubat, 2 Mart 2026"
    // Virgülle ayrılmış bölümleri gez
    const parts = dateStr.split(',').map(p => p.trim());

    // Yılı bul (genellikle en sonda olur)
    const yearMatch = dateStr.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : today.getFullYear();

    for (const part of parts) {
        // Ayı bul
        let monthIndex = -1;
        let foundMonth = "";
        for (const m in months) {
            if (part.toLowerCase().includes(m)) {
                monthIndex = months[m];
                foundMonth = m;
                break;
            }
        }

        if (monthIndex === -1) continue;

        // Günleri bul (örn: "26-27" veya sadece "2")
        // Ay isminden önceki sayıları al
        const daysPart = part.split(new RegExp(foundMonth, 'i'))[0].trim();
        const dayMatches = daysPart.match(/\d+/g);

        if (!dayMatches) continue;

        if (dayMatches.length === 1) {
            // Tek bir gün: "15 Şubat"
            const day = parseInt(dayMatches[0]);
            const date = new Date(year, monthIndex, day);
            if (date.getTime() === today.getTime()) return true;
        } else if (dayMatches.length === 2) {
            // Aralık: "26-27 Şubat"
            const startDay = parseInt(dayMatches[0]);
            const endDay = parseInt(dayMatches[1]);

            const startDate = new Date(year, monthIndex, startDay);
            const endDate = new Date(year, monthIndex, endDay);

            if (today >= startDate && today <= endDate) return true;
        }
    }

    return false;
}
