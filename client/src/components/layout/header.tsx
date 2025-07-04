import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-surface shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Search className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">What do LLMs look for on my webpage?</h1>
          </div>

        </div>
      </div>
    </header>
  );
}
