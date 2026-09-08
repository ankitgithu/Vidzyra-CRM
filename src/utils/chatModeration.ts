/**
 * Automatic Restriction Moderation Filter (Level 1)
 * 
 * Strict context-aware intent detector for Client <-> Editor project chat.
 * Prohibits:
 * 1. External contact exchange (WhatsApp, Instagram, Telegram, Phone, Email, DM, Handles)
 * 2. Payment and financial discussion (Price, Payment, UPI, GPay, Bank, Paisa, Billing)
 * 3. Personal or unrelated talk (Dating, Personal meetup, Address, Flirting)
 * 
 * Context Rule:
 * Legitimate video editing references (e.g., "Instagram Reel ke liye 9:16 video bana do",
 * "WhatsApp se jo reference mila tha uske jaisa edit karna") are ALLOWED to pass Level 1
 * and proceed to Level 2 (Admin manual review).
 */

export interface ModerationResult {
  isRestricted: boolean;
  category?: 'EXTERNAL_CONTACT' | 'PAYMENT' | 'PERSONAL_UNRELATED';
  reason?: string;
}

export function evaluateMessageModeration(rawText: string): ModerationResult {
  if (!rawText || !rawText.trim()) {
    return {
      isRestricted: true,
      category: 'PERSONAL_UNRELATED',
      reason: 'Message cannot be empty.',
    };
  }

  const text = rawText.trim();
  const lower = text.toLowerCase();

  // -------------------------------------------------------------
  // 1. PHONE NUMBERS & EMAIL ADDRESSES
  // -------------------------------------------------------------

  // Email pattern
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (emailRegex.test(text)) {
    return {
      isRestricted: true,
      category: 'EXTERNAL_CONTACT',
      reason: 'Sharing email addresses is strictly prohibited.',
    };
  }

  // Raw Phone / Mobile number patterns (10 or more digits, with optional country code/spaces/dashes)
  // Avoid blocking video timestamps like "00:10" or "01:25" or resolutions like "1920x1080"
  const phonePattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const rawDigitsMatch = lower.replace(/[^0-9]/g, '');
  // If text contains a continuous block of 9-12 digits that isn't a known timestamp/aspect ratio
  if (phonePattern.test(text) || (rawDigitsMatch.length >= 10 && rawDigitsMatch.length <= 13 && !/1920|1080|3840|2160/.test(rawDigitsMatch))) {
    // Check if it's asking for or sharing a phone/contact number
    return {
      isRestricted: true,
      category: 'EXTERNAL_CONTACT',
      reason: 'Sharing or requesting phone numbers is strictly prohibited.',
    };
  }

  // Explicit number requests: "apna number", "phone number", "mobile no", "contact number", "call karo", "call me"
  const phoneIntentPatterns = [
    /\b(apna|mera|tera|send|share|give|bhejo|do|mang)?\s*(phone|mobile|contact|calling|whatsapp)?\s*(number|no\.?|num)\b/i,
    /\b(number|no)\s*(bhejo|send|share|do|de|mang)\b/i,
    /\b(call|dial|ring)\s*(me|karo|karna|pe|krna)\b/i,
    /\b(call\s*pe\s*baat)\b/i,
  ];
  for (const regex of phoneIntentPatterns) {
    if (regex.test(lower)) {
      return {
        isRestricted: true,
        category: 'EXTERNAL_CONTACT',
        reason: 'Sharing or requesting phone numbers/calls is strictly prohibited.',
      };
    }
  }

  // -------------------------------------------------------------
  // 2. EXTERNAL CHAT & SOCIAL MEDIA CONTACT EXCHANGE
  // -------------------------------------------------------------

  // External communication links (wa.me, t.me, chat.whatsapp, telegram.me, discord.gg, etc.)
  const externalLinkRegex = /(wa\.me|t\.me|chat\.whatsapp\.com|telegram\.me|discord\.gg|instagram\.com\/[a-zA-Z0-9._]+|facebook\.com)/i;
  if (externalLinkRegex.test(lower)) {
    return {
      isRestricted: true,
      category: 'EXTERNAL_CONTACT',
      reason: 'External communication links are strictly prohibited.',
    };
  }

  // WhatsApp Intent:
  // ALLOWED: "whatsapp se jo reference mila tha", "whatsapp par video bheja tha usko dekho" (as asset source)
  // BLOCKED: "whatsapp pe aa jao", "whatsapp pe baat", "whatsapp number", "whatsapp karo", "whatsapp pe msg"
  const whatsappBlockPatterns = [
    /whatsapp\s*(pe|par|pr|mein|me)?\s*(aa\s*jao|baat|connect|chat|msg|message|aao|shift)/i,
    /(aa\s*jao|aao|baat\s*kare|msg\s*karo|message\s*karo)\s*(whatsapp\s*pe|whatsapp\s*par|wa\s*pe)/i,
    /whatsapp\s*(number|no|details|contact)/i,
    /\b(wa|wp)\s*(pe\s*aa|pe\s*baat|pe\s*aao|no|number)\b/i,
    /\b(text|chat|ping)\s*(me\s*on\s*whatsapp|on\s*wa)\b/i,
  ];
  for (const p of whatsappBlockPatterns) {
    if (p.test(lower)) {
      return {
        isRestricted: true,
        category: 'EXTERNAL_CONTACT',
        reason: 'Attempts to move communication to WhatsApp are strictly prohibited.',
      };
    }
  }

  // Instagram Intent:
  // ALLOWED: "instagram reel", "reel for instagram", "instagram ke liye video", "instagram post size"
  // BLOCKED: "instagram pe baat", "instagram id do", "dm me on instagram", "instagram handle", "insta pe aao"
  const instaBlockPatterns = [
    /instagram\s*(pe|par|pr|mein)?\s*(baat|aao|aa\s*jao|connect|chat|msg|message|follow)/i,
    /(baat\s*karte\s*hain|aao|aa\s*jao|msg\s*karo)\s*(instagram\s*pe|insta\s*pe)/i,
    /(insta|instagram)\s*(id|handle|username|account)\s*(do|de|bhejo|send|share)/i,
    /\b(dm\s*me|dm\s*karo|message\s*karo\s*insta)\b/i,
    /\b(insta|ig)\s*(pe\s*aa\s*jao|pe\s*baat|pe\s*msg|id)\b/i,
    /\b(check\s*dm|inbox\s*me)\b/i,
  ];
  for (const p of instaBlockPatterns) {
    if (p.test(lower)) {
      return {
        isRestricted: true,
        category: 'EXTERNAL_CONTACT',
        reason: 'Attempts to exchange Instagram contact or DM are strictly prohibited.',
      };
    }
  }

  // Telegram Intent:
  const telegramBlockPatterns = [
    /telegram\s*(pe|par|pr|mein)?\s*(message|msg|baat|aa\s*jao|aao|connect|channel|group|join)/i,
    /telegram\s*(id|handle|username|number)/i,
    /\b(tg\s*pe|t\.me)\b/i,
  ];
  for (const p of telegramBlockPatterns) {
    if (p.test(lower)) {
      return {
        isRestricted: true,
        category: 'EXTERNAL_CONTACT',
        reason: 'Attempts to communicate on Telegram are strictly prohibited.',
      };
    }
  }

  // Other social media contact exchange: Snapchat, Discord, Facebook, Twitter/X handles
  const socialHandleBlockPatterns = [
    /\b(snapchat|snap\s*id|snap\s*pe)\b/i,
    /\b(discord\s*id|discord\s*pe|tag\s*do)\b/i,
    /\b(facebook\s*pe|fb\s*pe\s*baat)\b/i,
    /\b@[a-zA-Z0-9._]{3,}\b/i, // @handle contact attempt
  ];
  for (const p of socialHandleBlockPatterns) {
    if (p.test(lower)) {
      return {
        isRestricted: true,
        category: 'EXTERNAL_CONTACT',
        reason: 'Social media usernames and external contact handles are strictly prohibited.',
      };
    }
  }

  // General moving outside CRM:
  const outsidePatterns = [
    /\b(bahar\s*baat|outside\s*(crm|chat|app)|personal\s*(chat|number|email)|direct\s*contact)\b/i,
    /\b(offline\s*meet|milte\s*hain|kaha\s*miloge)\b/i,
  ];
  for (const p of outsidePatterns) {
    if (p.test(lower)) {
      return {
        isRestricted: true,
        category: 'EXTERNAL_CONTACT',
        reason: 'Moving communication outside the CRM is strictly prohibited.',
      };
    }
  }

  // -------------------------------------------------------------
  // 3. PAYMENT & FINANCIAL DISCUSSION
  // -------------------------------------------------------------

  const paymentBlockPatterns = [
    // Payment terms & queries
    /\b(payment|paise|paisa|rupaye|rupay|rupees|inr|usd)\b/i,
    /\b(salary|advance|refund|invoice|bill|billing|fees|fee|cost|price|pricing|rate|charges)\b/i,
    // Payment apps & gateways
    /\b(upi|gpay|google\s*pay|phonepe|phone\s*pe|paytm|bank\s*account|account\s*number|ifsc|qr\s*code)\b/i,
    // Hinglish payment phrases
    /\b(payment\s*(kab|kar|karo|bhejo|milega|chahiye|done|hua|baki|pending|transfer))\b/i,
    /\b(paise\s*(kab|do|bhejo|bhejna|milega|chahiye|kitne|transfer|dal))\b/i,
    /\b(kitna\s*paisa|kitne\s*rupaye|kitna\s*charge|kitne\s*charges)\b/i,
    /\b(paisa\s*bhejo|paise\s*bhejo|transfer\s*karo|money\s*send)\b/i,
  ];
  for (const p of paymentBlockPatterns) {
    if (p.test(lower)) {
      return {
        isRestricted: true,
        category: 'PAYMENT',
        reason: 'Payment and financial discussions are handled directly through Admin billing and strictly prohibited in project chat.',
      };
    }
  }

  // -------------------------------------------------------------
  // 4. PERSONAL / UNRELATED CONVERSATION
  // -------------------------------------------------------------

  const personalBlockPatterns = [
    /\b(dost\s*banoge|friendship|date\s*pe|single\s*ho|shadi|relationship|girlfriend|boyfriend|bf|gf)\b/i,
    /\b(personal\s*baat|kaha\s*rehte\s*ho|apna\s*address|ghar\s*kaha|age\s*kya\s*hai|umar\s*kya)\b/i,
    /\b(flirt|love\s*you|cute\s*ho|khoobsurat|khubsurat)\b/i,
    /\b(project\s*ke\s*alawa\s*baat|free\s*time\s*mein\s*kya)\b/i,
  ];
  for (const p of personalBlockPatterns) {
    if (p.test(lower)) {
      return {
        isRestricted: true,
        category: 'PERSONAL_UNRELATED',
        reason: 'Personal or unrelated conversations are strictly prohibited. Chat is strictly for project editing instructions.',
      };
    }
  }

  // Not restricted: Message passes Level 1 filter!
  return {
    isRestricted: false,
  };
}
