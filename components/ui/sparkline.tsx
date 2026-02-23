"use client";

interface SparklineProps {
    data: number[];
    color: string;
    className?: string;
}

export const Sparkline = ({ data, color, className }: SparklineProps) => {
    if (!data || data.length < 2) {
        return <div className={className ?? "h-10 w-24"} />;
    }

    const width = 600;
    const height = 200;
    const padding = 8;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
        const x = padding + (i / (data.length - 1)) * (width - padding * 2);
        const y = padding + ((max - val) / range) * (height - padding * 2);
        return { x, y };
    });

    const pathD = points.reduce((acc, { x, y }, i) => {
        if (i === 0) return `M ${x},${y}`;
        const prev = points[i - 1];
        const cpx = (prev.x + x) / 2;
        return `${acc} C ${cpx},${prev.y} ${cpx},${y} ${x},${y}`;
    }, "");

    const fillD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

    const gradientId = `grad-${color.replace("#", "")}`;

    return (
        <div className={className ?? "h-10 w-24"}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                className="w-full h-full"
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>

                <path d={fillD} fill={`url(#${gradientId})`} />

                <path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Last price dot */}
                <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r={4}
                    fill={color}
                />
                <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r={7}
                    fill={color}
                    opacity={0.25}
                />
            </svg>
        </div>
    );
};
