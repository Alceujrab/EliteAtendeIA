import React, { useEffect } from 'react';
import axios from 'axios';

export default function WebhookProcessor() {
  useEffect(() => {
    const processEvents = async () => {
      try {
        // Fetch pending webhook events from the API
        const res = await axios.get('/api/webhook-events');
        const events = res.data;

        for (const event of events) {
          try {
            if (event.source === 'evolution') {
              await processEvolutionEvent(JSON.parse(event.payload), event.id);
            } else if (event.source === 'instagram') {
              await processInstagramEvent(JSON.parse(event.payload), event.id);
            }
            // Delete the event after successful processing
            await axios.delete(`/api/webhook-events/${event.id}`);
          } catch (error) {
            console.error("Error processing webhook event:", error);
          }
        }
      } catch (error) {
        // Silently fail - endpoint might not exist yet
        console.error("Error fetching webhook events:", error);
      }
    };

    processEvents();
    const interval = setInterval(processEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const getInboxId = async (channel: 'whatsapp' | 'instagram', identifier: string) => {
    try {
      const res = await axios.get('/api/inboxes');
      const inboxes = res.data;
      for (const inbox of inboxes) {
        if (inbox.channel === channel) {
          if (channel === 'whatsapp' && inbox.settings?.evolutionInstance === identifier) {
            return inbox.id;
          }
          if (channel === 'instagram' && inbox.settings?.instagramPageId === identifier) {
            return inbox.id;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching inboxes:", error);
    }
    return 'default';
  };

  const processEvolutionEvent = async (payload: any, eventId: string) => {
    if (payload.event === "messages.upsert" && payload.data) {
      let messageData = payload.data;
      if (Array.isArray(payload.data?.messages)) messageData = payload.data.messages[0];
      else if (payload.data?.message?.key) messageData = payload.data.message;

      if (!messageData || !messageData.key) {
        console.error("Unknown payload format for Evolution event:", payload);
        return;
      }

      const instanceName = payload.instance || "default";
      
      const remoteJid = messageData.key.remoteJid;
      const fromMe = messageData.key.fromMe;
      
      let text = messageData.message?.conversation || messageData.message?.extendedTextMessage?.text || "";
      let mediaType = null;
      let mediaUrl = null;

      if (messageData.message?.imageMessage) {
        mediaType = 'image';
        text = messageData.message.imageMessage.caption || "[Imagem recebida]";
        if (messageData.message.imageMessage.base64) {
           mediaUrl = `data:${messageData.message.imageMessage.mimetype};base64,${messageData.message.imageMessage.base64}`;
        }
      } else if (messageData.message?.videoMessage) {
        mediaType = 'video';
        text = messageData.message.videoMessage.caption || "[Vídeo recebido]";
        if (messageData.message.videoMessage.base64) {
           mediaUrl = `data:${messageData.message.videoMessage.mimetype};base64,${messageData.message.videoMessage.base64}`;
        }
      } else if (messageData.message?.audioMessage) {
        mediaType = 'audio';
        text = "[Áudio recebido]";
        if (messageData.message.audioMessage.base64) {
           mediaUrl = `data:${messageData.message.audioMessage.mimetype};base64,${messageData.message.audioMessage.base64}`;
        }
      } else if (messageData.message?.documentMessage) {
        mediaType = 'document';
        text = messageData.message.documentMessage.fileName || "[Documento recebido]";
        if (messageData.message.documentMessage.base64) {
           mediaUrl = `data:${messageData.message.documentMessage.mimetype};base64,${messageData.message.documentMessage.base64}`;
        }
      }

      const pushName = messageData.pushName || remoteJid.split('@')[0];

      if (remoteJid === "status@broadcast" || (!text && !mediaType)) {
        return;
      }

      const customerPhone = remoteJid.split("@")[0];
      const timestamp = new Date().toISOString();

      const ticketId = `whatsapp_${customerPhone}`;
      const inboxId = await getInboxId('whatsapp', instanceName);

      // Check if ticket exists
      let ticketExists = false;
      try {
        const ticketRes = await axios.get(`/api/tickets/${ticketId}`);
        ticketExists = ticketRes.status === 200;
      } catch {
        ticketExists = false;
      }

      if (!ticketExists) {
        await axios.post('/api/tickets', {
          id: ticketId,
          customerName: pushName,
          customerPhone: customerPhone,
          channel: "whatsapp",
          status: "open",
          lastMessage: text,
          updatedAt: timestamp,
          tags: [],
          inbox: inboxId,
          fromWebhook: true
        });
      } else {
        await axios.put(`/api/tickets/${ticketId}`, {
          lastMessage: text,
          updatedAt: timestamp,
          fromWebhook: true
        });
      }

      const messageId = messageData.key.id || eventId;
      const newMessage: any = {
        id: messageId,
        ticketId: ticketId,
        sender: fromMe ? "agent" : "customer",
        text: text,
        timestamp: timestamp,
        fromWebhook: true
      };

      if (mediaType) {
        newMessage.mediaType = mediaType;
      }
      if (mediaUrl) {
        newMessage.mediaUrl = mediaUrl;
      }

      await axios.post('/api/messages', newMessage);
    }
  };

  const processInstagramEvent = async (body: any, eventId: string) => {
    if (body.object === "instagram") {
      let index = 0;
      for (const entry of body.entry) {
        const pageId = entry.id;
        const inboxId = await getInboxId('instagram', pageId);

        if (entry.messaging) {
          for (const webhookEvent of entry.messaging) {
            const senderId = webhookEvent.sender.id;
            
            if (webhookEvent.message && webhookEvent.message.text) {
              const text = webhookEvent.message.text;
              const timestamp = new Date(webhookEvent.timestamp || Date.now()).toISOString();
              
              const ticketId = `instagram_${senderId}`;

              let ticketExists = false;
              try {
                const ticketRes = await axios.get(`/api/tickets/${ticketId}`);
                ticketExists = ticketRes.status === 200;
              } catch {
                ticketExists = false;
              }

              if (!ticketExists) {
                await axios.post('/api/tickets', {
                  id: ticketId,
                  customerName: `Instagram User (${senderId})`,
                  customerPhone: senderId,
                  channel: "instagram",
                  status: "open",
                  lastMessage: text,
                  updatedAt: timestamp,
                  tags: ["Instagram DM"],
                  inbox: inboxId,
                  fromWebhook: true
                });
              } else {
                await axios.put(`/api/tickets/${ticketId}`, {
                  lastMessage: text,
                  updatedAt: timestamp,
                  fromWebhook: true
                });
              }

              await axios.post('/api/messages', {
                id: `${eventId}_${index++}`,
                ticketId: ticketId,
                sender: "customer",
                text: text,
                timestamp: timestamp,
                fromWebhook: true
              });
            }
          }
        }
        
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === "comments" && change.value) {
              const commentData = change.value;
              const senderId = commentData.from.id;
              const senderName = commentData.from.username || `Instagram User (${senderId})`;
              const text = commentData.text;
              const timestamp = new Date().toISOString();
              
              // Ignore our own comments
              if (senderId === entry.id) continue;

              const ticketId = `instagram_${senderId}`;

              let ticketExists = false;
              try {
                const ticketRes = await axios.get(`/api/tickets/${ticketId}`);
                ticketExists = ticketRes.status === 200;
              } catch {
                ticketExists = false;
              }

              if (!ticketExists) {
                await axios.post('/api/tickets', {
                  id: ticketId,
                  customerName: senderName,
                  customerPhone: senderId,
                  channel: "instagram",
                  status: "open",
                  lastMessage: `[Comentário] ${text}`,
                  updatedAt: timestamp,
                  tags: ["Instagram Comentário"],
                  inbox: inboxId,
                  fromWebhook: true
                });
              } else {
                await axios.put(`/api/tickets/${ticketId}`, {
                  lastMessage: `[Comentário] ${text}`,
                  updatedAt: timestamp,
                  fromWebhook: true
                });
              }

              await axios.post('/api/messages', {
                id: `${eventId}_${index++}`,
                ticketId: ticketId,
                sender: "customer",
                text: `[Comentário] ${text}`,
                timestamp: timestamp,
                fromWebhook: true
              });
            }
          }
        }
      }
    }
  };

  return null;
}
