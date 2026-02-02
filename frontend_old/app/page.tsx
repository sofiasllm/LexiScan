"use client";

import { useState } from "react";
import DragDropUpload from "@/components/DragDropUpload";
import DocumentViewer from "@/components/DocumentViewer";
import AnalysisSidebar from "@/components/AnalysisSidebar";
import NavSidebar from "@/components/NavSidebar";
import { uploadAndAnalyze, AnalysisResponse } from "@/lib/api";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [activeClauseId, setActiveClauseId] = useState<number | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      if (file.type === "text/plain") {
        const text = await file.text();
        setFileContent(text);
      } else {
        setFileContent("Chargement de l'aperçu PDF...");
      }

      const result = await uploadAndAnalyze(file);
      setAnalysis(result);

      if (file.type !== "text/plain") {
        // Reconstitution approximative pour l'affichage (MVP)
        const reconstructed = result.clauses.map(c => c.text).join("\n\n");
        setFileContent(reconstructed);
      }

    } catch (e: any) {
      setError(e.message || "Erreur inconnue");
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setFileContent("");
    setError(null);
  };

  return (
    <main className="flex min-h-screen bg-gray-50">
      {/* 1. Sidebar de Navigation */}
      <NavSidebar />

      {/* 2. Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">
            {analysis ? `Analyse du contrat : ${analysis.filename}` : "Nouvelle Analyse"}
          </h1>
          {analysis && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
          )}
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-hidden relative">

          {!analysis && !isAnalyzing ? (
            // MODE UPLOAD
            <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50">
              <div className="max-w-2xl w-full">
                <div className="mb-8 text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Auditeur de Contrats IA</h2>
                  <p className="text-gray-500">
                    Déposez vos baux, CGU ou contrats de prestation. Notre IA détecte
                    automatiquement les clauses abusives en quelques secondes.
                  </p>
                </div>
                <DragDropUpload onFileSelect={handleFileSelect} isAnalyzing={isAnalyzing} />
              </div>
            </div>
          ) : (
            // MODE RÉSULTATS (Split View)
            <div className="h-full flex flex-row">
              {/* Colonne Gauche : Viewer */}
              <div className="flex-1 p-6 overflow-hidden flex flex-col">
                <div className="flex-1 relative h-full">
                  {isAnalyzing ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="font-medium text-indigo-700 animate-pulse">Consultation de la jurisprudence...</p>
                      </div>
                    </div>
                  ) : null}
                  <DocumentViewer
                    text={fileContent}
                    clauses={analysis?.clauses || []}
                    activeClauseId={activeClauseId}
                    onClauseClick={setActiveClauseId}
                  />
                </div>
              </div>

              {/* Colonne Droite : Cartes d'Analyse */}
              {analysis && !isAnalyzing && (
                <div className="w-[400px] xl:w-[480px] h-full shadow-xl z-20">
                  <AnalysisSidebar
                    clauses={analysis.clauses}
                    globalScore={analysis.risk_score_global}
                    activeClauseId={activeClauseId}
                    onClauseClick={setActiveClauseId}
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white border-l-4 border-red-500 shadow-lg rounded-r-lg p-4 flex items-center gap-3 animate-in slide-in-from-bottom-5">
              <AlertCircle className="text-red-500 w-5 h-5" />
              <div>
                <p className="font-bold text-gray-900 text-sm">Échec de l'analyse</p>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
