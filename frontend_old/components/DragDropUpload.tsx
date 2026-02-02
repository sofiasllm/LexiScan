"use client";


import { useCallback, useState } from "react";
import { Upload, FileText, Loader2, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragDropUploadProps {
    onFileSelect: (file: File) => void;
    isAnalyzing: boolean;
}

export default function DragDropUpload({ onFileSelect, isAnalyzing }: DragDropUploadProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                onFileSelect(e.dataTransfer.files[0]);
            }
        },
        [onFileSelect]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center transition-all cursor-pointer bg-white shadow-sm",
                isDragging
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                isAnalyzing && "opacity-60 cursor-not-allowed"
            )}
        >
            <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleChange}
                accept=".pdf,.txt"
                disabled={isAnalyzing}
            />

            <div className="relative mb-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                    {isAnalyzing ? (
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    ) : (
                        <Upload className="w-8 h-8 text-indigo-600" />
                    )}
                </div>
                {isAnalyzing && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 animate-loading-bar"></div>
                    </div>
                )}
            </div>

            <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                    {isAnalyzing ? "Analyse en cours..." : "Téléverser votre contrat"}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Glissez-déposez votre fichier PDF ou cliquez pour parcourir. Analyse sécurisée et confidentielle.
                </p>
            </div>

            {!isAnalyzing && (
                <button className="mt-8 px-6 py-2 bg-white border border-gray-300 rounded-full font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                    Parcourir les fichiers
                </button>
            )}
        </div>
    );
}
