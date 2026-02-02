"use client";

import { useMemo } from "react";
import { Clause } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DocumentViewerProps {
    text: string;
    clauses: Clause[];
    activeClauseId: number | null;
    onClauseClick: (id: number) => void;
}

export default function DocumentViewer({
    text,
    clauses,
    activeClauseId,
    onClauseClick,
}: DocumentViewerProps) {
    const renderText = useMemo(() => {
        if (!clauses || clauses.length === 0) return <p className="whitespace-pre-wrap text-gray-700">{text}</p>;

        const elements = [];
        let lastIndex = 0;
        const sortedClauses = [...clauses].sort((a, b) => a.start_index - b.start_index);

        sortedClauses.forEach((clause) => {
            // Texte avant
            if (clause.start_index > lastIndex) {
                elements.push(
                    <span key={`text-${lastIndex}`} className="text-gray-600">
                        {text.slice(lastIndex, clause.start_index)}
                    </span>
                );
            }

            // Clause analysée
            const risk = clause.analysis?.risk_level;
            let colorClass = "";

            if (risk === "ROUGE") colorClass = "bg-red-50 border-b-2 border-red-500 hover:bg-red-100 text-gray-900";
            if (risk === "ORANGE") colorClass = "bg-orange-50 border-b-2 border-orange-500 hover:bg-orange-100 text-gray-900";
            if (risk === "VERT") colorClass = "bg-green-50/50 hover:bg-green-100 text-gray-800";

            const isActive = activeClauseId === clause.id;

            elements.push(
                <span
                    key={`clause-${clause.id}`}
                    onClick={() => onClauseClick(clause.id)}
                    className={cn(
                        "transition-all duration-200 py-0.5 cursor-pointer",
                        colorClass,
                        isActive && "ring-2 ring-offset-1 ring-indigo-500 rounded-sm bg-opacity-100"
                    )}
                >
                    {text.slice(clause.start_index, clause.end_index)}
                </span>
            );

            lastIndex = clause.end_index;
        });

        if (lastIndex < text.length) {
            elements.push(<span key={`text-end`} className="text-gray-600">{text.slice(lastIndex)}</span>);
        }

        return <div className="whitespace-pre-wrap leading-loose font-normal text-sm md:text-base font-serif">{elements}</div>;
    }, [text, clauses, activeClauseId, onClauseClick]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 h-full overflow-y-auto custom-scrollbar">
            {renderText}
        </div>
    );
}
