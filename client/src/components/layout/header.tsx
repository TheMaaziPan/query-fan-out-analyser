import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white border-b-4" style={{ borderBottomColor: '#ccff00' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <span className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: '#07262c' }}>
              (\/) MediaVision
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="p-2 hover:bg-gray-100"
            style={{ color: '#07262c' }}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
