import React, { isLoading, useState, useEffect } from 'react';
import { Search, Filter, Bitcoin, DollarSign, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

interface NewsItem {
  title: string;
  url: string;
  summary: string[];
  originalText: string;
}

// News Skeleton Component
const NewsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-gray-800 rounded-xl p-6 space-y-4">
        <div className="h-4 w-24 bg-gray-700 rounded"></div> {/* Source Logo */}
        <div className="h-6 bg-gray-700 rounded w-5/6"></div> {/* Title */}
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-11/12"></div>
        <div className="h-4 bg-gray-700 rounded w-10/12"></div>
        <div className="h-10 w-32 bg-gray-700 rounded-full mt-6"></div> {/* Read Original Button */}
      </div>
    ))}
  </div>
);

export default function App() {
  const [searchTerm, setSearchTerm] = useState(""); // За текста в търсачката
  const [newsList, setNewsList] = useState<any[]>([]); // За самите новини
  const [filter, setFilter] = useState([]); // 'all', 'crypto', 'stocks', 'manipulation'
  const [loading, setLoading] = useState(true); // Бонус: добавяме статус за зареждане
  const [searchQuery, setSearchQuery] = useState("");

  const handleRefresh = async () => {
  setLoading(true);
  try {
    // Добавяме ?force=true и малко случайно число (timestamp), 
    // за да излъжем браузъра да не ползва стария кеш
    const response = await fetch(`/api/news/latest?force=true&t=${Date.now()}`);
    const data = await response.json();
    
    setNewsList(data);
    alert("Новините бяха обновени директно от Gemini!");
  } catch (error) {
    console.error("Грешка при обновяване:", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    console.log("Компонентът е зареден, търся новини...");
    
    fetch("/api/news/latest?refresh=true")
      .then((res) => res.json())
      .then((data) => {
        console.log("Новините пристигнаха:", data);
        setNewsList(data);
        setLoading(false); // Спираме значката за зареждане
      })
      .catch((err) => {
        console.error("Грешка при връзка с бекенда:", err);
        setLoading(false);
      });
  }, []);

  const fetchLatestNews = async (): Promise<NewsItem> => {
    const response = await fetch("/api/news/latest");
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.details || errData.error || "Грешка при извличане на новините.");
    }
    return response.json();
  };

  const { data, isLoading, isError, error, refetch } = useQuery<NewsItem, Error>({
    queryKey: ['latestNews'],
    queryFn: fetchLatestNews,
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    refetchOnWindowFocus: false, // Disable automatic refetch on window focus
  });

  // For now, we'll simulate multiple news items by duplicating the single fetched item
  const newsItems: NewsItem[] = data ? Array(6).fill(data) : [];

 const filteredNews = (newsList || []).filter((item) => {
  // Проверяваме дали item и свойството съществуват
  const title = item?.title?.toLowerCase() || "";
  
  // Тук е важно да проверим дали summary съществува и е масив
  const summary = Array.isArray(item?.summary) 
    ? item.summary.join(" ").toLowerCase() 
    : "";
    
  const searchTerm = searchQuery?.toLowerCase() || "";

  return title.includes(searchTerm) || summary.includes(searchTerm);
});

const getSourceDomain = (url: string) => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return "Източник";
  }
};

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Header / Navigation Bar */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-green-400 font-serif">Crypto Digest</h1>
          
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="Търсене на новини..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-100 placeholder-gray-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <button 
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === "all" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
            >
              Всички
            </button>
            <button 
              onClick={() => setFilter("crypto")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === "crypto" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
            >
              <Bitcoin className="inline-block w-4 h-4 mr-1" /> Крипто
            </button>
            <button 
              onClick={() => setFilter("stocks")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === "stocks" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
            >
              <DollarSign className="inline-block w-4 h-4 mr-1" /> Акции
            </button>
            <button 
              onClick={() => setFilter("manipulation")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === "manipulation" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
            >
              Манипулации
            </button>
            <button 
              onClick={handleRefresh} 
              disabled={loading} // Предотвратява многократно кликане, докато зарежда
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? "Зареждане..." : "Обнови новините"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-8">
            Crypto <span className="text-blue-500">Finance</span> Digest
          </h1>
        {isError ? (
          <div className="bg-red-900 border border-red-700 p-6 rounded-xl flex items-start gap-4 text-red-100">
            <AlertCircle className="text-red-400 w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Възникна проблем</h3>
              <p className="text-sm mt-1">{error?.message || "Неизвестна грешка."}</p>
              <button 
                onClick={() => refetch()}
                className="mt-4 text-sm font-bold text-red-300 underline underline-offset-4 hover:text-red-100"
              >
                Опитай пак
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <NewsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.length > 0 ? (
              filteredNews.map((item, index) => {
                const domain = getSourceDomain(item.url);
                // Използваме Google Favicon API за логото
                const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

                return (
                  <div key={index} className="bg-gray-900 rounded-xl bg-white/5 backdrop-blur-md p-6 shadow-lg border border-blue-800 flex flex-col hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex items-center gap-3 mb-4">
                      {/* Динамично лого */}
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
                        <img 
                          src={logoUrl} 
                          alt={domain} 
                          className="w-5 h-5 object-contain" 
                          onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/330/330703.png"; }} // Икона по подразбиране при грешка
                        />
                      </div>
                      <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                        {domain.split('.')[0]} {/* Изписва само името, напр. "coindesk" */}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-3 leading-tight">
                      {item.title}
                    </h2>

                    <ul className="list-disc list-inside text-gray-300 text-sm space-y-2 flex-grow">
                      {item.summary.map((bullet, i) => (
                        <li key={i} className="leading-relaxed">
                          {bullet.replace(/^[•-][\s]*/, '')}
                        </li>
                      ))}
                    </ul>

                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors self-start shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" /> Прочети в {domain.split('.')[0]}
                    </a>
                  </div>
                );
              })
            ) : (
             <div className="col-span-full text-center py-12 text-gray-400">
            <p className="text-lg">Няма намерени новини, отговарящи на критериите.</p>
          </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>Изградено с Gemini AI & Node.js • 2024 Crypto Digest</p>
      </footer>
    </div>
  );
}
