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
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-gray-700 hover:text-primary transition-colors">Dashboard</a>
            <a href="#" className="text-gray-700 hover:text-primary transition-colors">History</a>
            <a href="#" className="text-gray-700 hover:text-primary transition-colors">API Docs</a>
            <Button className="bg-primary text-white hover:bg-blue-700">
              Account
            </Button>
          </nav>
          <Button variant="ghost" className="md:hidden">
            <span className="sr-only">Menu</span>
            ☰
          </Button>
        </div>
      </div>
    </header>
  );
}
