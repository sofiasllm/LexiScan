"use client";

import { Clause } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle, Scale } from "lucide-react";

interface AnalysisSidebarProps {
    clauses: Clause[];
    activeClauseId: number | null;
    onClauseClick: (id: number) => void;
    globalScore: number;
}

export default function AnalysisSidebar({
    clauses,
    activeClauseId,
    onClauseClick,
    globalScore,
}: AnalysisSidebarProps) {
    const riskyClauses = clauses.filter((c) => c.analysis?.risk_level === "ROUGE" || c.analysis?.risk_level === "ORANGE");
    const safeClauses = clauses.filter((c) => c.analysis?.risk_level === "VERT");
    const orderedClauses = [...riskyClauses, ...safeClauses];

    return (
        <div className="flex flex-col h-full bg-gray-50 border-l border-gray-200 w-full lg:w-[450px]">

            {/* Header Stat */}
            <div className="p-6 bg-white border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Diagnostic Audit
                </h2>
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                        globalScore > 50 ? "bg-red-100 text-red-700" : (globalScore > 20 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700")
                    )}>
                        {Math.round(globalScore)}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Score de Risque</p>
                        <div className="h-2 w-32 bg-gray-200 rounded-full mt-1 overflow-hidden">
                            <div
                                className={cn("h-full", globalScore > 50 ? "bg-red-500" : (globalScore > 20 ? "bg-orange-500" : "bg-green-500"))}
                                style={{ width: `${globalScore}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {orderedClauses.map((clause) => {
                    const risk = clause.analysis?.risk_level || "VERT";
                    const isActive = activeClauseId === clause.id;

                    return (
                        <div
                            key={clause.id}
                            onClick={() => onClauseClick(clause.id)}
                            className={cn(
                                "p-5 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group",
                                isActive ? "ring-2 ring-indigo-500 border-transparent" : "border-gray-100",
                                risk === "ROUGE" && "border-l-4 border-l-red-500",
                                risk === "ORANGE" && "border-l-4 border-l-orange-500",
                                risk === "VERT" && "border-l-4 border-l-green-500 opacity-80 hover:opacity-100"
                            )}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {risk === "ROUGE" && <AlertCircle className="w-5 h-5 text-red-500" />}
                                    {risk === "ORANGE" && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                                    {risk === "VERT" && <CheckCircle className="w-5 h-5 text-green-500" />}
                                    <span className={cn(
                                        "text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                                        risk === "ROUGE" && "bg-red-50 text-red-700",
                                        risk === "ORANGE" && "bg-orange-50 text-orange-700",
                                        risk === "VERT" && "bg-green-50 text-green-700"
                                    )}>
                                        {risk === "ROUGE" ? "Critique" : (risk === "ORANGE" ? "Moyen" : "Faible")}
                                    </span>
                                </div>
                            </div>

                            <blockquote className="text-sm text-gray-500 border-l-2 border-gray-100 pl-3 italic mb-3 line-clamp-2 group-hover:line-clamp-none transition-all">
                                "{clause.text}"
                            </blockquote>

                            {clause.analysis && risk !== "VERT" && (
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase">Risque identifié</h4>
                                        <p className="text-sm text-gray-800 font-medium leading-relaxed">
                                            {clause.analysis.explanation}
                                        </p>
                                    </div>

                                    {clause.analysis.recommendation && (
                                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                            <h4 className="text-xs font-bold text-indigo-800 uppercase flex items-center gap-1 mb-1">
                                                <Scale className="w-3 h-3" /> Conseil de Négociation
                                            </h4>
                                            <p className="text-sm text-indigo-900 italic">
                                                "{clause.analysis.recommendation}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
