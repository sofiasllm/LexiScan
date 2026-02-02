"use client";

import { Scale, Clock, Settings, FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NavSidebar() {
    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col flex-shrink-0">
            <div className="p-6 flex items-center gap-3 border-b border-gray-100">
                <div className="bg-indigo-600 p-2 rounded-lg">
                    <Scale className="text-white w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">LexiScan</span>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Menu</h3>
                    <nav className="space-y-1">
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-indigo-600 bg-indigo-50 rounded-md font-medium">
                            <Scale className="w-4 h-4" />
                            Audit Actuel
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md font-medium transition-colors">
                            <Settings className="w-4 h-4" />
                            Paramètres
                        </a>
                    </nav>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Récent</h3>
                    <div className="space-y-1">
                        <div className="group flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                                <span className="truncate w-32">Bail_Commercial_75011.pdf</span>
                            </div>
                        </div>
                        <div className="group flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                                <span className="truncate w-32">Contrat_Prestation_IT.pdf</span>
                            </div>
                        </div>
                        <div className="group flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                                <span className="truncate w-32">NDA_Partenaire_V2.pdf</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        JD
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">Jean Dupont</p>
                        <p className="text-xs text-gray-500">Avocat Senior</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
