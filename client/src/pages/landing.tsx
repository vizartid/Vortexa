import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, ExternalLink, MessageCircle, Info, Github, Linkedin, Globe, Mail } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import logoImage from "@assets/Logo-vortexa-white.png?url";

export default function Landing() {
  const [, setLocation] = useLocation();

  const navigateToChat = () => {
    setLocation("/chat");
  };

  const openAboutMe = () => {
    window.open("https://vizart.netlify.app/", "_blank");
  };

  const openSourceCode = () => {
    window.open("https://github.com/Myfza/Vortexa", "_blank");
  };

  const openSocialLink = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-['Tomorrow']">
      <Navigation currentPath="/" />

      {/* Hero Section - Full Screen */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Content */}
          <div className="mb-12">
            <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Welcome to Vortexa
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed font-['Roboto']">
              Experience the power of AI conversation with our advanced chatbot.
              Get instant answers, creative assistance, and intelligent insights.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={navigateToChat}
              size="lg"
              className="font-['Roboto'] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-sm h-14"
            >
              <MessageCircle className="w-6 h-6 mr-3" />
              Start Chatting
            </Button>
            <Button
              onClick={openSourceCode}
              variant="outline"
              size="lg"
              className="font-['Roboto'] bg-transparent text-white border-white hover:bg-white hover:text-black hover:border-white px-12 py-4 text-xl font-semibold rounded-sm h-14 shadow-lg transition-all duration-200"
            >
              <Github className="w-6 h-6 mr-3" />
              Source Code
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h3 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Features & Benefits
            </h3>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Discover what makes Vortexa the perfect AI companion for all your needs.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <Bot className="w-16 h-16 text-purple-400 mx-auto mb-6" />
                <h4 className="text-xl font-semibold text-white mb-4">AI-Powered</h4>
                <p className="text-gray-400">
                  Advanced AI technology for intelligent conversations and creative problem-solving
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-16 h-16 text-purple-400 mx-auto mb-6" />
                <h4 className="text-xl font-semibold text-white mb-4">Real-time Chat</h4>
                <p className="text-gray-400">
                  Instant responses and seamless conversation flow for natural interactions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <Info className="w-16 h-16 text-purple-400 mx-auto mb-6" />
                <h4 className="text-xl font-semibold text-white mb-4">Smart Insights</h4>
                <p className="text-gray-400">
                  Get intelligent answers, creative solutions, and personalized assistance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary CTA */}
          <div className="text-center">
            <Button
              onClick={navigateToChat}
              size="lg"
              className="font-['Roboto'] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 text-xl font-semibold rounded-sm h-14"
            >
              <MessageCircle className="w-6 h-6 mr-3" />
              Try It Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img
                  src={logoImage}
                  alt="Vortexa Logo"
                  className="h-8 w-8 object-contain"
                />
                <span className="text-xl font-bold">Vortexa</span>
              </div>
              <p className="text-gray-400 text-sm">
                Intelligent AI chatbot powered by advanced technology.
                Experience the future of conversation today.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Quick Links</h3>
              <div className="space-y-2">
                <button
                  onClick={navigateToChat}
                  className="block text-gray-400 hover:text-purple-400 transition-colors text-sm rounded-sm"
                >
                  Chatbot
                </button>
                <button
                  onClick={openAboutMe}
                  className="block text-gray-400 hover:text-blue-400 transition-colors text-sm rounded-sm"
                >
                  About Me
                </button>
                <button
                  onClick={openSourceCode}
                  className="block text-gray-400 hover:text-green-400 transition-colors text-sm rounded-sm"
                >
                  Source Code
                </button>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Connect With Me</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => openSocialLink("https://github.com/Myfza")}
                  className="p-3 text-white hover:text-black hover:bg-white transition-all duration-200 rounded-sm border border-white/20"
                >
                  <Github className="w-5 h-5" />
                </button>
                <button
                  onClick={() => openSocialLink("https://linkedin.com/in/yourprofile")}
                  className="p-3 text-white hover:text-white hover:bg-[#0077B5] transition-all duration-200 rounded-sm border border-white/20"
                >
                  <Linkedin className="w-5 h-5" />
                </button>
                <button
                  onClick={() => openSocialLink("https://vizart.netlify.app/")}
                  className="p-3 text-white hover:text-white hover:bg-blue-500 transition-all duration-200 rounded-sm border border-white/20"
                >
                  <Globe className="w-5 h-5" />
                </button>
                <button
                  onClick={() => openSocialLink("mailto:your-email@example.com")}
                  className="p-3 text-white hover:text-white hover:bg-red-500 transition-all duration-200 rounded-sm border border-white/20"
                >
                  <Mail className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2024 Vortexa. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <button
                onClick={navigateToChat}
                className="text-gray-400 hover:text-purple-400 transition-colors text-sm rounded-sm"
              >
                Chat
              </button>
              <button
                onClick={openAboutMe}
                className="text-gray-400 hover:text-blue-400 transition-colors text-sm rounded-sm"
              >
                Portfolio
              </button>
              <button
                onClick={openSourceCode}
                className="text-gray-400 hover:text-green-400 transition-colors text-sm rounded-sm"
              >
                GitHub
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}