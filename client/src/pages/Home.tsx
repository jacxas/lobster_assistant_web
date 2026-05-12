import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Download, Settings, MessageSquare, Zap, Shield, X, Search } from "lucide-react";
import { useState, useMemo } from "react";

const COMMUNITY_SETUPS = [
  {
    id: 1,
    name: "Developer's Dream",
    author: "@CodeCrusader",
    emoji: "👨‍💻",
    model: "Llama3",
    platforms: ["Discord"],
    useCase: "Development",
    description: "Code reviews, debugging, and documentation generation",
    testimonial: "Saves me hours on code reviews!",
    color: "orange",
    trending: true,
    popularity: 1250,
    rating: 4.8,
    ratingCount: 342
  },
  {
    id: 2,
    name: "Productivity Master",
    author: "@TimeKeeper",
    emoji: "⚡",
    model: "TinyLlama",
    platforms: ["Telegram", "Slack"],
    useCase: "Productivity",
    description: "Task management, meeting summaries, and scheduling",
    testimonial: "My personal assistant that never sleeps!",
    color: "blue",
    trending: true,
    popularity: 980,
    rating: 4.6,
    ratingCount: 298
  },
  {
    id: 3,
    name: "Content Creator",
    author: "@CreativeFlow",
    emoji: "✍️",
    model: "Mistral",
    platforms: ["WhatsApp", "Discord"],
    useCase: "Content",
    description: "Brainstorming, writing assistance, and content ideation",
    testimonial: "My creative muse in my pocket!",
    color: "purple",
    trending: false,
    popularity: 645,
    rating: 4.5,
    ratingCount: 187
  },
  {
    id: 4,
    name: "Research Assistant",
    author: "@DataDiver",
    emoji: "🔬",
    model: "Llama3",
    platforms: ["Telegram"],
    useCase: "Research",
    description: "Research synthesis, paper analysis, and knowledge extraction",
    testimonial: "My research partner that knows my papers!",
    color: "green",
    trending: false,
    popularity: 512,
    rating: 4.7,
    ratingCount: 156
  },
  {
    id: 5,
    name: "Language Tutor",
    author: "@PolyglotPro",
    emoji: "🌍",
    model: "Llama3",
    platforms: ["Discord"],
    useCase: "Learning",
    description: "Language practice, translation, and cultural insights",
    testimonial: "Learning languages has never been this fun!",
    color: "red",
    trending: true,
    popularity: 1100,
    rating: 4.9,
    ratingCount: 421
  },
  {
    id: 6,
    name: "Smart Home Hub",
    author: "@TechNinja",
    emoji: "🏠",
    model: "TinyLlama",
    platforms: ["Telegram"],
    useCase: "Automation",
    description: "Voice control, automation routines, and device management",
    testimonial: "My home listens only to me!",
    color: "yellow",
    trending: false,
    popularity: 428,
    rating: 4.3,
    ratingCount: 94
  }
];

const MODELS = ["Llama3", "TinyLlama", "Mistral"];
const PLATFORMS = ["Discord", "Telegram", "Slack", "WhatsApp"];
const USE_CASES = ["Development", "Productivity", "Content", "Research", "Learning", "Automation"];

const COLOR_MAP = {
  orange: { border: "border-orange-200", hover: "hover:border-orange-400", text: "text-orange-600" },
  blue: { border: "border-blue-200", hover: "hover:border-blue-400", text: "text-blue-600" },
  purple: { border: "border-purple-200", hover: "hover:border-purple-400", text: "text-purple-600" },
  green: { border: "border-green-200", hover: "hover:border-green-400", text: "text-green-600" },
  red: { border: "border-red-200", hover: "hover:border-red-400", text: "text-red-600" },
  yellow: { border: "border-yellow-200", hover: "hover:border-yellow-400", text: "text-yellow-600" }
};

function StarRating({ rating, ratingCount, setupId, onRate, userRating }: { rating: number; ratingCount: number; setupId: number; onRate: (setupId: number, newRating: number) => void; userRating?: number }) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleRate = (newRating: number) => {
    onRate(setupId, newRating);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110 cursor-pointer"
          >
            <span className={`text-xl ${
              star <= (hoverRating || userRating || rating)
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}>
              ★
            </span>
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-600 font-medium">
        {userRating ? `You rated: ${userRating}` : `${rating.toFixed(1)} (${ratingCount})`}
      </span>
    </div>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [setupRatings, setSetupRatings] = useState<Record<number, number>>({});

  const filteredSetups = useMemo(() => {
    return COMMUNITY_SETUPS.filter(setup => {
      const modelMatch = selectedModels.length === 0 || selectedModels.includes(setup.model);
      const platformMatch = selectedPlatforms.length === 0 || selectedPlatforms.some(p => setup.platforms.includes(p));
      const useCaseMatch = selectedUseCases.length === 0 || selectedUseCases.includes(setup.useCase);
      
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = searchQuery === "" || 
        setup.name.toLowerCase().includes(searchLower) ||
        setup.description.toLowerCase().includes(searchLower) ||
        setup.author.toLowerCase().includes(searchLower) ||
        setup.testimonial.toLowerCase().includes(searchLower);
      
      return modelMatch && platformMatch && useCaseMatch && searchMatch;
    });
  }, [selectedModels, selectedPlatforms, selectedUseCases, searchQuery]);

  const toggleFilter = (filter: string, type: "model" | "platform" | "useCase") => {
    if (type === "model") {
      setSelectedModels(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);
    } else if (type === "platform") {
      setSelectedPlatforms(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);
    } else {
      setSelectedUseCases(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedModels([]);
    setSelectedPlatforms([]);
    setSelectedUseCases([]);
  };

  const handleRateSetup = (setupId: number, newRating: number) => {
    setSetupRatings(prev => ({
      ...prev,
      [setupId]: newRating
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦞</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Lobster AI Assistant
            </h1>
          </div>
          <div className="text-sm text-gray-600">Local • Private • Yours</div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-block">
              <div className="text-7xl mb-4 animate-bounce">🦞</div>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900">
              Your Personal AI Assistant
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Run a powerful, private AI assistant on your own devices. Chat with your lobster friend through WhatsApp, Discord, Telegram, and Slack.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Shield className="w-5 h-5 text-orange-600" />
                <span>100% Private</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Zap className="w-5 h-5 text-orange-600" />
                <span>Lightning Fast</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MessageSquare className="w-5 h-5 text-orange-600" />
                <span>Multi-Platform</span>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {[
              {
                icon: "🔐",
                title: "Completely Local",
                description: "Runs on your own hardware. Your data never leaves your device."
              },
              {
                icon: "⚡",
                title: "Always Ready",
                description: "Instant responses powered by Ollama. No cloud delays."
              },
              {
                icon: "🌊",
                title: "Quirky Personality",
                description: "A lobster with character. Expect marine metaphors and exfoliation wisdom."
              }
            ].map((feature, i) => (
              <Card key={i} className="p-6 border-orange-100 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Installation Guide */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
            Installation Guide
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Follow these steps to get your lobster assistant up and running. It's easier than you think!
          </p>

          <div className="space-y-8">
            {/* Step 1: Prerequisites */}
            <Card className="p-8 border-l-4 border-l-orange-600">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-orange-100">
                    <span className="text-xl font-bold text-orange-600">1</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Install Prerequisites</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">📦 Ollama (The Brain)</h4>
                      <p className="text-gray-600 mb-3">Download and install from <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline font-semibold">ollama.com</a></p>
                      <div className="bg-gray-100 p-3 rounded font-mono text-sm text-gray-700">
                        ollama pull tinyllama
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">📟 Node.js (Version 20+)</h4>
                      <p className="text-gray-600">Required for running the assistant. Check with: <code className="bg-gray-100 px-2 py-1 rounded text-sm">node -v</code></p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">📦 pnpm (Package Manager)</h4>
                      <p className="text-gray-600 mb-3">Fast and efficient package manager</p>
                      <div className="bg-gray-100 p-3 rounded font-mono text-sm text-gray-700">
                        curl -fsSL https://get.pnpm.io/install.sh | sh -
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Step 2: Download */}
            <Card className="p-8 border-l-4 border-l-blue-600">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
                    <span className="text-xl font-bold text-blue-600">2</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Download the Assistant</h3>
                  <p className="text-gray-600 mb-4">Get the latest version of the Lobster Assistant</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Download className="w-4 h-4 mr-2" />
                    Download lobster_assistant_v1.zip
                  </Button>
                  <p className="text-sm text-gray-500 mt-3">Extract the ZIP file to your preferred location</p>
                </div>
              </div>
            </Card>

            {/* Step 3: Setup */}
            <Card className="p-8 border-l-4 border-l-red-600">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-red-100">
                    <span className="text-xl font-bold text-red-600">3</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Run Setup Wizard</h3>
                  <p className="text-gray-600 mb-4">Navigate to the extracted folder and run the interactive setup</p>
                  <div className="space-y-3">
                    <div className="bg-gray-100 p-3 rounded font-mono text-sm text-gray-700">
                      pnpm install
                    </div>
                    <div className="bg-gray-100 p-3 rounded font-mono text-sm text-gray-700">
                      node setup.js
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">The wizard will guide you through connecting your chat platforms</p>
                </div>
              </div>
            </Card>

            {/* Step 4: Launch */}
            <Card className="p-8 border-l-4 border-l-green-600">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100">
                    <span className="text-xl font-bold text-green-600">4</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Start Your Assistant</h3>
                  <p className="text-gray-600 mb-4">Launch the assistant on all configured platforms</p>
                  <div className="bg-gray-100 p-3 rounded font-mono text-sm text-gray-700 mb-3">
                    node index.js
                  </div>
                  <p className="text-sm text-green-600 font-semibold">✓ Your lobster is now online and ready to help!</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Configuration */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
            Platform Configuration
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Connect your assistant to your favorite chat apps
          </p>

          <Tabs defaultValue="telegram" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="telegram">Telegram</TabsTrigger>
              <TabsTrigger value="discord">Discord</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="slack">Slack</TabsTrigger>
            </TabsList>

            <TabsContent value="telegram" className="space-y-4">
              <Card className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">🤖 Telegram Setup</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">1. Create a Bot</h4>
                    <p className="text-gray-600 mb-2">Search for <code className="bg-gray-100 px-2 py-1 rounded">@BotFather</code> on Telegram</p>
                    <p className="text-gray-600">Send <code className="bg-gray-100 px-2 py-1 rounded">/newbot</code> and follow the instructions</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">2. Get Your Token</h4>
                    <p className="text-gray-600">BotFather will give you a token that looks like: <code className="bg-gray-100 px-2 py-1 rounded text-sm">123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11</code></p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">3. Add to Setup</h4>
                    <p className="text-gray-600">When running <code className="bg-gray-100 px-2 py-1 rounded">node setup.js</code>, paste your token when asked</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="discord" className="space-y-4">
              <Card className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">🎮 Discord Setup</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">1. Create Application</h4>
                    <p className="text-gray-600 mb-2">Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Discord Developer Portal</a></p>
                    <p className="text-gray-600">Click "New Application" and give it a name</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">2. Create Bot</h4>
                    <p className="text-gray-600 mb-2">In the left menu, click "Bot" → "Add Bot"</p>
                    <p className="text-gray-600">Under TOKEN, click "Copy" to get your bot token</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">3. Enable Intents</h4>
                    <p className="text-gray-600 mb-2">Scroll down to "GATEWAY INTENTS" and enable:</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                      <li>Message Content Intent</li>
                      <li>Server Members Intent</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">4. Invite to Server</h4>
                    <p className="text-gray-600">Go to OAuth2 → URL Generator, select "bot" scope and necessary permissions</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4">
              <Card className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">📱 WhatsApp Setup</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">1. Enable WhatsApp</h4>
                    <p className="text-gray-600">When running <code className="bg-gray-100 px-2 py-1 rounded">node setup.js</code>, answer "yes" when asked about WhatsApp</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">2. Scan QR Code</h4>
                    <p className="text-gray-600 mb-2">A QR code will appear in your terminal</p>
                    <p className="text-gray-600">Open WhatsApp on your phone → Settings → Linked Devices → Link a Device</p>
                    <p className="text-gray-600">Scan the QR code with your phone camera</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">3. Stay Connected</h4>
                    <p className="text-gray-600">Keep the assistant running to maintain the connection</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="slack" className="space-y-4">
              <Card className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">💼 Slack Setup</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">1. Create Slack App</h4>
                    <p className="text-gray-600 mb-2">Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Slack API Dashboard</a></p>
                    <p className="text-gray-600">Click "Create New App" → "From scratch"</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">2. Configure Bot Token</h4>
                    <p className="text-gray-600 mb-2">Go to "OAuth & Permissions"</p>
                    <p className="text-gray-600">Copy the "Bot User OAuth Token" (starts with xoxb-)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">3. Add Scopes</h4>
                    <p className="text-gray-600 mb-2">Under "Scopes", add these permissions:</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                      <li>chat:write</li>
                      <li>chat:write.public</li>
                      <li>im:read</li>
                      <li>channels:read</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Community Setups Section with Filters */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-orange-50">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
            Community Setups
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Discover how other users have customized their Lobster Assistant. Get inspired and find the perfect setup for your needs.
          </p>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, description, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-orange-600 focus:outline-none transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Filter Section */}
          <div className="mb-12 space-y-6">
            {/* Model Filters */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Filter by Model</h3>
              <div className="flex flex-wrap gap-2">
                {MODELS.map(model => (
                  <button
                    key={model}
                    onClick={() => toggleFilter(model, "model")}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectedModels.includes(model)
                        ? "bg-orange-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Filters */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Filter by Platform</h3>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(platform => (
                  <button
                    key={platform}
                    onClick={() => toggleFilter(platform, "platform")}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectedPlatforms.includes(platform)
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            {/* Use Case Filters */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Filter by Use Case</h3>
              <div className="flex flex-wrap gap-2">
                {USE_CASES.map(useCase => (
                  <button
                    key={useCase}
                    onClick={() => toggleFilter(useCase, "useCase")}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectedUseCases.includes(useCase)
                        ? "bg-purple-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {useCase}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery !== "" || selectedModels.length > 0 || selectedPlatforms.length > 0 || selectedUseCases.length > 0) && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-300">
                <p className="text-sm text-gray-600">
                  Showing {filteredSetups.length} of {COMMUNITY_SETUPS.length} setups
                </p>
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Setups Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSetups.length > 0 ? (
              filteredSetups.map(setup => {
                const colors = COLOR_MAP[setup.color as keyof typeof COLOR_MAP];
                return (
                  <Card
                    key={setup.id}
                    className={`p-6 border-2 ${colors.border} hover:shadow-xl transition-all ${colors.hover} hover:scale-105 relative`}
                  >
                    {setup.trending && (
                      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse flex items-center gap-1">
                        <span>🔥</span>
                        <span>Trending</span>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{setup.name}</h3>
                        <p className="text-sm text-gray-500">by {setup.author}</p>
                      </div>
                      <span className="text-2xl">{setup.emoji}</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Model</p>
                        <p className="text-gray-700">{setup.model}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Platforms</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {setup.platforms.map(platform => (
                            <span key={platform} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Use Case</p>
                        <p className="text-gray-700">{setup.useCase}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Description</p>
                        <p className="text-gray-700 text-sm">{setup.description}</p>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <p className={`text-sm ${colors.text} font-semibold`}>💡 "{setup.testimonial}"</p>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Community Rating</p>
                        <StarRating
                          rating={setup.rating}
                          ratingCount={setup.ratingCount}
                          setupId={setup.id}
                          onRate={handleRateSetup}
                          userRating={setupRatings[setup.id]}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600 text-lg">No setups match your filters. Try adjusting your selection!</p>
              </div>
            )}
          </div>

          {/* Share Your Setup CTA */}
          <div className="mt-16 text-center">
            <Card className="p-8 bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Share Your Setup! 🦞</h3>
              <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                Have you created an amazing custom setup? We'd love to feature it in our community gallery!
              </p>
              <Button className="bg-orange-600 hover:bg-orange-700">
                Submit Your Setup
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "Is my data really private?",
                a: "Yes! Everything runs locally on your machine. Ollama processes all conversations on your device, and your data never leaves your hardware unless you explicitly send it somewhere."
              },
              {
                q: "What if I don't have a GPU?",
                a: "No problem! The assistant works on CPU too. TinyLlama is optimized for lower-end hardware. For better performance, you can upgrade to a more powerful model once you're comfortable."
              },
              {
                q: "Can I use a different LLM model?",
                a: "Absolutely! You can use any model supported by Ollama. Just download it with 'ollama pull model_name' and update your configuration."
              },
              {
                q: "How much disk space do I need?",
                a: "TinyLlama requires about 1GB. Llama3 needs about 5GB. Check Ollama's documentation for your chosen model's requirements."
              },
              {
                q: "What's with all the lobster references?",
                a: "The lobster is our mascot! It represents the philosophy of the assistant: always shedding old shells (exfoliating) to grow, staying sharp and ready to help, and thriving in its own environment (your local machine)."
              }
            ].map((faq, i) => (
              <Card key={i} className="p-6 border-l-4 border-l-orange-300">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Meet Your Lobster? 🦞
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Follow the installation guide above and you'll be chatting with your personal AI assistant in minutes.
          </p>
          <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-bold">
            <Download className="w-5 h-5 mr-2" />
            Download Now
          </Button>
          <p className="text-orange-100 text-sm mt-6">
            ¡EXFOLIAR! Your journey to private AI starts here.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">About</h4>
              <p className="text-sm">A personal AI assistant that respects your privacy and runs on your own hardware.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">Discord</a></li>
                <li><a href="#" className="hover:text-white transition">Email</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>Made with ❤️ and pinzas by Manus AI • © 2026 Lobster Assistant</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
