const Event = require("../model/Event");
const Venue = require("../model/Venue");
const Registration = require("../model/Registration");

/**
 * Helper to call Google Gemini API if GEMINI_API_KEY is defined in environment.
 */
async function getGeminiResponse(userPrompt, conversationHistory, systemContext) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `You are 'Welcome Agent', the intelligent AI assistant for TRACE Sri Lanka & EventHub ecosystem. 
System Knowledge Context (ONLY USE THIS REAL DATABASE DATA):
${systemContext}

Instructions:
- When asked about events or next event, ONLY mention the exact real events present in the System Knowledge Context. Do NOT invent or make up imaginary events.
- If there are no events listed in the database context, clearly state: "Currently, there are no events stored in the database."
- When greeted with "hi trace" or "hi", respond politely:
  "Hi, thank you for reaching out. You are currently being assisted by our AI assistant.

Hello! How can I help you today with information about TRACE and its innovation ecosystem?"
- Format responses clearly with bold text and emojis.`,
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: "Hi, thank you for reaching out. You are currently being assisted by our AI assistant.\n\nHello! How can I help you today with information about TRACE and its innovation ecosystem?",
          },
        ],
      },
    ];

    if (Array.isArray(conversationHistory)) {
      conversationHistory.slice(-6).forEach((msg) => {
        if (msg.sender === "user" || msg.role === "user") {
          contents.push({ role: "user", parts: [{ text: msg.text || msg.content || "" }] });
        } else if (msg.sender === "bot" || msg.role === "model" || msg.role === "assistant") {
          contents.push({ role: "model", parts: [{ text: msg.text || msg.content || "" }] });
        }
      });
    }

    contents.push({ role: "user", parts: [{ text: userPrompt }] });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return botReply || null;
  } catch (err) {
    console.error("Gemini API error:", err.message);
    return null;
  }
}

/**
 * Smart Database Query Engine for Welcome Agent - STRICTLY READS REAL MONGO DB DATA
 */
async function generateSmartFallbackResponse(userPrompt, dbEvents, venues) {
  const query = userPrompt.toLowerCase().trim();

  // Filter non-draft events
  const validEvents = (dbEvents || []).filter((e) => e.status !== "draft");

  // 1. Greeting handling (matching user reference screenshot)
  if (
    query === "hi trace" ||
    query === "hello trace" ||
    query === "hey trace" ||
    query === "hi" ||
    query === "hello" ||
    query === "hey" ||
    query === "trace"
  ) {
    return {
      reply: `Hi, thank you for reaching out. You are currently being assisted by our AI assistant.\n\nHello! How can I help you today with information about TRACE and its innovation ecosystem?`,
      quickPrompts: ["What is next event?", "📅 Upcoming Events", "🏢 Explore Venues"],
    };
  }

  // 2. How are you query
  if (query.includes("how are you") || query.includes("how r u")) {
    return {
      reply: `I'm doing well, thank you for asking! 😊 I am ready to assist you with TRACE events, venue bookings, and member registrations. How can I help you today?`,
      quickPrompts: ["What is next event?", "📅 Upcoming Events", "🏢 Explore Venues"],
    };
  }

  // 3. Next event query (STRICTLY FETCHES FROM MONGO DB)
  if (query.includes("next event") || query.includes("what is next") || query.includes("whats next") || query.includes("first event")) {
    if (!validEvents || validEvents.length === 0) {
      return {
        reply: "📅 Currently, there are no events stored in the database. Please check back later!",
        quickPrompts: ["Explore Venues"],
      };
    }

    const nextEvt = validEvents[0];
    const evtDateStr = nextEvt.date ? new Date(nextEvt.date).toLocaleDateString("en-US", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : "Date TBD";
    const speakerInfo = nextEvt.speaker && nextEvt.speaker.name ? `\n🎤 **Speaker:** ${nextEvt.speaker.name} (${nextEvt.speaker.role || 'Guest'})` : "";

    return {
      reply: `🚀 **Next Event in Database:**\n\n📌 **${nextEvt.title}**\n📅 **Date:** ${evtDateStr}\n⏰ **Time:** ${nextEvt.time || 'TBA'}\n📍 **Location:** ${nextEvt.location}\n🏷️ **Category:** ${nextEvt.category || 'General'}${speakerInfo}\n👥 **Registered:** ${nextEvt.registeredCount || 0}/${nextEvt.capacity || 100} Seats\n\n📝 *Description:* ${nextEvt.description}\n\n💡 *Tip: Click **Upcoming Events** in navigation to view details!*`,
      quickPrompts: ["📅 All Upcoming Events", "🏢 Explore Venues"],
    };
  }

  // 4. Upcoming events search (STRICTLY LISTS REAL MONGO DB EVENTS)
  if (query.includes("upcoming") || query.includes("event") || query.includes("schedule")) {
    if (!validEvents || validEvents.length === 0) {
      return {
        reply: "📅 Currently, there are no events stored in the database.",
        quickPrompts: ["Explore Venues"],
      };
    }

    const eventListStr = validEvents
      .map(
        (e, i) =>
          `**${i + 1}. ${e.title}**\n📍 *${e.location}* | 📅 ${new Date(e.date).toLocaleDateString()} | ⏰ ${e.time}\n👥 ${e.registeredCount || 0}/${e.capacity || 100} Registered`
      )
      .join("\n\n");

    return {
      reply: `🎉 **Events Stored in Database (${validEvents.length}):**\n\n${eventListStr}\n\n💡 *Ask me "what is next event" for details on the immediate next event!*`,
      quickPrompts: ["What is next event?", "🏢 Explore Venues"],
    };
  }

  // 5. Venues & space booking search
  if (query.includes("venue") || query.includes("space") || query.includes("hall") || query.includes("booking") || query.includes("rent")) {
    if (!venues || venues.length === 0) {
      return {
        reply: "🏢 No venue spaces found in database.",
        quickPrompts: ["What is next event?"],
      };
    }
    const venueListStr = venues
      .map(
        (v, i) =>
          `**${i + 1}. ${v.name}**\n📍 *${v.branch || v.city || 'TRACE Expert City'}*\n👥 Capacity: ${v.capacity} guests | 💰 ${v.rentalPrice}`
      )
      .join("\n\n");

    return {
      reply: `🏢 **Available Venues in Database:**\n\n${venueListStr}\n\n💡 *To book a space, navigate to **Spaces** in the menu!*`,
      quickPrompts: ["What is next event?", "Upcoming Events"],
    };
  }

  // 6. Direct Database Regex Search on Event Collection
  try {
    const searchMatches = await Event.find({
      $and: [
        { status: { $ne: "draft" } },
        {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
            { category: { $regex: query, $options: "i" } },
            { location: { $regex: query, $options: "i" } },
          ],
        },
      ],
    }).limit(5).lean();

    if (searchMatches && searchMatches.length > 0) {
      const matchStr = searchMatches
        .map((e) => `📌 **${e.title}**\n📍 ${e.location} | 📅 ${new Date(e.date).toLocaleDateString()} @ ${e.time}`)
        .join("\n\n");
      return {
        reply: `🔍 **Database search results for "${userPrompt}":**\n\n${matchStr}`,
        quickPrompts: ["What is next event?", "📅 Upcoming Events"],
      };
    }
  } catch (err) {
    console.error("DB Search error:", err);
  }

  // If query is an unknown question and no DB matches found
  return {
    reply: `Hi, thank you for reaching out. You are currently being assisted by our AI assistant.\n\nNo matching events or details were found in the database for "${userPrompt}". Try asking about *"next event"* or *"upcoming events"*!`,
    quickPrompts: ["What is next event?", "📅 Upcoming Events", "🏢 Explore Venues"],
  };
}

/**
 * Controller endpoint: POST /api/chat/message
 */
const handleChatMessage = async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Message text is required." });
    }

    // Query real-time MongoDB data ONLY
    const dbEvents = await Event.find({ status: { $ne: "draft" } }).sort({ date: 1 }).lean();
    const venues = await Venue.find({ status: "Available" }).limit(10).lean();

    const systemContext = `
REAL MONGO DATABASE KNOWLEDGE:
- Total Events in DB: ${dbEvents.length}
- Events in DB: ${
      dbEvents.length > 0
        ? dbEvents.map((e) => `[ID: ${e._id}] Title: ${e.title}, Date: ${new Date(e.date).toDateString()}, Time: ${e.time}, Location: ${e.location}, Category: ${e.category}, Registered: ${e.registeredCount}/${e.capacity}`).join("; ")
        : "NONE (Database has 0 events)"
    }
- Available Venues: ${
      venues.length > 0
        ? venues.map((v) => `${v.name} (${v.rentalPrice})`).join("; ")
        : "NONE"
    }
`;

    let botReply = await getGeminiResponse(message, conversationHistory, systemContext);
    let quickPrompts = ["What is next event?", "Upcoming Events", "Explore Venues"];

    if (!botReply) {
      const fallbackResult = await generateSmartFallbackResponse(message, dbEvents, venues);
      botReply = fallbackResult.reply;
      if (fallbackResult.quickPrompts) {
        quickPrompts = fallbackResult.quickPrompts;
      }
    }

    return res.status(200).json({
      success: true,
      reply: botReply,
      quickPrompts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error processing chat message.",
      reply: "Hi, thank you for reaching out. Unable to access the database right now. Please try again shortly!",
      quickPrompts: ["What is next event?", "Upcoming Events"],
    });
  }
};

module.exports = {
  handleChatMessage,
};
