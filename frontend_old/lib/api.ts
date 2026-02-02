const API_URL = "http://localhost:8000";

export interface Clause {
    id: number;
    text: string;
    start_index: number;
    end_index: number;
    analysis?: {
        risk_level: "ROUGE" | "ORANGE" | "VERT";
        score: number;
        legal_reference: string;
        explanation: string;
        recommendation: string;
    };
}

export interface AnalysisResponse {
    filename: string;
    total_clauses: number;
    risk_score_global: number;
    clauses: Clause[];
}

export async function uploadAndAnalyze(file: File): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        let errorMessage = "Erreur lors de l'analyse du document";
        try {
            const errorData = await response.json();
            if (errorData.detail) {
                errorMessage = errorData.detail;
            }
        } catch {
            // Ignorer si le JSON est malformé
        }
        throw new Error(errorMessage);
    }

    return response.json();
}
