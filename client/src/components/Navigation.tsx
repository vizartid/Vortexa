
import { ExternalLink, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import logoImage from "@assets/Logo-vortexa-white.png?url";

// Assuming 'Tomorrow' and 'Montserrat' are available via CSS imports or similar
// For example, in your main CSS file or within the component's CSS module:
// @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&family=Tomorrow:wght@400;600&display=swap');

interface NavigationProps {
  currentPath?: string;
}

export function Navigation({ currentPath = "/" }: NavigationProps) {
  const [, setLocation] = useLocation();
  const [isBurgerOpen, setIsBurgerOpen] = useState(false);
  const isMobile = useIsMobile();

  const navigateToHome = () => {
    setLocation("/");
    setIsBurgerOpen(false);
  };

  const navigateToChat = () => {
    setLocation("/chat");
    setIsBurgerOpen(false);
  };

  const openAboutMe = () => {
    window.open("https://vizart.netlify.app/", "_blank");
    setIsBurgerOpen(false);
  };

  const isHome = currentPath === "/";
  const isChat = currentPath === "/chat";

  // Sembunyikan navbar di halaman chat untuk desktop
  if (isChat) {
    return null;
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-transparent backdrop-blur-sm border-b border-white/5">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <img
              src={logoImage}
              alt="Vortexa Logo"
              className="h-10 w-10 object-contain"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent font-tomorrow">
              Vortexa
            </h1>
          </div>

          {/* Desktop Navigation - Tampil hanya di desktop */}
          {!isMobile && (
            <>
              {/* Center Navigation Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-sm p-1 border border-white/20">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={navigateToHome}
                    className={`px-6 py-3 rounded-sm text-base font-medium transition-all duration-200 font-tomorrow ${
                      isHome
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={navigateToChat}
                    className={`px-6 py-3 rounded-sm text-base font-medium transition-all duration-200 font-tomorrow ${
                      isChat
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    Chat Now
                  </button>
                </div>
              </div>

              {/* Right Navigation */}
              <div className="flex items-center space-x-4">
                <Button
                  onClick={openAboutMe}
                  variant="outline"
                  size="default"
                  className="bg-transparent text-white border-white hover:bg-white hover:text-black hover:border-white rounded-sm px-6 py-3 text-base font-['Roboto'] shadow-lg transition-all duration-200 h-12"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  About Me
                </Button>
              </div>
            </>
          )}

          {/* Mobile Burger Menu Button - Tampil hanya di mobile */}
          {isMobile && (
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBurgerOpen(!isBurgerOpen)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              >
                {isBurgerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </nav>
      </header>

      {/* Mobile Burger Menu Overlay - Tampil hanya di mobile */}
      {isMobile && isBurgerOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm">
          <div className="fixed top-20 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-b border-white/10 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Navigation Items */}
              <div className="flex flex-col space-y-4 mb-6">
                <button
                  onClick={navigateToHome}
                  className={`px-6 py-4 rounded-sm text-lg font-medium transition-all duration-200 font-tomorrow text-left ${
                    isHome
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-white hover:bg-white/10 border border-white/20"
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={navigateToChat}
                  className={`px-6 py-4 rounded-sm text-lg font-medium transition-all duration-200 font-tomorrow text-left ${
                    isChat
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-white hover:bg-white/10 border border-white/20"
                  }`}
                >
                  Chat Now
                </button>
                <button
                  onClick={openAboutMe}
                  className="px-6 py-4 rounded-sm text-lg font-medium transition-all duration-200 font-['Roboto'] text-left text-white hover:bg-white/10 border border-white/20 flex items-center"
                >
                  <ExternalLink className="w-5 h-5 mr-3" />
                  About Me
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
