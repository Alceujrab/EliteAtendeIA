import express from "express";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, getDocs } from "firebase/firestore";
import fs from "fs";

// Load Firebase config
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Evolution API Webhook Endpoint
  app.post("/api/webhook/evolution", async (req, res) => {
    try {
      const payload = req.body;
      console.log("Received Evolution Webhook:", JSON.stringify(payload, null, 2));

      // Evolution API usually sends events like "messages.upsert"
      if (payload.event === "messages.upsert" && payload.data) {
        await addDoc(collection(db, "webhook_events"), {
          source: "evolution",
          payload: JSON.stringify(payload),
          createdAt: new Date().toISOString()
        });
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook Error:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Instagram Webhook Verification
  app.get("/api/webhook/instagram", (req, res) => {
    const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || "elitecrm_instagram_token";
    
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(400);
    }
  });

  // Instagram Webhook Event Receiving
  app.post("/api/webhook/instagram", async (req, res) => {
    try {
      const body = req.body;
      console.log("Received Instagram Webhook:", JSON.stringify(body, null, 2));

      if (body.object === "instagram") {
        await addDoc(collection(db, "webhook_events"), {
          source: "instagram",
          payload: JSON.stringify(body),
          createdAt: new Date().toISOString()
        });
        res.status(200).send("EVENT_RECEIVED");
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error("Instagram Webhook Error:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Send Instagram Message API
  app.post("/api/send/instagram", async (req, res) => {
    try {
      const { recipientId, text, settings } = req.body;
      const PAGE_ACCESS_TOKEN = settings?.instagramPageAccessToken || process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
      
      if (!PAGE_ACCESS_TOKEN) {
        console.warn("INSTAGRAM_PAGE_ACCESS_TOKEN not configured. Simulating send.");
        return res.status(200).json({ success: true, simulated: true });
      }

      // Call Meta Graph API
      const response = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: text }
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Instagram Send Error:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" });
    }
  });

  // Send WhatsApp Message API (Evolution API)
  app.post("/api/send/whatsapp", async (req, res) => {
    try {
      const { recipientId, text, settings } = req.body;
      const EVOLUTION_API_URL = settings?.evolutionApiUrl || process.env.EVOLUTION_API_URL;
      const EVOLUTION_API_KEY = settings?.evolutionApiKey || process.env.EVOLUTION_API_KEY;
      const instanceName = settings?.evolutionInstance || req.body.instanceName || "default";
      
      if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        console.warn("Evolution API credentials not configured. Simulating send.");
        return res.status(200).json({ success: true, simulated: true });
      }

      // Call Evolution API
      const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: recipientId,
          text: text
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error || "Error sending WhatsApp message");
      }

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("WhatsApp Send Error:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" });
    }
  });

  // Send WhatsApp Media API (Evolution API)
  app.post("/api/send/whatsapp/media", async (req, res) => {
    try {
      const { recipientId, mediaUrl, mediaType, settings } = req.body;
      const EVOLUTION_API_URL = settings?.evolutionApiUrl || process.env.EVOLUTION_API_URL;
      const EVOLUTION_API_KEY = settings?.evolutionApiKey || process.env.EVOLUTION_API_KEY;
      const instanceName = settings?.evolutionInstance || req.body.instanceName || "default";
      
      if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        console.warn("Evolution API credentials not configured. Simulating media send.");
        return res.status(200).json({ success: true, simulated: true });
      }

      // Determine the correct Evolution API endpoint and body based on media type
      // Evolution API expects base64 without the data:image/png;base64, prefix
      const base64Data = mediaUrl.split(',')[1] || mediaUrl;
      const mimetype = mediaUrl.split(';')[0].split(':')[1] || 'application/octet-stream';
      
      let endpoint = 'sendMedia';
      let bodyData: any = {
        number: recipientId,
        mediatype: mediaType === 'image' ? 'image' : mediaType === 'video' ? 'video' : 'audio',
        mimetype: mimetype,
        caption: '',
        media: base64Data
      };

      if (mediaType === 'audio') {
        endpoint = 'sendWhatsAppAudio';
      }

      const response = await fetch(`${EVOLUTION_API_URL}/message/${endpoint}/${instanceName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": EVOLUTION_API_KEY
        },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error || "Error sending WhatsApp media");
      }

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("WhatsApp Media Send Error:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" });
    }
  });

  // Import Catalog API
  app.post("/api/catalog/import", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, error: "URL is required" });
      }

      console.log(`Fetching catalog from: ${url}`);
      
      // Use corsproxy.io to bypass WAF/IP blocks from the provider
      const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
      
      const response = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch catalog: ${response.statusText}`);
      }

      const text = await response.text();
      let parsedData;

      if (url.endsWith('.xml') || text.trim().startsWith('<')) {
        const { XMLParser } = await import('fast-xml-parser');
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
        parsedData = parser.parse(text);
      } else {
        parsedData = JSON.parse(text);
      }

      res.status(200).json({ success: true, data: parsedData });
    } catch (error) {
      console.error("Catalog Import Error:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
