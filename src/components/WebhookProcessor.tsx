import React, { useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function WebhookProcessor() {
  useEffect(() => {
    const q = query(collection(db, 'webhook_events'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const event = change.doc.data();
          const eventId = change.doc.id;
          
          try {
            if (event.source === 'evolution') {
              await processEvolutionEvent(JSON.parse(event.payload), eventId);
            } else if (event.source === 'instagram') {
              await processInstagramEvent(JSON.parse(event.payload), eventId);
            }
            // Delete the event after successful processing
            await deleteDoc(doc(db, 'webhook_events', eventId));
          } catch (error) {
            console.error("Error processing webhook event:", error);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const getInboxId = async (channel: 'whatsapp' | 'instagram', identifier: string) => {
    try {
      const inboxesSnap = await getDocs(collection(db, 'inboxes'));
      for (const doc of inboxesSnap.docs) {
        const data = doc.data();
        if (data.channel === channel) {
          if (channel === 'whatsapp' && data.settings?.evolutionInstance === identifier) {
            return doc.id;
          }
          if (channel === 'instagram' && data.settings?.instagramPageId === identifier) {
            return doc.id;
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
      const messageData = payload.data;
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
      const ticketRef = doc(db, "tickets", ticketId);
      
      const inboxId = await getInboxId('whatsapp', instanceName);

      const docSnap = await getDoc(ticketRef);
      
      if (!docSnap.exists()) {
        const newTicket = {
          customerName: pushName,
          customerPhone: customerPhone,
          channel: "whatsapp",
          status: "open",
          lastMessage: text,
          updatedAt: timestamp,
          tags: [],
          inbox: inboxId,
          fromWebhook: true
        };
        await setDoc(ticketRef, newTicket);
      } else {
        await updateDoc(ticketRef, {
          lastMessage: text,
          updatedAt: timestamp,
          fromWebhook: true
        });
      }

      const messageId = messageData.key.id || eventId;
      const messageRef = doc(db, `tickets/${ticketId}/messages`, messageId);
      
      const newMessage: any = {
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

      await setDoc(messageRef, newMessage, { merge: true });
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
              const ticketRef = doc(db, "tickets", ticketId);

              const docSnap = await getDoc(ticketRef);

              if (!docSnap.exists()) {
                const newTicket = {
                  customerName: `Instagram User (${senderId})`,
                  customerPhone: senderId,
                  channel: "instagram",
                  status: "open",
                  lastMessage: text,
                  updatedAt: timestamp,
                  tags: ["Instagram DM"],
                  inbox: inboxId,
                  fromWebhook: true
                };
                await setDoc(ticketRef, newTicket);
              } else {
                await updateDoc(ticketRef, {
                  lastMessage: text,
                  updatedAt: timestamp,
                  fromWebhook: true
                });
              }

              const messageRef = doc(db, `tickets/${ticketId}/messages`, `${eventId}_${index++}`);
              await setDoc(messageRef, {
                sender: "customer",
                text: text,
                timestamp: timestamp,
                fromWebhook: true
              }, { merge: true });
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
              const ticketRef = doc(db, "tickets", ticketId);

              const docSnap = await getDoc(ticketRef);

              if (!docSnap.exists()) {
                const newTicket = {
                  customerName: senderName,
                  customerPhone: senderId,
                  channel: "instagram",
                  status: "open",
                  lastMessage: `[Comentário] ${text}`,
                  updatedAt: timestamp,
                  tags: ["Instagram Comentário"],
                  inbox: inboxId,
                  fromWebhook: true
                };
                await setDoc(ticketRef, newTicket);
              } else {
                await updateDoc(ticketRef, {
                  lastMessage: `[Comentário] ${text}`,
                  updatedAt: timestamp,
                  fromWebhook: true
                });
              }

              const messageRef = doc(db, `tickets/${ticketId}/messages`, `${eventId}_${index++}`);
              await setDoc(messageRef, {
                sender: "customer",
                text: `[Comentário] ${text}`,
                timestamp: timestamp,
                fromWebhook: true
              }, { merge: true });
            }
          }
        }
      }
    }
  };

  return null;
}
