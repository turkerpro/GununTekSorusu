import React, { useState, useEffect } from "react";
import { 
  Flame, 
  Calendar, 
  Sparkles, 
  Heart, 
  Globe, 
  Download, 
  ChevronRight, 
  Check, 
  X, 
  BookOpen, 
  CornerDownRight, 
  RefreshCw, 
  Lock, 
  User, 
  Smile, 
  Send, 
  CloudRain, 
  FileText, 
  Users, 
  Briefcase, 
  Compass,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DailyLog, UserProfile, GlobalFeedItem, AIAnalysisResult } from "./types";

export default function App() {
  // --- STATE ---
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("gts_profile");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      name: "",
      streak: 0,
      maxStreak: 0,
      lastDateAnswered: null,
      ageRange: "25-34",
      country: "Türkiye",
      isPremium: true,
    };
  });

  const [logs, setLogs] = useState<DailyLog[]>(() => {
    const saved = localStorage.getItem("gts_logs");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Seed with empty logs initially
    return [];
  });

  const [question, setQuestion] = useState<string>("Yükleniyor ya da sakinliğini topluyor...");
  const [currentIsAlternative, setCurrentIsAlternative] = useState<boolean>(false);
  const [altSource, setAltSource] = useState<string>("");
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(true);
  const [aiActive, setAiActive] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string>("");

  // Input States for today
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");
  const [answerText, setAnswerText] = useState<string>("");
  const [moodScore, setMoodScore] = useState<number>(3);
  const [shareGlobally, setShareGlobally] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Global Feed State
  const [globalFeed, setGlobalFeed] = useState<GlobalFeedItem[]>([]);
  const [loadingGlobalFeed, setLoadingGlobalFeed] = useState<boolean>(true);

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(() => {
    const saved = localStorage.getItem("gts_latest_analysis");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Tab State: "bugun" | "gunluk" | "kesfet" | "premium"
  const [activeTab, setActiveTab] = useState<string>("bugun");

  // Notifications or toast messages
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Onboarding modal or card
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    const saved = localStorage.getItem("gts_onboarded");
    return saved === "true";
  });

  // Name Editor
  const [tempName, setTempName] = useState(profile.name || "");
  const [tempAge, setTempAge] = useState(profile.ageRange || "25-34");
  const [tempCountry, setTempCountry] = useState(profile.country || "Türkiye");

  // Custom question pack selection
  const [selectedPack, setSelectedPack] = useState<string>("Genel Farkındalık");

  // Global feed heart interactions in-memory only
  const [likedFeedItems, setLikedFeedItems] = useState<Record<string, boolean>>({});
  const [supportedFeedItems, setSupportedFeedItems] = useState<Record<string, boolean>>({});

  // Today's date representation (YYYY-MM-DD)
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayDateString();
  const todayLog = logs.find(log => log.date === todayStr);

  const EMOJI_LIST = [
    { char: "😢", label: "Hassas/Üzgün", score: 1 },
    { char: "😐", label: "Dengeli/Sakin", score: 2 },
    { char: "🙂", label: "Memnun", score: 3 },
    { char: "😊", label: "Keyifli/Mutlu", score: 4 },
    { char: "😍", label: "Şükran Dolu", score: 5 },
  ];

  // --- PERSISTENCE EFFECT ---
  useEffect(() => {
    localStorage.setItem("gts_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("gts_logs", JSON.stringify(logs));
  }, [logs]);

  // --- INITIAL DATA LOADING ---
  useEffect(() => {
    fetchQuestion();
    fetchAIStatus();
    fetchGlobalFeed();
  }, []);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchAIStatus = async () => {
    try {
      const res = await fetch("/api/ai-status");
      const data = await res.json();
      setAiActive(data.active);
      setAiMessage(data.message);
    } catch (e) {
      console.error("AI check error", e);
    }
  };

  const fetchQuestion = async () => {
    setLoadingQuestion(true);
    try {
      const res = await fetch("/api/current-question");
      const data = await res.json();
      if (data.question) {
        setQuestion(data.question);
        setCurrentIsAlternative(false);
      }
    } catch (e) {
      setQuestion("Bugün seni en çok ne mutlu etti ya da gülümsetti?");
    } finally {
      setLoadingQuestion(false);
    }
  };

  const generateAlternativeQuestion = async () => {
    setLoadingQuestion(true);
    try {
      const res = await fetch("/api/generate-alt-question", {
        method: "POST"
      });
      const data = await res.json();
      if (data.question) {
        setQuestion(data.question);
        setCurrentIsAlternative(true);
        setAltSource(data.source || "Gemini AI");
        showToast("Gemini yeni derin bir soru fısıldadı...", "success");
      }
    } catch (e) {
      showToast("Önerilen soru yüklenemedi, varsayılan soruya dönüldü.", "info");
      fetchQuestion();
    } finally {
      setLoadingQuestion(false);
    }
  };

  const fetchGlobalFeed = async () => {
    setLoadingGlobalFeed(true);
    try {
      const res = await fetch("/api/global-feed");
      const data = await res.json();
      setGlobalFeed(data);
    } catch (e) {
      console.error("Global feed fetch outline failed", e);
    } finally {
      setLoadingGlobalFeed(false);
    }
  };

  // --- STREAK CALCULATION ---
  const recalculateStreak = (allLogs: DailyLog[]) => {
    if (allLogs.length === 0) {
      return { streak: 0, maxStreak: profile.maxStreak };
    }

    // Sort unique dates descending
    const dates = Array.from(new Set(allLogs.map(l => l.date))).sort((a, b) => b.localeCompare(a));
    const today = getTodayDateString();
    
    // Check if yesterday is the starting point or today
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

    // If the latest answer is neither today nor yesterday, streak is broken
    const latestDate = dates[0];
    if (latestDate !== today && latestDate !== yesterdayStr) {
      return { streak: 0, maxStreak: profile.maxStreak };
    }

    let currentStreakCount = 1;
    let checkDateString = latestDate;

    for (let i = 1; i < dates.length; i++) {
      const currentD = new Date(checkDateString);
      currentD.setDate(currentD.getDate() - 1);
      const prevExpectedDateStr = currentD.toISOString().split("T")[0];

      if (dates[i] === prevExpectedDateStr) {
        currentStreakCount++;
        checkDateString = dates[i];
      } else {
        break;
      }
    }

    const nextMaxStreak = Math.max(currentStreakCount, profile.maxStreak);
    return { streak: currentStreakCount, maxStreak: nextMaxStreak };
  };

  // --- FORM SUBMISSION ---
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmoji) {
      showToast("Lütfen hissini anlatan bir emoji seç.", "info");
      return;
    }
    if (!answerText.trim()) {
      showToast("Lütfen en az bir kelimeyle de olsa bugününü aktar.", "info");
      return;
    }

    setIsSubmitting(true);
    const newEntry: DailyLog = {
      id: Math.random().toString(36).substring(2, 9),
      date: todayStr,
      question: question,
      text: answerText,
      emoji: selectedEmoji,
      score: moodScore,
      ageRange: profile.ageRange,
      country: profile.country,
      isCustomQuestion: currentIsAlternative
    };

    // Update Logs
    const cleanedLogs = logs.filter(l => l.date !== todayStr); // replace if already exists
    const updatedLogs = [newEntry, ...cleanedLogs];
    
    // Calculate Streak
    const streakResult = recalculateStreak(updatedLogs);

    // Update local state
    setLogs(updatedLogs);
    setProfile(prev => ({
      ...prev,
      lastDateAnswered: todayStr,
      streak: streakResult.streak,
      maxStreak: streakResult.maxStreak
    }));

    // Post to global feed anonymously if selected
    if (shareGlobally) {
      try {
        await fetch("/api/global-feed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionText: question,
            text: answerText,
            emoji: selectedEmoji,
            score: moodScore,
            ageRange: profile.ageRange,
            country: profile.country
          })
        });
        fetchGlobalFeed(); // Refresh global feed
      } catch (err) {
        console.error("Failed to share entry to feed:", err);
      }
    }

    setIsSubmitting(false);
    showToast("Bugünkü anın güvenle zihnine ve günlüğüne işlendi. 🌟", "success");
  };

  // Delete an entry
  const handleDeleteEntry = (id: string, date: string) => {
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    
    const streakResult = recalculateStreak(updated);
    setProfile(prev => ({
      ...prev,
      lastDateAnswered: date === todayStr ? null : prev.lastDateAnswered,
      streak: streakResult.streak,
      maxStreak: streakResult.maxStreak
    }));

    showToast("Günlük kaydı silindi.", "info");
  };

  // --- SUBMIT USER ONBOARDING ---
  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) {
      showToast("Lütfen bir isim girin.", "info");
      return;
    }
    const updatedProfile = {
      ...profile,
      name: tempName.trim(),
      ageRange: tempAge,
      country: tempCountry
    };
    setProfile(updatedProfile);
    setIsOnboarded(true);
    localStorage.setItem("gts_onboarded", "true");
    showToast(`Hoş geldin, ${tempName.trim()}! Zihnini dinlendirmeye hazır mısın?`, "success");
  };

  // Toggle pricing / support premium simulation
  const handleUnlockPremium = () => {
    setProfile(prev => ({ ...prev, isPremium: !prev.isPremium }));
    showToast(
      !profile.isPremium 
        ? "Deneyiminiz başarıyla Premium'a yükseltildi! Tüm soru paketleri ve analizler açıldı." 
        : "Premium üyeliğiniz sonlandırıldı. Reklamsız minimalist sürüme dönüldü.", 
      "success"
    );
  };

  // --- AI ANALYSIS ANALYSIS TRIGGER ---
  const handlePerformAIAnalysis = async () => {
    if (logs.length < 2) {
      showToast("Ruh halini derinlemesine analiz edebilmem için en az 2 farklı günlük kaydına ihtiyacım var.", "info");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch("/api/analyze-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: logs })
      });
      
      if (!res.ok) {
        throw new Error("Sunucu analiz isteğini yanıtlayamadı.");
      }

      const data: AIAnalysisResult = await res.json();
      setAiAnalysis(data);
      localStorage.setItem("gts_latest_analysis", JSON.stringify(data));
      showToast("Ruhsal rehberiniz analizini tamamladı ve bilge bir mektup bıraktı.", "success");
    } catch (e: any) {
      console.error("Analysis error", e);
      setAnalysisError("Farkındalık analizi şu aşamada gerçekleştirilemedi. Lütfen daha sonra tekrar deneyiniz.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export logs to Markdown
  const handleExportMarkdown = () => {
    if (logs.length === 0) {
      showToast("Dışa aktaracak bir geçmişiniz bulunmamaktadır.", "info");
      return;
    }

    let md = `# Günün Tek Sorusu - Mikro Günlüğüm\n`;
    md += `Yazar: ${profile.name || "Sevgili Kullanıcı"}\n`;
    md += `Oluşturulma Tarihi: ${new Date().toLocaleDateString("tr-TR")}\n`;
    md += `Toplam Günlük Sayısı: ${logs.length} | Maksimum Seri: ${profile.maxStreak} gün\n\n`;
    md += `----\n\n`;

    logs.forEach(log => {
      md += `## 📅 ${new Date(log.date).toLocaleDateString("tr-TR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
      md += `**Soru:** ${log.question}\n`;
      md += `**Cevap:** ${log.text}\n`;
      md += `**His / Emoji:** ${log.emoji} (${log.score}/5)\n`;
      if (log.isCustomQuestion) {
        md += `*Not: Bu soru Gemini AI tarafından özel üretilmiştir.*\n`;
      }
      md += `\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `gunun_tek_sorusu_kitabim_${new Date().getFullYear()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("2026 Günlük Kitabınız (.MD formatında) başarıyla dışa aktarıldı!", "success");
  };

  // Simulating custom question packs for users
  const QUESTION_PACKS = [
    { name: "Genel Farkındalık", description: "Hayatın saklı küçük neşelerini ve şükran verici minnettarlıkları keşfetmek için sakin sorular.", icon: Smile, free: true },
    { name: "İlişkiler ve Sevgi", description: "Çevrendekilerle kurduğun bağları, sevgiyi ve tatlı anıları güçlendirici paylaşımlar.", icon: Heart, free: true },
    { name: "Zihinsel Berraklık ve Kariyer", description: "Günün yorgunluğunu silen, üretkenliği ve kendinde gurur duyduğun anları odağa alan sorgular.", icon: Briefcase, free: true },
    { name: "Filozofun Seyir Defteri", description: "Büyük felsefi bakış açıları, kozmik kabuller ve hayata dair samimi düşündürücü derin anlar.", icon: Compass, free: true }
  ];

  // Helper date rendering
  const formatFriendlyDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div id="root" className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-100">
      
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-950/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-amber-950/10 rounded-full filter blur-[150px] pointer-events-none" />

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm max-w-md backdrop-blur-md ${
              toast.type === "success" 
                ? "bg-emerald-950/80 text-emerald-200 border-emerald-500/30" 
                : "bg-neutral-900/90 text-amber-200 border-amber-500/20"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN LAYOUT HEADER */}
      <header className="border-b border-neutral-900 bg-neutral-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <span className="font-serif text-xl font-bold text-neutral-950">1</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight font-sans flex items-center gap-2">
                Günün Tek Sorusu 
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase tracking-widest leading-none">
                  Farkındalık
                </span>
              </h1>
              <p className="text-xs text-neutral-400">Şükran ve Sade Yaşam Günlüğü</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak display */}
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-sm select-none" title="Mevcut Günlük Cevaplama Serisi">
              <Flame className={`w-4 h-4 ${profile.streak > 0 ? "text-amber-500 fill-amber-500 animate-pulse" : "text-neutral-500"}`} />
              <span className="font-mono font-bold">{profile.streak} gün</span>
            </div>

            {/* Free Tier Badge */}
            <div className="text-xs px-3 py-1.5 rounded-lg border bg-emerald-950/40 text-emerald-300 border-emerald-500/20 flex items-center gap-1.5 select-none font-bold">
              <Sparkles className="w-3.5 h-3.5 fill-emerald-300/20 text-emerald-300" />
              Sınırsız Free Tier
            </div>
          </div>
        </div>
      </header>

      {/* ONBOARDING MODAL / CARD */}
      {!isOnboarded && (
        <div className="fixed inset-0 bg-neutral-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl max-w-md w-full shadow-2xl relative"
          >
            <div className="absolute top-4 right-4 text-xs text-neutral-500 font-mono">
              2026 Günlüğü
            </div>
            
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-6">
              <Smile className="w-8 h-8 text-neutral-950" />
            </div>

            <h2 className="text-2xl font-serif font-bold text-neutral-100 mb-2">Görünüşe göre yenisin.</h2>
            <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
              Bu uygulama; zihnini yormayan, karmaşık analizler ve onboarding adımları barındırmayan minimalist bir sığınaktır. 
              Sadece her gün sana sunulan tek bir temel soruya 15 saniyede içten bir yanıt vermen istenir. Kendine bu iyiliği yap.
            </p>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Nasıl Seslenelim? (Mahlas veya İsim)</label>
                <input 
                  type="text" 
                  placeholder="Gizemli Düşünür" 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  maxLength={25}
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 px-4 py-3 rounded-xl focus:border-emerald-500 outline-none text-neutral-200 text-sm tracking-wide transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Yaş Aralığı</label>
                  <select 
                    value={tempAge}
                    onChange={(e) => setTempAge(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2.5 rounded-xl focus:border-emerald-500 outline-none text-neutral-300 text-sm transition-all"
                  >
                    <option value="Altı / Çocuk">Çocuk (&lt;18)</option>
                    <option value="18-24">18 - 24</option>
                    <option value="25-34">25 - 34</option>
                    <option value="35-44">35 - 44</option>
                    <option value="45-54">45 - 54</option>
                    <option value="55-64">55 - 64</option>
                    <option value="65+">65 &amp; Üstü</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Bulunduğun Ülke</label>
                  <input 
                    type="text" 
                    placeholder="Türkiye" 
                    value={tempCountry}
                    onChange={(e) => setTempCountry(e.target.value)}
                    maxLength={20}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-xl focus:border-emerald-500 outline-none text-neutral-300 text-sm transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/20 mt-2 hover:scale-[1.01]"
              >
                Bilgeliği Başlat
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* CORE FRAMEWORK TABS */}
      <nav className="max-w-4xl mx-auto px-4 mt-6 w-full flex border-b border-neutral-900/60 text-sm">
        <button 
          onClick={() => setActiveTab("bugun")}
          className={`px-4 py-3 font-medium transition-all relative ${
            activeTab === "bugun" ? "text-emerald-400 font-semibold" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Bugünün Sorusu
          {activeTab === "bugun" && (
            <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
          )}
        </button>

        <button 
          onClick={() => setActiveTab("gunluk")}
          className={`px-4 py-3 font-medium transition-all relative ${
            activeTab === "gunluk" ? "text-emerald-400 font-semibold" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Mikro Günlüğüm ({logs.length})
          {activeTab === "gunluk" && (
            <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
          )}
        </button>

        <button 
          onClick={() => setActiveTab("kesfet")}
          className={`px-4 py-3 font-medium transition-all relative ${
            activeTab === "kesfet" ? "text-emerald-400 font-semibold" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Anonim Global Akış
          {activeTab === "kesfet" && (
            <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
          )}
        </button>

        <button 
          onClick={() => setActiveTab("premium")}
          className={`px-4 py-3 font-medium transition-all relative ${
            activeTab === "premium" ? "text-emerald-400 font-semibold" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Faydalı Araçlar (Free)
          {activeTab === "premium" && (
            <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
          )}
        </button>
      </nav>

      {/* CORE BODY CONTAINER */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full flex flex-col gap-6">
        
        {/* TAB 1: TODAY'S QUESTION */}
        {activeTab === "bugun" && (
          <div className="flex flex-col gap-6">
            
            {/* MAIN MINDFULNESS QUESTION BLOCK */}
            <div className="bg-gradient-to-b from-neutral-900 to-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl">
              
              {/* Backlit glow indicator */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />

              {/* Status information banner */}
              <div className="flex items-center justify-between mb-4 text-xs font-mono text-neutral-400 border-b border-neutral-800/40 pb-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{new Date().toLocaleDateString("tr-TR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                {todayLog ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Bugün Tamamlandı!
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    🟢 Bekliyor
                  </span>
                )}
              </div>

              {/* Question Text */}
              {loadingQuestion ? (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  <p className="text-neutral-400 text-sm font-serif italic">Günün bilgelik sorusu demleniyor...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-[11px] uppercase tracking-widest text-emerald-400/80 font-mono">Günün Tek Sorusu</div>
                  <h2 className="text-2xl md:text-3xl font-serif font-semibold text-white leading-relaxed italic pr-4">
                    “{question}”
                  </h2>
                  
                  {currentIsAlternative && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-950 text-[10px] text-amber-300 font-mono border border-amber-500/10">
                      <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                      Alternatif Rehber Soru ({altSource})
                    </div>
                  )}
                </div>
              )}

              {/* ACTION: GENERATE ALTERNATIVE IF NOT ANSWERED */}
              {!todayLog && !loadingQuestion && (
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={generateAlternativeQuestion}
                    className="text-xs text-neutral-400 hover:text-emerald-400 font-mono flex items-center gap-1.5 transition-colors bg-neutral-950/60 px-3 py-1.5 rounded-lg border border-neutral-800/20 hover:border-emerald-500/25"
                    title="Bu soru bugün sana uzak geliyorsa, Gemini'den senin için yepyeni bir soru yaratmasını isteyebilirsin."
                  >
                    <RefreshCw className="w-3 h-3" />
                    Farklı Bir Soru İster misin? (AI)
                  </button>
                </div>
              )}
            </div>

            {/* IF UNANSWERED: SHOW ANSWER FORM */}
            {!todayLog ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900 border border-neutral-800 p-6 md:p-8 rounded-2xl shadow-lg"
              >
                <form onSubmit={handleSaveEntry} className="space-y-6">
                  
                  {/* STEP 1: PICK EMOTICON / MOOD */}
                  <div>
                    <span className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-3">1. Şu Anki Halini Bir Sembolle Taçlandır</span>
                    <div className="grid grid-cols-5 gap-2 md:gap-3">
                      {EMOJI_LIST.map((emoji) => {
                        const isSelected = selectedEmoji === emoji.char;
                        return (
                          <button
                            key={emoji.char}
                            type="button"
                            onClick={() => {
                              setSelectedEmoji(emoji.char);
                              setMoodScore(emoji.score);
                            }}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                              isSelected 
                                ? "bg-emerald-950/40 border-emerald-400 shadow-lg shadow-emerald-500/10 scale-105" 
                                : "bg-neutral-950 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                            }`}
                          >
                            <span className="text-3xl md:text-4xl mb-1.5 filter drop-shadow select-none">{emoji.char}</span>
                            <span className={`text-[10px] md:text-xs text-center font-medium ${isSelected ? "text-emerald-300" : "text-neutral-400"}`}>
                              {emoji.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* STEP 2: WRITE ANSWER BOX */}
                  <div>
                    <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">2. Sadece Bir Cümleyle Cevapla (Günü Özetle)</label>
                    <div className="relative">
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        maxLength={200}
                        placeholder="Zihnini serbest bırak ve buraya dökülmesini izle... (Maksimum 200 karakter, bir iki sözcük bile yeterli)"
                        rows={3}
                        required
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none text-neutral-200 placeholder:text-neutral-600 text-sm md:text-base leading-relaxed tracking-wide transition-all resize-none"
                      />
                      <div className="absolute bottom-3 right-3 text-[10px] font-mono text-neutral-500">
                        {answerText.length}/200
                      </div>
                    </div>
                  </div>

                  {/* OPTIONAL SLIDER */}
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/40">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-mono text-neutral-400">Ruh Hali Netliği</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">{moodScore}/5</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      value={moodScore} 
                      onChange={(e) => setMoodScore(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
                      <span>Durgun/Yorgun</span>
                      <span>Huzurlu/Görkemli</span>
                    </div>
                  </div>

                  {/* SETTINGS AND GLOBAL FEED SHARE */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                    <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs text-neutral-400 select-none">
                      <input 
                        type="checkbox" 
                        checked={shareGlobally}
                        onChange={(e) => setShareGlobally(e.target.checked)}
                        className="rounded border-neutral-800 accent-emerald-500 bg-neutral-950 text-neutral-200"
                      />
                      <span>Cevabımı anonim global akışta paylaş (Diğer insanlara sessiz bir yoldaşlık bağı)</span>
                    </label>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 border border-emerald-400 hover:scale-[1.02] active:scale-95 text-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Zihne İşleniyor...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          Günü Kaydet
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </motion.div>
            ) : (
              // ANSWERED STATE SUCCESS BOX
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neutral-900 border border-emerald-500/20 p-6 md:p-8 rounded-2xl relative overflow-hidden shadow-xl"
              >
                {/* Floating Confetti style check */}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 text-emerald-500/5 select-none font-serif text-[180px] leading-none select-none pointer-events-none">
                  {todayLog.emoji}
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-4xl filter drop-shadow select-none mt-1">
                    {todayLog.emoji}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                        Bugünün Günlüğü Kaydedildi
                      </span>
                      <span className="text-xs text-neutral-500 font-mono">
                        {todayStr}
                      </span>
                    </div>
                    <div className="text-sm italic text-neutral-400 font-medium">
                      “{todayLog.question}”
                    </div>
                    <p className="text-neutral-100 text-base md:text-lg leading-relaxed font-sans font-normal pl-3 border-l-2 border-emerald-500/30">
                      {todayLog.text}
                    </p>

                    <div className="pt-4 flex items-center gap-3">
                      <button 
                        onClick={() => handleDeleteEntry(todayLog.id, todayLog.date)}
                        className="text-xs text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1 font-mono"
                      >
                        <X className="w-3 h-3" /> Sil &amp; Yeniden Yaz
                      </button>
                      <span className="text-neutral-800 text-[10px] font-mono">|</span>
                      <span className="text-xs text-neutral-500 font-mono flex items-center gap-1">
                        Duygu Puanlaması: <span className="text-emerald-400 font-bold">{todayLog.score}/5</span>
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STREAK & CALENDAR STATS DOCK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* STREAK COUNTERS */}
              <div className="bg-neutral-900/60 border border-neutral-850 p-5 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-300">Seri Takipçisi</h3>
                  <p className="text-xs text-neutral-400 mt-1">Günü kaçırmadan her gün 10 saniye.</p>
                  
                  <div className="flex gap-4 mt-3">
                    <div>
                      <span className="block text-2xl font-bold text-amber-400 font-mono">{profile.streak}</span>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Güncel Seri</span>
                    </div>
                    <div className="border-r border-neutral-800"></div>
                    <div>
                      <span className="block text-2xl font-bold text-emerald-400 font-mono">{profile.maxStreak}</span>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Maks Seri</span>
                    </div>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${profile.streak > 0 ? "bg-amber-500/10 text-amber-500" : "bg-neutral-800 text-neutral-600"}`}>
                  <Flame className="w-6 h-6" />
                </div>
              </div>

              {/* CALENDAR VISUALIZED GRID (LAST 14 DAYS) */}
              <div className="bg-neutral-900/60 border border-neutral-850 p-5 rounded-xl">
                <span className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">Farkındalık Zinciri (Son 14 Gün)</span>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 14 }).map((_, idx) => {
                    // Compute past dates
                    const d = new Date();
                    d.setDate(d.getDate() - (13 - idx));
                    const dStr = d.toISOString().split("T")[0];
                    const hasLogged = logs.some(l => l.date === dStr);
                    const isFocusDay = dStr === todayStr;

                    return (
                      <div 
                        key={idx} 
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center border text-[9px] font-mono relative transition-all ${
                          hasLogged 
                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow shadow-emerald-500/5 font-bold" 
                            : isFocusDay 
                              ? "bg-neutral-950 border-amber-500/30 text-amber-400 font-semibold"
                              : "bg-neutral-950/40 border-neutral-900 text-neutral-500"
                        }`}
                        title={`${d.toLocaleDateString("tr-TR")} : ${hasLogged ? "Yanıtlandı" : "Sessizlik"}`}
                      >
                        <span>{d.getDate()}</span>
                        {hasLogged && (
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-end gap-3 mt-2 text-[10px] text-neutral-500 font-mono">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" /> Yanıtlandı</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-neutral-900 border border-neutral-800 rounded-full inline-block" /> Boş</span>
                </div>
              </div>

            </div>

            {/* QUICK AI INSIGHT AD */}
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex gap-3 items-start">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 fill-indigo-400/20" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Gemini AI Ruh Hali Analisti</h4>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    Yazdığın her samimi cümle, senin iç dünyana ait birer fırça darbesi. 2 veya daha fazla günlüğü tamamladıktan sonra, birikmiş anılarını derin kozmik analizimize gönderebilirsin.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab("gunluk")}
                className="text-xs whitespace-nowrap bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-800/40 px-4 py-2 rounded-lg transition-colors"
              >
                Analize Git →
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: MY LOG HISTORY (DIARY) */}
        {activeTab === "gunluk" && (
          <div className="space-y-6">
            
            {/* AI MIND COACH DOCK */}
            <div className="bg-gradient-to-r from-neutral-900 to-indigo-950/20 border border-indigo-500/20 p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 fill-indigo-500/30 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Haftalık Gemini Farkındalık Analizi</h3>
                    <p className="text-xs text-neutral-400">Günlüklerinden anlamlı kozmik desenler çıkarır.</p>
                  </div>
                </div>
                <button 
                  onClick={handlePerformAIAnalysis}
                  disabled={isAnalyzing || logs.length < 2}
                  className={`text-xs px-4 py-2 rounded-xl font-medium transition-all ${
                    logs.length < 2
                      ? "bg-neutral-950 text-neutral-600 border border-neutral-900 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400 hover:scale-[1.01]"
                  }`}
                >
                  {isAnalyzing ? "Mektup Yazılıyor..." : "Analiz Et (Gemini)"}
                </button>
              </div>

              {logs.length < 2 && (
                <p className="text-xs text-neutral-500 bg-neutral-950/40 p-3 rounded-lg border border-neutral-900 flex items-center gap-1.5 leading-relaxed">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Geri bildirim vermem için zihninde en az iki farklı güne ait hatıra birikmeli. Bugünün ve dünün sorusunu yanıtlamaya ne dersin? (Şu anki kayıt sayın: {logs.length}/2)
                </p>
              )}

              {analysisError && (
                <div className="text-xs text-red-400 bg-red-950/20 p-3 rounded-lg border border-red-500/15">
                  {analysisError}
                </div>
              )}

              {/* EXPERT ANALYSIS PRESENTATION PANEL */}
              {aiAnalysis && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-neutral-950 rounded-xl p-5 border border-indigo-500/10 space-y-4 relative"
                >
                  <div className="absolute top-4 right-4 text-[10px] font-mono text-neutral-600">
                    {aiAnalysis.isSimulated ? "Serbest Demo Analizi" : "Gemini Analizi"}
                  </div>
                  
                  {/* Title of the sentiment theme */}
                  <div>
                    <span className="text-[10px] uppercase font-mono text-indigo-400 tracking-wider">Haftanın Ruhsal Atmosferi</span>
                    <h4 className="text-lg font-serif font-semibold text-neutral-100 flex items-center gap-1.5">
                      🎨 {aiAnalysis.sentimentTheme}
                    </h4>
                  </div>

                  <p className="text-neutral-300 text-sm italic leading-relaxed font-sans border-l-2 border-indigo-500/30 pl-4 py-1">
                    “{aiAnalysis.feedback}”
                  </p>

                  <div className="bg-neutral-900/60 p-3.5 rounded-lg border border-neutral-850/60 text-xs italic text-indigo-200 font-serif leading-relaxed text-center">
                    {aiAnalysis.quote}
                  </div>
                </motion.div>
              )}
            </div>

            {/* EXPORT AND BAR CONTROL */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif font-semibold">Mikro Kayıtlarım ({logs.length} Giriş)</h3>
              {logs.length > 0 && (
                <button 
                  onClick={handleExportMarkdown}
                  className="text-xs text-neutral-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-mono border border-neutral-800 bg-neutral-900 px-3 py-1.5 rounded-lg"
                  title="Tüm geçmişini Markdown dosyası olarak indirip yıl sonu şükran günlüğü kitabına dönüştür."
                >
                  <Download className="w-3.5 h-3.5" />
                  Milli Kitabım (.MD)
                </button>
              )}
            </div>

            {/* LIST ENTRIES */}
            {logs.length === 0 ? (
              <div className="bg-neutral-900/40 border border-neutral-900 px-6 py-12 text-center rounded-2xl flex flex-col items-center justify-center gap-4">
                <BookOpen className="w-10 h-10 text-neutral-700 stroke-[1.5]" />
                <div>
                  <h4 className="text-sm font-semibold text-neutral-300">Henüz bir hatıra birikmemiş.</h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                    Bugünün sorusunu yanıtlayarak zihinsel mikro günlüğüne ilk tohumları saçabilirsin.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab("bugun")}
                  className="mt-2 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg hover:bg-emerald-500/20 transition-all font-semibold"
                >
                  Günü Değerlendir
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="bg-neutral-900/70 border border-neutral-800/60 rounded-xl p-5 hover:border-neutral-850 transition-all relative group flex flex-col md:flex-row gap-4 items-start">
                    
                    {/* Visual Stamp badge */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-950 border border-neutral-850 shrink-0 w-16 text-center select-none">
                      <span className="text-3xl filter drop-shadow mb-1">{log.emoji}</span>
                      <span className="text-[10px] font-mono text-neutral-500">{log.score}/5 Mood</span>
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                        <span>{formatFriendlyDate(log.date)}</span>
                        
                        {log.isCustomQuestion && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/10 leading-none">
                            Gemini AI Sorusu
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-serif font-semibold text-neutral-400 italic">
                        “{log.question}”
                      </h4>
                      <p className="text-neutral-100 text-sm md:text-base leading-relaxed tracking-wide font-normal">
                        {log.text}
                      </p>

                      <div className="pt-2 flex items-center gap-3">
                        <button 
                          onClick={() => handleDeleteEntry(log.id, log.date)}
                          className="text-xs text-neutral-500 hover:text-red-400 font-mono transition-colors opacity-80 hover:opacity-100 flex items-center gap-0.5"
                        >
                          <X className="w-3 h-3" /> Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GLOBAL ANONYMOUS FEED (DISCOVER) */}
        {activeTab === "kesfet" && (
          <div className="space-y-6">
            
            <div className="bg-neutral-900/60 p-5 rounded-xl border border-neutral-850 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-neutral-200">Anonim Küresel Şükran Akışı</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                  Dünyanın dört bir yanından katılan insanların bugün kendilerini gülümseten anıları. İsimsiz, yargısız, saf şefkat bağı.
                </p>
              </div>
              <button 
                onClick={fetchGlobalFeed}
                className="text-xs text-neutral-300 hover:text-emerald-400 font-mono border border-neutral-800 bg-neutral-900 px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Akışı Yenile
              </button>
            </div>

            {loadingGlobalFeed ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm font-serif italic text-neutral-400">Yeryüzündeki samimi sesler toplanıyor...</p>
              </div>
            ) : globalFeed.length === 0 ? (
              <div className="bg-neutral-900 p-8 text-center rounded-xl text-neutral-500">
                Henüz küresel akışta paylaşım bulunmamaktadır. İlk adımı sen at!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {globalFeed.map((item) => {
                  const hasLiked = likedFeedItems[item.id] || false;
                  const hasSupported = supportedFeedItems[item.id] || false;

                  return (
                    <div key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-750 transition-all flex flex-col justify-between relative overflow-hidden">
                      
                      <div className="space-y-3">
                        {/* Meta information tags */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                          <div className="flex items-center gap-1.5 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850">
                            <span>{item.ageRange} Yaş</span>
                            <span>•</span>
                            <span>📍 {item.country}</span>
                          </div>
                          <span>{new Date(item.timestamp).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Question reference */}
                        <div className="text-[11px] italic text-neutral-400 font-serif leading-tight">
                          “{item.questionText}”
                        </div>

                        {/* Answer text */}
                        <p className="text-neutral-100 text-sm leading-relaxed tracking-wide font-normal">
                          {item.text}
                        </p>
                      </div>

                      {/* Controls and hearts row */}
                      <div className="pt-4 border-t border-neutral-800/40 mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl filter drop-shadow" title="Ruh Hali Emojisi">
                            {item.emoji}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500 font-medium bg-neutral-950 px-1.5 py-0.5 rounded">
                            {item.score}/5 Mood
                          </span>
                        </div>

                        {/* Safe anonymous user connection interactions */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setLikedFeedItems(prev => ({ ...prev, [item.id]: !hasLiked }));
                              showToast(hasLiked ? "Beğeni kaldırıldı." : "Kalp yolladınız. Sessizce gülümsediler. ✨", "success");
                            }}
                            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                              hasLiked 
                                ? "bg-red-950/40 text-red-300 border-red-500/30 font-semibold" 
                                : "bg-neutral-950 hover:bg-neutral-900 text-neutral-400 border-neutral-850 hover:border-neutral-700"
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${hasLiked ? "fill-red-400 text-red-400 animate-pulse" : ""}`} />
                            <span>{hasLiked ? "Beğendin" : "Beğen"}</span>
                          </button>

                          <button 
                            onClick={() => {
                              setSupportedFeedItems(prev => ({ ...prev, [item.id]: !hasSupported }));
                              showToast(hasSupported ? "Teşekkür geri alındı." : "Karşıdaki düşünürün gününe bir çiçek bıraktınız! 🌸", "success");
                            }}
                            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                              hasSupported 
                                ? "bg-amber-950/40 text-amber-300 border-amber-500/30" 
                                : "bg-neutral-950 hover:bg-neutral-900 text-neutral-400 border-neutral-850 hover:border-neutral-700"
                            }`}
                          >
                            <span>🌸</span>
                            <span>{hasSupported ? "Çiçek Yollandı" : "Çiçek Bırak"}</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PREMIUM AREA */}
        {activeTab === "premium" && (
          <div className="space-y-6">
            
            {/* INTRO HERO BANNER */}
            <div className="bg-gradient-to-br from-emerald-950/20 via-neutral-900 to-neutral-900 border border-emerald-500/20 p-6 md:p-8 rounded-2xl relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />
              
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase tracking-widest font-bold">
                100% Ücretsiz & Sınırsız Sürüm
              </span>

              <h3 className="text-xl md:text-2xl font-serif font-bold text-neutral-100 mt-3 mb-2">
                Sıkıntısız ve Engelsiz Farkındalık Özellikleri
              </h3>
              
              <p className="text-neutral-400 text-sm max-w-xl leading-relaxed">
                Herkesin zihinsel bütünlüğe, içsel huzura ve şükran dolu bir yaşama engelsiz erişim hakkı olduğuna inanıyoruz. Tüm gelişmiş defter döküm araçları, aile modülleri ve tematik farkındalık konuları ömür boyu tamamen ücretsizdir.
              </p>
            </div>

            {/* PRIVILEGES LIST (BENTO BOX OR MINI GRID) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* PRIVILEGE 1: MD/PDF BOOKEXPORT */}
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex flex-col justify-between relative overflow-hidden">
                
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-semibold">Benim 2026 Kitabım</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Tüm yıl boyunca yazdığın günlük girişlerini derle, kronolojik olarak biçimlendirilmiş bir kitaba dönüştür. Kendine verebileceğin en sakin hediye.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-850">
                  <button 
                    onClick={handleExportMarkdown}
                    className="w-full text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-1.5 rounded-lg border border-emerald-500/20 transition-all font-mono"
                  >
                    Şimdi Kitabı İndir (.MD)
                  </button>
                </div>
              </div>

              {/* PRIVILEGE 2: FAMILY ROOM DEMO */}
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex flex-col justify-between relative overflow-hidden">

                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-semibold">Aile Akşam Alanı</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Eşinin, çocuğunun veya yaşlı ebeveynlerinin her akşam aynı soruya verdiği cevapları görün. Kuşaklar arası sakin, içten bir sohbet başlatıcı.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-850">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-2">Simüle Edilmiş Aile Alanı</span>
                  <div className="space-y-1 bg-neutral-950 p-2 rounded border border-neutral-855 text-[10px] text-neutral-400 italic">
                    <div>🧑 Babam: "Torunumla parkta yürüdüm."</div>
                    <div>👩 Annem: "Enfes bir kurabiye kokusu öğrendim."</div>
                  </div>
                </div>
              </div>

              {/* PRIVILEGE 3: DIFFERENT CHANNELS OF QUESTIONS */}
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex flex-col justify-between relative overflow-hidden">

                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-semibold">Tematik Soru Odakları</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Sadece genel farkındalık değil; kariyerde gururlu anlar, ikili ilişkilerin şifa bulması veya Stoacı felsefi yaklaşımlarla derinleşen sorular.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-850 space-y-1.5">
                  <span className="text-[10px] font-mono text-neutral-500 block">Soru Kategorisi Seç</span>
                  <div className="flex flex-wrap gap-1">
                    {["Felsefe", "İlişkiler", "Metanet"].map((p) => (
                      <button 
                        key={p}
                        onClick={() => {
                          setSelectedPack(p);
                          showToast(`${p} odaklı soru demliği aktif edildi.`, "success");
                        }}
                        className={`text-[9px] px-2 py-0.5 rounded border ${
                          selectedPack === p 
                            ? "bg-amber-950/40 text-amber-300 border-amber-500/30" 
                            : "bg-neutral-950 text-neutral-400 border-neutral-850 hover:border-neutral-800"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* DETAILED FAQ REHABILITATION */}
            <div className="bg-neutral-900/40 border border-neutral-900 p-6 rounded-xl space-y-4">
              <h4 className="text-sm font-serif font-semibold text-neutral-200">Sıkça Sorulan Bazı Şeyler</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-neutral-400">
                <div className="space-y-1">
                  <strong className="text-neutral-300 block">Giriş yaptıktan sonra anılarım kaybolur mu?</strong>
                  <p>
                    Hayır. Tüm anıların şifreli bir biçimde tarayıcının yerel hafızasında (`localStorage`) saklanır, sunucumuza asla senin açık kimliğinle kaydedilmez. Akıştaki paylaşımlar ise tamamen anonimdir.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-neutral-300 block">Gemini AI alternatif soruları nasıl üretiyor?</strong>
                  <p>
                    Uygulamamızın sunucusunda çalışan @google/genai SDK motoru, şükran terapisi felsefesini temel alarak her isteğinde sana özel, canlandırıcı, sıcak ve felsefi bir derin soru üretir.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* DETAILED MINIMAL FOOTER OUTLINE */}
      <footer className="border-t border-neutral-900 bg-neutral-950/40 text-neutral-600 text-xs py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-serif italic text-neutral-500">“Gün içindeki o küçük 10 saniye, zihnindeki gürültüyü sakinleştirmeye yeter.”</p>
            <p className="text-[10px]">&copy; 2026 Günün Tek Sorusu • Tüm Hakları Yerel Hafızanda Saklıdır.</p>
          </div>
          
          <div className="flex items-center gap-4 text-[10px] font-mono">
            <span className="flex items-center gap-1.5 text-neutral-500" title="Gemini AI Integration Status check">
              <div className={`w-2 h-2 rounded-full ${aiActive ? "bg-emerald-500 animate-pulse" : "bg-neutral-700"}`} />
              AI: {aiActive ? "Aktif (Gemini 3.5)" : "Sınırlı (Simüle)"}
            </span>
            <span className="text-neutral-800">|</span>
            <span className="text-neutral-500">Mahlas: {profile.name || "Anonim"}</span>
            <span className="text-neutral-800">|</span>
            <span className="text-neutral-500">{profile.ageRange}, {profile.country}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
