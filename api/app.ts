import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Lazy-loaded Google Gen AI client to prevent crash if GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Fixed Question Pool - Beautiful Turkish mindfulness questions
const QUESTION_POOL = [
  "Bugün seni en çok ne mutlu etti ya da gülümsetti?",
  "Bugün hayatına dair öğrendiğin en önemli şey neydi?",
  "Bugün kime veya neye içten bir teşekkür borçlusun?",
  "Bugün seni en çok heyecanlandıran ya da motive eden an hangisiydi?",
  "Kendinde bugün gurur duyduğun tek bir davranış veya karar seç desek, ne olurdu?",
  "Bugün ruhunu dinlendiren, sana huzur veren küçük bir anı hatırla. Nedir o?",
  "Bugün karşılaştığın bir zorluk karşısında nasıl bir güç sergiledin?",
  "Bugün aldığın en anlamlı söz, mesaj veya geri bildirim neydi?",
  "Eğer bugünün tablosunu bir renk ile çizseydin, hangi rengi seçerdin ve neden?",
  "Bugün hiç fark etmeden bir başkasının gününü güzelleştirdin mi?",
  "Bugün hissettiğin en belirgin duygu neydi ve bu sana ne anlatıyor?",
  "Bugün kendine ayırdığın o en tatlı 5 dakikada ne yaptın?",
  "Bugün doğada, çevrende veya gökyüzünde dikkatini çeken en güzel detay neydi?",
  "Yarını bugün olduğundan biraz daha huzurlu kılmak için yapabileceğin tek bir küçük şey?",
  "Bugün geçmişten gelen hangi güzel bir anıyı veya tecrübeyi hatırlayıp gülümsedin?",
  "Bugün hayatın sana fısıldadığı en önemli ders veya farkındalık neydi?",
  "Bugün seni sen yapan, sana özgü bir özelliğini nasıl kullandın?",
  "Bugün en çok kime kalpten bir merhaba, sevgi dolu bir selam yollamak istersin?",
  "Bugün seni şaşırtan, hiç beklemediğin küçük ama tatlı bir gelişme oldu mu?",
  "Eğer bugününü bir kitap başlığıyla özetleseydin, bu başlık ne olurdu?"
];

// Helper to get question based on day index (synchronizes globally)
function getQuestionOfDay(): string {
  // Use day timestamp so everyone gets the same question on the calendar day
  const rawDayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const poolIndex = rawDayIndex % QUESTION_POOL.length;
  return QUESTION_POOL[poolIndex];
}

// Anonymous Global Feed State in-memory
interface AnonFeedItem {
  id: string;
  questionText: string;
  text: string;
  emoji: string;
  score: number; // 1-5
  ageRange: string;
  country: string;
  timestamp: string;
}

const GLOBAL_FEED: AnonFeedItem[] = [
  {
    id: "f1",
    questionText: "Bugün seni en çok ne mutlu etti ya da gülümsetti?",
    text: "Yıllardır görmediğim lise arkadaşımdan gelen anlık bir fotoğraf ve ses kaydı güne neşe kattı.",
    emoji: "😊",
    score: 5,
    ageRange: "25-34",
    country: "Türkiye",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 mins ago
  },
  {
    id: "f2",
    questionText: "Bugün kime veya neye içten bir teşekkür borçlusun?",
    text: "Sokaktaki yavru kediye mama verirken bana sevgiyle bakan o gözlere teşekkür ederim.",
    emoji: "🐱",
    score: 4,
    ageRange: "18-24",
    country: "Almanya",
    timestamp: new Date(Date.now() - 1000 * 60 * 62).toISOString() // ~1 hour ago
  },
  {
    id: "f3",
    questionText: "Bugün hayatına dair öğrendiğin en önemli şey neydi?",
    text: "Sadece durup derin bir nefes almanın, panik yapıp acele etmekten çok daha pratik olduğunu fark ettim.",
    emoji: "✨",
    score: 4,
    ageRange: "35-44",
    country: "İngiltere",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: "f4",
    questionText: "Bugün doğada, çevrende veya gökyüzünde dikkatini çeken en güzel detay neydi?",
    text: "Gün batımında gökyüzünün aldığı o inanılmaz pastel turuncu ve mor tonları seyretmek muazzamdı.",
    emoji: "🌅",
    score: 5,
    ageRange: "45-54",
    country: "Türkiye",
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString()
  },
  {
    id: "f5",
    questionText: "Kendinde bugün gurur duyduğun tek bir davranış veya karar seç desek, ne olurdu?",
    text: "Öfkeli bir telefon görüşmesinde sesimi hiç yükseltmeden, sakince sınırlarımı çizmeyi başardım.",
    emoji: "🌱",
    score: 4,
    ageRange: "25-34",
    country: "Türkiye",
    timestamp: new Date(Date.now() - 1000 * 60 * 420).toISOString()
  },
  {
    id: "f6",
    questionText: "Bugün seni en çok ne mutlu etti ya da gülümsetti?",
    text: "Kahvemi yudumlarken masama konan minik kumru.",
    emoji: "🕊️",
    score: 3,
    ageRange: "65+",
    country: "Türkiye",
    timestamp: new Date(Date.now() - 1000 * 60 * 700).toISOString()
  }
];

// API: Check status of AI Integration
app.get("/api/ai-status", (req, res) => {
  const ai = getGeminiClient();
  res.json({
    active: ai !== null,
    message: ai !== null 
      ? "AI integration is active and powered by Gemini." 
      : "Gemini API Key is missing. Running in premium demonstration mode with fallback logic."
  });
});

// API: Get current question of the day
app.get("/api/current-question", (req, res) => {
  const question = getQuestionOfDay();
  res.json({ question });
});

// API: Generate alternative question with Gemini
app.post("/api/generate-alt-question", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      // Return a high quality alternative from our list that is NOT the current daily question
      const current = getQuestionOfDay();
      const candidates = QUESTION_POOL.filter(q => q !== current);
      const randomAlternative = candidates[Math.floor(Math.random() * candidates.length)];
      return res.json({
        question: randomAlternative,
        isCustom: true,
        source: "Pool Fallback"
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Günün Tek Sorusu adında çok minimalist bir şükran/farkındalık günlüğü uygulamamız var. 
Kullanıcının güne saniyeler içinde samimi ve derinlemesine odaklanmasını sağlayacak, 
Türkçe, sıcak, asla resmi olmayan, kendisini keşfetmesini destekleyici ve şükran verici yeni bir derin soru üret.
Lütfen sadece sorunun kendisini düz metin olarak döndür. Tırnak işaretleri, açıklama veya 'İşte sorunuz:' gibi ek cümleler ekleme. 
Sadece tek bir soru cümlesi olsun. Örnek: "Bugün hissettiğin ve kelimelere dökmekte zorlandığın o tatlı duygu hangisiydi?"`,
    });

    const questionText = response.text ? response.text.replace(/["']/g, "").trim() : "Bugün ruhunun en derin köşesinde hangi tatlı müzik çalıyordu?";
    res.json({
      question: questionText,
      isCustom: true,
      source: "Gemini AI"
    });
  } catch (err: any) {
    console.error("Alt question generation failed:", err);
    res.status(500).json({ error: "Gemini query failed", fallback: "Bugün içsel huzuru hissettiğin en sakin an hangisiydi?" });
  }
});

// API: Get global anonymous feed
app.get("/api/global-feed", (req, res) => {
  res.json(GLOBAL_FEED);
});

// API: Submit to global anonymous feed
app.post("/api/global-feed", (req, res) => {
  const { questionText, text, emoji, score, ageRange, country } = req.body;
  if (!text || !emoji) {
    return res.status(400).json({ error: "Eksik bilgi girdiniz." });
  }

  const newItem: AnonFeedItem = {
    id: "g" + Math.random().toString(36).substr(2, 9),
    questionText: questionText || getQuestionOfDay(),
    text: text.slice(0, 200), // En fazla 200 karakter limit
    emoji,
    score: Number(score) || 3,
    ageRange: ageRange || "Gizli",
    country: country || "Anonim",
    timestamp: new Date().toISOString()
  };

  GLOBAL_FEED.unshift(newItem);
  if (GLOBAL_FEED.length > 100) {
    GLOBAL_FEED.pop();
  }

  res.status(201).json(newItem);
});

// API: Analyze answers using Gemini for customized mindfulness feedback
app.post("/api/analyze-answers", async (req, res) => {
  try {
    const { history } = req.body;
    if (!history || !Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ error: "Analiz edilecek günlük geçmişi bulunamadı." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Return a simulated high-quality psychological feedback if API is not active
      const avgScore = history.reduce((sum, item) => sum + (item.score || 3), 0) / history.length;
      const emojiList = Array.from(new Set(history.map(item => item.emoji).filter(Boolean))).join(" ");
      
      let coachNote = "";
      if (avgScore >= 4) {
        coachNote = "Son günleriniz harika bir içsel neşeyle dolu! Kelimelerinizde ve seçtiğiniz emojilerde derin bir dinginlik var. Hayatın küçük detaylarını fark etmek, bağışıklık sisteminizi ve ruhsal dayanıklılığınızı güçlendiriyor. Bu şükran çizgisini bozmayın.";
      } else if (avgScore >= 2.5) {
        coachNote = "Dengeli bir hafta geçiriyorsunuz. Hayatta her gün harika olmak zorunda değil; fakat her günde küçük de olsa fark edilecek güzel bir detay saklıdır. Kendinize karşı sabırlı ve sevecen kalın.";
      } else {
        coachNote = "Biraz yorucu veya melankolik bir dönemden geçiyor olabilirsiniz. Ancak sadece durup bu hisleri kabul etmeniz ve buraya tek bir cümleyle bile olsa yazmanız bile iyileşme sürecinin başladığının kanıtıdır.";
      }

      return res.json({
        feedback: coachNote,
        sentimentTheme: avgScore >= 4 ? "Altın Işıltı (Şükran Dolu)" : avgScore >= 2.5 ? "Sakin Doğa (Dengeli)" : "Huzurlu Yağmur (Hassas/Yenilenme)",
        quote: "Gerçek zenginlik; sahip olduklarının sayısında değil, fark edebildiğin güzelliklerin büyüklüğündedir.",
        isSimulated: true
      });
    }

    // Call Gemini to give amazing coach feedback
    const historyString = history.map((item: any, index: number) => {
      return `Gün ${index + 1} (${item.date}): Soru: "${item.question || ''}" -> Cevap: "${item.text}" (Duygu Skoru: ${item.score}/5, Seçtiği Sembol: ${item.emoji})`;
    }).join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Kullanıcı adımıza 'Günün Tek Sorusu' adında bir şükran günlüğü tutuyor. İşte kullanıcının geçmiş günlerdeki cevap ve duygusal logları:
${historyString}

Sen son derece bilge, derin felsefi/psikolojik derinliği olan, samimi, şefkatli bir farkındalık (mindfulness) rehberisin.
Bu verileri analiz et ve kullanıcıya ruhunu besleyecek, o hafta nasıl hissettiğini ayna gibi yansıtacak 3-4 cümlelik Türkçe bir geri bildirim ve analiz sun.
Lütfen yanıtı JSON olarak dönüştür. JSON şunları içermelidir:
{
  "feedback": "...", // Türkçe 3-4 cümlelik kalpten, samimi farkındalık koçu feedback'i
  "sentimentTheme": "...", // Bu haftanın ruh haline yakışır sanatsal bir tema ismi (Örn: 'Sonbahar Rüzgarları', 'Sabah Güneşi', 'Dengeli Nehir')
  "quote": "..." // Bu analizle eşleşen, ilham verici, kısa ve bilgece bir şükran veya huzur aforizması
}
Geri bildiriminde resmi dilden kaçın, 'sen' diliyle, dostça ve anlamlı konuş. JSON formatını bozma, sadece saf JSON çıktı ver.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    let rawText = response.text || "{}";
    // Sanitize block quotes if any
    if (rawText.startsWith("```json")) {
      rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```/, "").replace(/```$/, "").trim();
    }
    
    const parsedData = JSON.parse(rawText);
    res.json({
      feedback: parsedData.feedback || "Cevaplarınızda harika bir içsel bütünlük var. Kendinizi kaydetmeye devam edin.",
      sentimentTheme: parsedData.sentimentTheme || "Dingin Gökyüzü",
      quote: parsedData.quote || "Her güne ait küçük bir şükran cümlesi, yarının karanlığına yakılmış bir mumdur.",
      isSimulated: false
    });
  } catch (err: any) {
    console.error("AI Analysis failed:", err);
    res.status(500).json({ error: "Gemini analysis failed", detail: err.message });
  }
});

export default app;
