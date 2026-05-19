import { useState } from "react";

interface GovernorateInfo {
  id: string;
  nameAr: string;
  d: string;
  labelX: number;
  labelY: number;
  fontSize?: number;
}

const GOVERNORATES: GovernorateInfo[] = [
  // ── Northwest Desert ─────────────────────────────────────────────────
  {
    id: "matrouh",
    nameAr: "مطروح",
    d: "M0,0 L172,0 L172,38 L153,72 L138,110 L102,148 L68,168 L0,168 Z",
    labelX: 70,
    labelY: 88,
  },

  // ── North Coast ───────────────────────────────────────────────────────
  {
    id: "alexandria",
    nameAr: "الإسكندرية",
    d: "M148,0 L213,0 L208,40 L172,40 L153,72 L148,32 Z",
    labelX: 178,
    labelY: 22,
    fontSize: 7,
  },

  // ── Nile Delta ────────────────────────────────────────────────────────
  {
    id: "beheira",
    nameAr: "البحيرة",
    d: "M172,40 L208,40 L213,0 L250,0 L256,18 L258,64 L238,89 L208,98 L183,82 L172,58 Z",
    labelX: 215,
    labelY: 58,
    fontSize: 8,
  },
  {
    id: "kafr-el-sheikh",
    nameAr: "كفر الشيخ",
    d: "M250,0 L290,0 L300,14 L302,58 L280,74 L258,64 L256,18 Z",
    labelX: 274,
    labelY: 37,
    fontSize: 7,
  },
  {
    id: "gharbia",
    nameAr: "الغربية",
    d: "M208,98 L238,89 L258,64 L280,74 L277,112 L256,124 L220,116 Z",
    labelX: 248,
    labelY: 100,
    fontSize: 8,
  },
  {
    id: "monufia",
    nameAr: "المنوفية",
    d: "M220,116 L256,124 L277,112 L273,152 L253,162 L224,152 Z",
    labelX: 248,
    labelY: 137,
    fontSize: 7,
  },
  {
    id: "dakahlia",
    nameAr: "الدقهلية",
    d: "M290,0 L328,0 L342,16 L346,60 L322,75 L302,58 L300,14 Z",
    labelX: 318,
    labelY: 38,
    fontSize: 8,
  },
  {
    id: "damietta",
    nameAr: "دمياط",
    d: "M328,0 L362,0 L368,34 L346,60 L342,16 Z",
    labelX: 348,
    labelY: 25,
    fontSize: 7,
  },
  {
    id: "port-said",
    nameAr: "بورسعيد",
    d: "M362,0 L412,0 L418,42 L392,54 L368,34 Z",
    labelX: 390,
    labelY: 25,
    fontSize: 7,
  },
  // ── Sharqia — eastern delta, between Dakahlia / Ismailia / Qalyubia ──
  {
    id: "sharqia",
    nameAr: "الشرقية",
    d: "M277,112 L302,58 L346,60 L362,54 L362,104 L343,147 L273,148 Z",
    labelX: 326,
    labelY: 107,
    fontSize: 8,
  },
  {
    id: "qalyubia",
    nameAr: "القليوبية",
    d: "M224,152 L253,162 L273,152 L275,188 L257,198 L237,194 L224,178 Z",
    labelX: 250,
    labelY: 175,
    fontSize: 7,
  },

  // ── Greater Cairo ─────────────────────────────────────────────────────
  {
    id: "cairo",
    nameAr: "القاهرة",
    d: "M257,198 L296,195 L304,225 L288,236 L264,233 Z",
    labelX: 280,
    labelY: 218,
    fontSize: 8,
  },
  {
    id: "giza",
    nameAr: "الجيزة",
    d: "M210,194 L237,194 L257,198 L264,233 L258,258 L230,262 L197,245 L194,224 Z",
    labelX: 228,
    labelY: 228,
    fontSize: 8,
  },

  // ── Canal Zone ────────────────────────────────────────────────────────
  {
    id: "ismailia",
    nameAr: "الإسماعيلية",
    d: "M368,34 L392,54 L418,42 L426,96 L408,130 L380,132 L362,104 L362,54 Z",
    labelX: 395,
    labelY: 85,
    fontSize: 7,
  },
  {
    id: "suez",
    nameAr: "السويس",
    d: "M362,104 L380,132 L408,130 L419,168 L394,184 L362,170 L343,147 Z",
    labelX: 384,
    labelY: 151,
    fontSize: 8,
  },

  // ── Sinai ─────────────────────────────────────────────────────────────
  {
    id: "north-sinai",
    nameAr: "شمال سيناء",
    d: "M412,0 L500,0 L500,186 L442,190 L419,168 L408,130 L426,96 L418,42 Z",
    labelX: 461,
    labelY: 92,
    fontSize: 8,
  },
  {
    id: "south-sinai",
    nameAr: "جنوب سيناء",
    d: "M419,168 L442,190 L500,186 L500,406 L458,432 L418,396 L396,316 L392,224 L394,184 Z",
    labelX: 452,
    labelY: 294,
    fontSize: 8,
  },

  // ── Faiyum ────────────────────────────────────────────────────────────
  {
    id: "faiyum",
    nameAr: "الفيوم",
    d: "M178,246 L210,243 L230,262 L224,306 L196,312 L163,308 L160,276 Z",
    labelX: 196,
    labelY: 282,
    fontSize: 8,
  },

  // ── Western Desert (New Valley) ───────────────────────────────────────
  {
    id: "new-valley",
    nameAr: "الوادي الجديد",
    d: "M0,168 L68,168 L102,148 L138,110 L153,72 L172,58 L183,82 L194,224 L178,246 L160,276 L163,308 L148,366 L122,450 L98,516 L78,512 L0,512 Z",
    labelX: 68,
    labelY: 386,
  },

  // ── Red Sea (mainland coast) ──────────────────────────────────────────
  {
    id: "red-sea",
    nameAr: "البحر الأحمر",
    d: "M304,225 L394,184 L392,224 L396,316 L418,396 L458,432 L500,406 L500,512 L408,512 L304,512 Z",
    labelX: 416,
    labelY: 400,
    fontSize: 8,
  },

  // ── Nile Corridor (Upper Egypt) ───────────────────────────────────────
  {
    id: "beni-suef",
    nameAr: "بني سويف",
    d: "M230,232 L264,233 L288,236 L296,278 L278,282 L250,280 L236,266 Z",
    labelX: 264,
    labelY: 259,
    fontSize: 7,
  },
  {
    id: "minya",
    nameAr: "المنيا",
    d: "M236,280 L278,282 L296,278 L304,340 L292,352 L265,352 L242,340 Z",
    labelX: 271,
    labelY: 316,
  },
  {
    id: "asyut",
    nameAr: "أسيوط",
    d: "M242,352 L265,352 L292,352 L304,398 L292,415 L265,415 L248,400 Z",
    labelX: 271,
    labelY: 384,
  },
  {
    id: "sohag",
    nameAr: "سوهاج",
    d: "M248,415 L265,415 L292,415 L304,450 L292,465 L265,465 L248,452 Z",
    labelX: 271,
    labelY: 441,
  },
  {
    id: "qena",
    nameAr: "قنا",
    d: "M248,465 L265,465 L292,465 L304,496 L292,510 L265,510 L248,498 Z",
    labelX: 271,
    labelY: 489,
  },
  {
    id: "luxor",
    nameAr: "الأقصر",
    d: "M248,498 L265,510 L292,510 L304,512 L248,512 Z",
    labelX: 276,
    labelY: 509,
    fontSize: 7,
  },

  // ── Aswan (wide base, connects New Valley & Red Sea at the south) ──────
  {
    id: "aswan",
    nameAr: "أسوان",
    d: "M0,512 L78,512 L248,512 L304,512 L408,512 L500,512 L500,560 L0,560 Z",
    labelX: 252,
    labelY: 536,
  },
];

const GOV_ARABIC_TO_ID: Record<string, string> = Object.fromEntries(
  GOVERNORATES.map((g) => [g.nameAr, g.id])
);

interface EgyptMapProps {
  selectedGovernorate?: string | null;
  onSelectGovernorate: (nameAr: string | null) => void;
  className?: string;
}

export default function EgyptMap({
  selectedGovernorate,
  onSelectGovernorate,
  className = "",
}: EgyptMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const selectedId = selectedGovernorate
    ? (GOV_ARABIC_TO_ID[selectedGovernorate] ?? null)
    : null;

  const getFill = (id: string) => {
    if (id === selectedId) return "#166534";
    if (id === hovered) return "#16a34a";
    return "#dcfce7";
  };

  const getStroke = (id: string) => {
    if (id === selectedId) return "#14532d";
    if (id === hovered) return "#15803d";
    return "#86efac";
  };

  const getTextFill = (id: string) => {
    if (id === selectedId || id === hovered) return "#ffffff";
    return "#166534";
  };

  const handleClick = (nameAr: string) => {
    onSelectGovernorate(selectedGovernorate === nameAr ? null : nameAr);
  };

  return (
    <div className={`relative select-none ${className}`}>
      <svg
        viewBox="0 0 500 560"
        className="w-full h-full"
        style={{ fontFamily: "'Cairo', sans-serif" }}
        role="img"
        aria-label="خريطة مصر التفاعلية"
      >
        {GOVERNORATES.map((gov) => (
          <g
            key={gov.id}
            className="cursor-pointer"
            onClick={() => handleClick(gov.nameAr)}
            onMouseEnter={() => setHovered(gov.id)}
            onMouseLeave={() => setHovered(null)}
            role="button"
            aria-label={gov.nameAr}
            aria-pressed={gov.id === selectedId}
          >
            <path
              d={gov.d}
              fill={getFill(gov.id)}
              stroke={getStroke(gov.id)}
              strokeWidth="1.2"
              style={{ transition: "fill 0.12s, stroke 0.12s" }}
            />
            <text
              x={gov.labelX}
              y={gov.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={gov.fontSize ?? 9}
              fontWeight={gov.id === selectedId ? "700" : "500"}
              fill={getTextFill(gov.id)}
              style={{
                pointerEvents: "none",
                transition: "fill 0.12s",
                userSelect: "none",
              }}
            >
              {gov.nameAr}
            </text>
          </g>
        ))}
      </svg>

      {selectedGovernorate && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md">
            {selectedGovernorate}
          </span>
        </div>
      )}
    </div>
  );
}

