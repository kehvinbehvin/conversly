import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  Mic,
  Lightbulb,
  Clock,
  Shield,
  TrendingUp,
  BarChart3,
  Star,
} from "lucide-react";
import { AnonymousConversationProvider } from "@/contexts/AnonymousConversationContext";
import AnonymousConversationTool from "@/components/AnonymousConversationTool";
import AnonymousReviewPanel from "@/components/AnonymousReviewPanel";

export default function Landing() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-warm-brown-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-warm-brown-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-warm-brown-700">
              Conversly
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="text-warm-brown-600 hover:text-warm-brown-800 font-medium transition-colors"
                >
                  How it Works
                </button>
                <button
                  onClick={() => scrollToSection("features")}
                  className="text-warm-brown-600 hover:text-warm-brown-800 font-medium transition-colors"
                >
                  Features
                </button>
                <Link href="/dashboard">
                  <Button className="bg-coral-500 text-white px-6 py-2 rounded-full font-medium hover:bg-coral-600 transition-colors shadow-sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative warm-gradient min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
          {/* Compact Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
              <span className="text-warm-brown-800">Practice conversations. </span>
              <span className="text-coral-500">Build confidence.</span>
            </h1>
            <p className="text-lg text-warm-brown-600 max-w-3xl mx-auto mb-6">
              AI-powered conversation practice with instant feedback
            </p>
            <div className="flex justify-center items-center space-x-6 text-sm text-warm-brown-600">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-sage-500" />
                <span>Free to try</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-sage-500" />
                <span>Instant feedback</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-sage-500" />
                <span>No signup required</span>
              </div>
            </div>
          </div>

          {/* Free Practice Tool - Hero Element */}
          <AnonymousConversationProvider>
            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="h-[500px]">
                <AnonymousConversationTool agentId="agent_01jyfb9fh8f67agfzvv09tvg3t" />
              </div>
              <div className="h-[500px]">
                <AnonymousReviewPanel />
              </div>
            </div>
          </AnonymousConversationProvider>

          {/* Upgrade CTA */}
          <div className="text-center mt-12">
            <Link href="/dashboard">
              <Button className="bg-coral-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-coral-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                Create Account to Track Progress
              </Button>
            </Link>
            <p className="text-sm text-warm-brown-500 mt-3">
              Save your conversations and see improvement over time
            </p>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 right-8 w-16 h-16 coral-gradient rounded-full opacity-40"></div>
        <div className="absolute bottom-32 left-8 w-12 h-12 sage-gradient rounded-full opacity-40"></div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl font-bold text-warm-brown-800">
              How It Works
            </h2>
            <p className="text-xl text-warm-brown-600 max-w-3xl mx-auto">
              Simple, effective conversation practice in three easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center space-y-6 p-6">
              <div className="w-20 h-20 coral-gradient rounded-2xl mx-auto flex items-center justify-center">
                <Mic className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-warm-brown-800">
                Start Talking
              </h3>
              <p className="text-warm-brown-600">
                Begin a 5-minute voice conversation with our AI coach about "How
                was your weekend?" in a safe, judgment-free environment.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-6 p-6">
              <div className="w-20 h-20 sage-gradient rounded-2xl mx-auto flex items-center justify-center">
                <Lightbulb className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-warm-brown-800">
                AI Analysis
              </h3>
              <p className="text-warm-brown-600">
                Our advanced AI analyzes your conversation, identifying
                strengths, areas for improvement, and communication patterns.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-6 p-6">
              <div className="w-20 h-20 bg-warm-brown-600 rounded-2xl mx-auto flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-warm-brown-800">
                Get Feedback
              </h3>
              <p className="text-warm-brown-600">
                Receive personalized, actionable feedback with annotations and
                suggestions to improve your conversation skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sage-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl font-bold text-warm-brown-800">
              Why Choose Conversly?
            </h2>
            <p className="text-xl text-warm-brown-600 max-w-3xl mx-auto">
              Designed specifically for socially self-aware individuals seeking
              genuine improvement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-coral-100 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-coral-500" />
                </div>
                <h3 className="text-xl font-semibold text-warm-brown-800 mb-4">
                  Safe Environment
                </h3>
                <p className="text-warm-brown-600">
                  Practice without judgment in a supportive space designed for
                  growth and learning.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center mb-6">
                  <Mic className="w-6 h-6 text-sage-500" />
                </div>
                <h3 className="text-xl font-semibold text-warm-brown-800 mb-4">
                  Voice-First Practice
                </h3>
                <p className="text-warm-brown-600">
                  Authentic conversation practice using natural speech patterns
                  and vocal communication.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-warm-brown-200 rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-warm-brown-600" />
                </div>
                <h3 className="text-xl font-semibold text-warm-brown-800 mb-4">
                  Detailed Analytics
                </h3>
                <p className="text-warm-brown-600">
                  Track your progress with conversation metrics and detailed
                  feedback over time.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-coral-100 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6 text-coral-500" />
                </div>
                <h3 className="text-xl font-semibold text-warm-brown-800 mb-4">
                  Quick Sessions
                </h3>
                <p className="text-warm-brown-600">
                  Perfect 5-minute sessions that fit into your busy schedule
                  without overwhelming commitment.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center mb-6">
                  <Lightbulb className="w-6 h-6 text-sage-500" />
                </div>
                <h3 className="text-xl font-semibold text-warm-brown-800 mb-4">
                  AI-Powered Insights
                </h3>
                <p className="text-warm-brown-600">
                  Advanced analysis of your communication patterns with
                  actionable improvement suggestions.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-warm-brown-200 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-warm-brown-600" />
                </div>
                <h3 className="text-xl font-semibold text-warm-brown-800 mb-4">
                  Continuous Improvement
                </h3>
                <p className="text-warm-brown-600">
                  Build confidence progressively with each session, tracking
                  your growth journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-warm-brown-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Ready to Build Your Conversation Confidence?
            </h2>
            <p className="text-xl text-warm-brown-200 max-w-3xl mx-auto">
              Join hundreds of socially self-aware individuals who are improving
              their interpersonal connections through guided voice
              conversations.
            </p>

            <div className="space-y-6">
              <Link href="/dashboard">
                <Button className="bg-coral-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-coral-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                  Start Your First Conversation
                </Button>
              </Link>

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-warm-brown-200">
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-sage-400" />
                  <span>No commitment required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-sage-400" />
                  <span>Safe practice environment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-sage-400" />
                  <span>Instant AI feedback</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-warm-brown-900 text-warm-brown-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="text-2xl font-bold text-white">Conversly</div>
              <p className="text-warm-brown-300">
                Safe, AI-powered conversation practice for building
                interpersonal confidence.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Product</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="hover:text-white transition-colors"
                  >
                    How it Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("features")}
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-white transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Connect</h3>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-warm-brown-300 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-warm-brown-300 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-warm-brown-700 mt-12 pt-8 text-center">
            <p className="text-warm-brown-400">
              © 2024 Conversly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
