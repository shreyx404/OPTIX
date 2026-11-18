/**
 * OPTIX - Morse Code & Adaptive Semantic Engine
 * Compliant with ITU-R M.1677-1 International Morse Code Standard
 */

export const MORSE_TABLE = {
  // Letters
  'A': '.-',     'B': '-...',   'C': '-.-.',   'D': '-..',
  'E': '.',      'F': '..-.',   'G': '--.',    'H': '....',
  'I': '..',     'J': '.---',   'K': '-.-',    'L': '.-..',
  'M': '--',     'N': '-.',     'O': '---',    'P': '.--.',
  'Q': '--.-',   'R': '.-.',    'S': '...',    'T': '-',
  'U': '..-',    'V': '...-',   'W': '.--',    'X': '-..-',
  'Y': '-.--',   'Z': '--..',

  // Numbers
  '1': '.----',  '2': '..---',  '3': '...--',  '4': '....-',  '5': '.....',
  '6': '-....',  '7': '--...',  '8': '---..',  '9': '----.',  '0': '-----',

  // Punctuation & Special
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.',  '(': '-.--.',  ')': '-.--.-',
  '&': '.-...',  ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.',  '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.'
};

// Reverse lookup table
export const REVERSE_MORSE = Object.entries(MORSE_TABLE).reduce((acc, [char, morse]) => {
  acc[morse] = char;
  return acc;
}, {});

// Emergency & Semantic Quick Presets
export const SEMANTIC_PRESETS = [
  { id: 'sos', label: 'SOS Emergency', code: 'SOS', category: 'critical', desc: 'General Distress / Immediate Danger' },
  { id: 'med', label: 'Medical Alert', code: 'MED HELP', category: 'critical', desc: 'Injured Person / Medic Required' },
  { id: 'fire', label: 'Fire Outbreak', code: 'FIRE EVAC', category: 'hazard', desc: 'Fire Reported / Evacuate Now' },
  { id: 'trap', label: 'Trapped / Rescue', code: 'TRAPPED SOS', category: 'critical', desc: 'Trapped in Location / Urgent Rescue' },
  { id: 'water', label: 'Supplies: Water', code: 'NEED WATER', category: 'supplies', desc: 'Drinking Water Critical Shortage' },
  { id: 'food', label: 'Supplies: Food', code: 'NEED FOOD', category: 'supplies', desc: 'Emergency Food Supplies Required' },
  { id: 'safe', label: 'Status: Safe', code: 'ALL SAFE', category: 'status', desc: 'Team is Safe / Situation Contained' },
  { id: 'ack', label: 'Acknowledge', code: 'ACK RCV', category: 'status', desc: 'Message Received & Understood' }
];

// Semantic Contraction rules to shorten verbose phrases for optical power saving.
// Deliberately avoids rewriting negated phrases so emergency meaning is never inverted.
const SEMANTIC_CONTRACTIONS = [
  { regex: /\b(please\s+help(\s+us)?|need\s+urgent\s+help|emergency)\b/gi, replacement: 'SOS' },
  { regex: /\b(doctor|medical\s+assistance|ambulance|medic|injured|hurt)\b/gi, replacement: 'MED' },
  { regex: /\b(fire|burning|smoke|flames)\b/gi, replacement: 'FIRE' },
  { regex: /\b(evacuate|get\s+out|leave\s+immediately|flee)\b/gi, replacement: 'EVAC' },
  { regex: /\b(we\s+are\s+safe|all\s+clear)\b/gi, replacement: 'SAFE' },
  { regex: /\b(stuck|trapped|collapsed|buried)\b/gi, replacement: 'TRAPPED' },
  { regex: /\b(drinking\s+water|clean\s+water|thirst)\b/gi, replacement: 'WATER' },
  { regex: /\b(food|rations|hunger|starving)\b/gi, replacement: 'FOOD' },
  { regex: /\b(understood|message\s+received|roger\s+that)\b/gi, replacement: 'ACK' }
];

// Negation tokens that must never be dropped or rewritten away
const NEGATION_PATTERN = /\b(no|not|never|without|none|cannot|can't|dont|don't)\b/i;

/**
 * Returns an array of unique non-whitespace characters that have no ITU-R M.1677-1 Morse mapping
 */
export function getUnsupportedChars(text) {
  if (!text) return [];
  const unsupported = new Set();
  for (const ch of Array.from(text.toUpperCase())) {
    if (/\s/.test(ch)) continue;
    if (!MORSE_TABLE[ch]) {
      unsupported.add(ch);
    }
  }
  return Array.from(unsupported);
}

/**
 * Text to Morse string
 * Character separator: space ' '
 * Word separator: slash ' / '
 */
export function textToMorse(text) {
  if (!text) return '';
  const clean = text.toUpperCase().trim();
  const words = clean.split(/\s+/);

  return words.map(word => {
    return word.split('').map(ch => MORSE_TABLE[ch] || '').filter(Boolean).join(' ');
  }).join(' / ');
}

/**
 * Morse string to Text
 */
export function morseToText(morse) {
  if (!morse) return '';
  const clean = morse.trim();
  const words = clean.split(/\s*\/\s*/);

  return words.map(wordMorse => {
    const letters = wordMorse.trim().split(/\s+/);
    return letters.map(code => REVERSE_MORSE[code] || '?').join('');
  }).join(' ');
}

/**
 * Validates a Morse code string
 */
export function validateMorse(morse) {
  if (!morse) return { valid: true, unknownTokens: [] };
  const tokens = morse.trim().split(/\s+/);
  const unknown = [];

  tokens.forEach(tok => {
    if (tok === '/') return;
    if (!REVERSE_MORSE[tok]) {
      unknown.push(tok);
    }
  });

  return {
    valid: unknown.length === 0,
    unknownTokens: unknown
  };
}

/**
 * Applies Adaptive Semantic Compression to reduce optical transmission duration
 */
export function applySemanticCompression(text) {
  if (!text) {
    return { compressed: '', original: '', originalUnits: 0, compressedUnits: 0, savingsPercent: 0, changed: false, preservedNegation: false };
  }
  const trimmed = text.trim();
  const hasNegation = NEGATION_PATTERN.test(trimmed);
  let result = trimmed;

  for (const rule of SEMANTIC_CONTRACTIONS) {
    // Never rewrite into SAFE when the message contains a negation (e.g. "not all clear")
    if (hasNegation && rule.replacement === 'SAFE') continue;
    result = result.replace(rule.regex, rule.replacement);
  }

  // Strip only non-semantic articles/prepositions; preserve subjects, possession, and negations
  // (e.g. keep "WE", "HAVE", "NEED", "NO", "NOT", "WITHOUT" intact).
  result = result.replace(/\b(the|a|an|is|are|our|in|at|to)\b/gi, ' ')
                 .replace(/\s{2,}/g, ' ')
                 .trim()
                 .toUpperCase();

  const normalizedOriginal = trimmed.replace(/\s{2,}/g, ' ').toUpperCase();
  const originalUnits = calculateMorseUnits(textToMorse(trimmed)).totalUnits;
  const compressedUnits = calculateMorseUnits(textToMorse(result)).totalUnits;
  const savings = originalUnits > 0 ? Math.max(0, Math.round(((originalUnits - compressedUnits) / originalUnits) * 100)) : 0;
  const changed = Boolean(result) && result !== normalizedOriginal && savings > 0;

  return {
    original: trimmed,
    compressed: result || normalizedOriginal,
    originalUnits,
    compressedUnits,
    savingsPercent: changed ? savings : 0,
    changed,
    preservedNegation: hasNegation
  };
}

/**
 * Calculates standard Paris standard Morse timing units
 * Dot = 1 unit
 * Dash = 3 units
 * Intra-character gap = 1 unit
 * Inter-character gap = 3 units
 * Word gap = 7 units
 */
export function calculateMorseUnits(morse) {
  if (!morse) return { totalUnits: 0, dotCount: 0, dashCount: 0, wordCount: 0, charCount: 0 };

  let totalUnits = 0;
  let dotCount = 0;
  let dashCount = 0;
  let charCount = 0;
  const words = morse.trim().split(/\s*\/\s*/);
  const wordCount = words.filter(Boolean).length;

  words.forEach((word, wIdx) => {
    const chars = word.trim().split(/\s+/).filter(Boolean);
    chars.forEach((chCode, cIdx) => {
      charCount++;
      for (let i = 0; i < chCode.length; i++) {
        const symbol = chCode[i];
        if (symbol === '.') {
          dotCount++;
          totalUnits += 1; // High
        } else if (symbol === '-') {
          dashCount++;
          totalUnits += 3; // High
        }
        if (i < chCode.length - 1) {
          totalUnits += 1; // Intra-character low
        }
      }
      if (cIdx < chars.length - 1) {
        totalUnits += 3; // Inter-character gap low
      }
    });

    if (wIdx < words.length - 1) {
      totalUnits += 7; // Word gap low
    }
  });

  return { totalUnits, dotCount, dashCount, wordCount, charCount };
}

/**
 * Converts WPM (Words Per Minute) to millisecond unit time using the standard PARIS formula
 * Standard standard: 1 WPM = 50 units per minute = 1200ms per unit
 */
export function wpmToUnitMs(wpm) {
  const safeWpm = Math.max(5, Math.min(60, Number(wpm) || 15));
  return Math.round(1200 / safeWpm);
}

export function unitMsToWpm(unitMs) {
  const safeMs = Math.max(20, Math.min(300, Number(unitMs) || 100));
  return Math.round(1200 / safeMs);
}

/**
 * Generates an array of optical pulse states for playback / simulation
 * Returns [{ state: boolean, durationMs: number, type: 'dot'|'dash'|'gap'|'charGap'|'wordGap', symbol?: string }]
 */
export function generateOpticalTimeline(morse, unitMs = 100) {
  if (!morse) return [];
  const timeline = [];
  const words = morse.trim().split(/\s*\/\s*/);

  words.forEach((word, wIdx) => {
    const chars = word.trim().split(/\s+/).filter(Boolean);
    chars.forEach((chCode, cIdx) => {
      for (let i = 0; i < chCode.length; i++) {
        const sym = chCode[i];
        if (sym === '.') {
          timeline.push({ state: true, durationMs: 1 * unitMs, type: 'dot', symbol: '.' });
        } else if (sym === '-') {
          timeline.push({ state: true, durationMs: 3 * unitMs, type: 'dash', symbol: '-' });
        }
        // Intra-character gap
        if (i < chCode.length - 1) {
          timeline.push({ state: false, durationMs: 1 * unitMs, type: 'gap' });
        }
      }
      // Inter-character gap
      if (cIdx < chars.length - 1) {
        timeline.push({ state: false, durationMs: 3 * unitMs, type: 'charGap' });
      }
    });
    // Word gap
    if (wIdx < words.length - 1) {
      timeline.push({ state: false, durationMs: 7 * unitMs, type: 'wordGap' });
    }
  });

  return timeline;
}
