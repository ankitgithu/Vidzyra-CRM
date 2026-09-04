/**
 * Chat content filtering rules for Vidzyra CRM
 * 
 * Rules:
 * 1. Strict Payment / Financial Filter:
 *    Blocks payment, cost, fee, salary, bank, UPI, billing, etc.
 *    Supports English, Hindi, and Hinglish.
 *    Normalizes spacing and punctuation (e.g. "P A Y M E N T", "p-a-y-m-e-n-t", "₹500", "500 rupees").
 * 
 * 2. Reasonable Personal Chat Filter:
 *    Blocks obvious personal inquiries, contact sharing, social media handles, meeting requests.
 *    Allows legitimate video editing / project feedback (cuts, transitions, audio, scenes, colors, exports, etc.).
 */

export interface FilterResult {
  allowed: boolean;
  reason?: string;
  filterType?: 'payment' | 'personal';
}

// Blocked payment stems when spaces/punctuation are stripped (e.g. "p a y m e n t" -> "payment")
const STRIPPED_PAYMENT_KEYWORDS = [
  'payment',
  'payout',
  'salary',
  'phonepe',
  'googlepay',
  'gpay',
  'paytm',
  'paisebhejo',
  'paisedo',
  'kitnepaisa',
  'kitnapaise',
];

// Word-boundary payment keywords
const PAYMENT_WORDS = [
  'pay',
  'pays',
  'paid',
  'paying',
  'payment',
  'payments',
  'payout',
  'payouts',
  'price',
  'prices',
  'pricing',
  'cost',
  'costs',
  'costing',
  'amount',
  'amounts',
  'money',
  'rupee',
  'rupees',
  'paise',
  'paisa',
  'rupaye',
  'rupay',
  'fee',
  'fees',
  'charge',
  'charges',
  'charging',
  'bill',
  'bills',
  'billing',
  'invoice',
  'invoices',
  'salary',
  'salaries',
  'wage',
  'wages',
  'advance',
  'refund',
  'refunds',
  'bank',
  'upi',
  'gpay',
  'phonepe',
  'paytm',
  'bhim',
  'payoneer',
  'paypal',
  'inr',
];

// Complex Hindi/English financial phrases
const PAYMENT_PHRASES = [
  /\baccount\s*number\b/i,
  /\bacc\s*no\b/i,
  /\bac\s*no\b/i,
  /\bgoogle\s*pay\b/i,
  /\bphone\s*pe\b/i,
  /\bkitne\s*paise\b/i,
  /\bkitna\s*paisa\b/i,
  /\bkitne\s*rupaye\b/i,
  /\bkitna\s*rupay\b/i,
  /\bpayment\s*kab\b/i,
  /\bpayment\s*kar\w*\b/i,
  /\bpayment\s*kiya\b/i,
  /\bpayment\s*diya\b/i,
  /\bpayment\s*lena\b/i,
  /\bpayment\s*milega\b/i,
  /\bpayment\s*chahiye\b/i,
  /\bpaise\s*bhejo\b/i,
  /\bpaise\s*dena\b/i,
  /\bpaise\s*diye\b/i,
  /\bpaise\s*do\b/i,
  /\bpaise\s*kab\b/i,
  /\bpaisa\s*do\b/i,
  /\bpaise\s*transfer\b/i,
  /\bpayment\s*pending\b/i,
  /\bpayment\s*received\b/i,
  /\bpayment\s*due\b/i,
  // Currency symbol or Rs with digits
  /[₹$€£]\s*\d+/,
  /\d+\s*[₹$€£]/,
  /\brs\.?\s*\d+/i,
  /\d+\s*rs\.?\b/i,
  /\d+\s*rupees?\b/i,
  /\drupees?\s*\d+/i,
  /\d+\s*inr\b/i,
  // UPI VPA pattern: user@bank
  /\b[a-zA-Z0-9.\-_]{2,}@(okhdfcbank|okaxis|oksbi|okicici|upi|paytm|ybl|ibl|axl)\b/i,
];

// Personal / Social chat blocked patterns
const PERSONAL_BLOCKED_PATTERNS: RegExp[] = [
  // Greetings / General chit-chat inquiry
  /\b(how\s*are\s*you|how\s*r\s*u|kya\s*haal\s*hai|kaise\s*ho|sab\s*badiya)\b/i,
  
  // Where do you live / location inquiry
  /\b(where\s*do\s*you\s*live|where\s*are\s*you\s*from|kahan\s*rehte\s*ho|aap\s*kahan\s*se\s*ho)\b/i,
  
  // Phone / Contact sharing
  /\b(send\s*(me\s*)?(your\s*)?(phone\s*|mobile\s*|contact\s*)?number)\b/i,
  /\b(give\s*(me\s*)?(your\s*)?number|apna\s*number\s*(do|bhejo))\b/i,
  /\b(call\s*me\s*personally|phone\s*karo|call\s*karo|call\s*me\b)/i,
  /\b\d{10}\b/, // Standalone 10-digit phone number
  
  // Social media / Instagram handles
  /\b(what('?s|\s+is)\s*your\s*instagram|insta\s*id|instagram\s*handle|insta\s*id\s*kya\s*hai)\b/i,
  /\b(add\s*me\s*on\s*(insta|instagram|snapchat|telegram|facebook))\b/i,
  /\b(my\s*instagram|my\s*insta\s*is|follow\s*me\s*on\s*insta)\b/i,
  
  // Meetups / Personal talk
  /\b(let('?s|\s+us)\s*talk\s*personally|talk\s*personally|personal\s*baat)\b/i,
  /\b(meet\s*me|let('?s|\s+us)\s*meet|milte\s*hain|kahi\s*milte|coffee\s*(date|pe)|date\s*pe)\b/i,
  /\b(are\s*you\s*single|do\s*you\s*have\s*a\s*(boyfriend|girlfriend|gf|bf))\b/i,
];

/**
 * Validates a chat message against payment and personal content filters.
 * Returns { allowed: true } if valid, or { allowed: false, reason, filterType } if blocked.
 */
export function validateChatMessage(rawText: string): FilterResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      allowed: false,
      reason: 'Message cannot be empty.',
    };
  }

  // 1. Length guard
  if (trimmed.length > 2000) {
    return {
      allowed: false,
      reason: 'Message exceeds maximum length of 2000 characters.',
    };
  }

  const rawLower = trimmed.toLowerCase();
  
  // Stripped text for detecting spaced/hyphenated words like "p a y m e n t" or "p-a-y-m-e-n-t"
  const stripped = rawLower.replace(/[^a-z0-9]/g, '');

  // 2. PAYMENT FILTER
  // A. Check stripped keywords
  for (const kw of STRIPPED_PAYMENT_KEYWORDS) {
    if (stripped.includes(kw)) {
      return {
        allowed: false,
        reason: 'Payment or financial discussions are not allowed in this chat. Please use the appropriate payment/contact channel.',
        filterType: 'payment',
      };
    }
  }

  // B. Check word boundary words
  for (const word of PAYMENT_WORDS) {
    const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
    if (wordRegex.test(rawLower)) {
      return {
        allowed: false,
        reason: 'Payment or financial discussions are not allowed in this chat. Please use the appropriate payment/contact channel.',
        filterType: 'payment',
      };
    }
  }

  // C. Check complex phrases & currencies
  for (const phrase of PAYMENT_PHRASES) {
    if (phrase.test(rawLower)) {
      return {
        allowed: false,
        reason: 'Payment or financial discussions are not allowed in this chat. Please use the appropriate payment/contact channel.',
        filterType: 'payment',
      };
    }
  }

  // 3. PERSONAL CHAT FILTER
  for (const pattern of PERSONAL_BLOCKED_PATTERNS) {
    if (pattern.test(rawLower)) {
      return {
        allowed: false,
        reason: 'Personal or non-project discussions are not allowed in this chat. Please keep conversation focused on the video deliverable.',
        filterType: 'personal',
      };
    }
  }

  return { allowed: true };
}
