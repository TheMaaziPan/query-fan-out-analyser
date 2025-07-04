import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-full mx-auto px-6">
        <div className="flex justify-center items-center h-16">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">LLM Brand Mention Tracker</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor brand mentions across ChatGPT, Gemini, Claude, Grok & Perplexity</p>
          </div>
        </div>
      </div>
    </header>
  );
}
