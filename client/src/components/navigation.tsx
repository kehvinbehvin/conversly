import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MessageCircle, BarChart3, History, Database } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  
  // Don't show navigation on landing page
  if (location === "/") {
    return null;
  }

  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-warm-brown-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard">
            <div className="text-2xl font-bold text-warm-brown-700 cursor-pointer">
              Conversly
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/dashboard">
              <Button 
                variant={location === "/dashboard" ? "default" : "ghost"} 
                className="flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
            
            <Link href="/conversation">
              <Button 
                variant={location === "/conversation" ? "default" : "ghost"}
                className="flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Practice</span>
              </Button>
            </Link>
            
            <Link href="/history">
              <Button 
                variant={location === "/history" ? "default" : "ghost"}
                className="flex items-center space-x-2"
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </Button>
            </Link>
            
            <Link href="/storage">
              <Button 
                variant={location === "/storage" ? "default" : "ghost"}
                className="flex items-center space-x-2"
              >
                <Database className="w-4 h-4" />
                <span>Storage</span>
              </Button>
            </Link>
          </div>
          
          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
