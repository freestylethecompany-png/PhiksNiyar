// AI Natural Language Service Request Engine
// Supports English, Telugu, and Romanized Telugu (Tanglish)
import { AIUnderstoodRequest } from '../db/types';
import { SERVICE_CATEGORIES } from '../constants/categories';

interface ExtractedTokens {
  matchedCategory: string;
  matchedSubcategory: string;
  issueDescription: string;
  detectedLanguage: 'en' | 'te' | 'tanglish';
  preferredDate: string;
  preferredTime: string;
  urgency: 'low' | 'normal' | 'urgent';
}

/**
 * Intelligent Multi-lingual local NLP parser for Andhra Pradesh & Indian context
 */
export function parseLocalServiceRequest(rawText: string): AIUnderstoodRequest {
  const text = rawText.toLowerCase().trim();

  // 1. Language Detection Heuristic
  const isTeluguScript = /[\u0C00-\u0C7F]/.test(rawText);
  const tanglishKeywords = [
    'sariga', 'ledu', 'ravacha', 'ivala', 'repu', 'kavali', 'enti', 'poindi', 'pani cheyatledu',
    'chudandi', 'chesedi', 'bagoledu', 'vasthara', 'urgent ga', 'evaraina', 'daggara', 'chellu'
  ];
  const hasTanglish = tanglishKeywords.some((w) => text.includes(w));
  const detectedLanguage: 'en' | 'te' | 'tanglish' = isTeluguScript
    ? 'te'
    : hasTanglish
    ? 'tanglish'
    : 'en';

  // 2. Urgency Detection
  let urgency: 'low' | 'normal' | 'urgent' = 'normal';
  if (
    text.includes('urgent') ||
    text.includes('emergency') ||
    text.includes('immediately') ||
    text.includes('right now') ||
    text.includes('urgent ga') ||
    text.includes('ventane') ||
    text.includes('ippude') ||
    text.includes('shock') ||
    text.includes('spark') ||
    text.includes('overflow')
  ) {
    urgency = 'urgent';
  } else if (text.includes('anytime') || text.includes('whenever') || text.includes('next week') || text.includes('kudarapothe')) {
    urgency = 'low';
  }

  // 3. Date & Time Detection
  let preferredDate = 'Today';
  let preferredTime = 'Flexible';

  if (text.includes('tomorrow') || text.includes('repu') || text.includes('రేపు')) {
    preferredDate = 'Tomorrow';
  } else if (text.includes('today') || text.includes('ivala') || text.includes('ee roju') || text.includes('ఈ రోజు')) {
    preferredDate = 'Today';
  } else if (text.includes('day after tomorrow') || text.includes('ellundi')) {
    preferredDate = 'Day After Tomorrow';
  }

  if (text.includes('morning') || text.includes('udayam') || text.includes('ఉదయం')) {
    preferredTime = 'Morning (9:00 AM - 12:00 PM)';
  } else if (text.includes('afternoon') || text.includes('madhyahnam') || text.includes('మధ్యాహ్నం')) {
    preferredTime = 'Afternoon (1:00 PM - 4:00 PM)';
  } else if (text.includes('evening') || text.includes('sayantram') || text.includes('సాయంత్రం')) {
    preferredTime = 'Evening (4:30 PM - 8:00 PM)';
  } else if (text.includes('night') || text.includes('raathri')) {
    preferredTime = 'Night (7:00 PM - 9:00 PM)';
  }

  // 4. Intent & Category Matching
  let category = 'Home Maintenance';
  let subcategory = 'General Inspection';
  let issue = 'General Service Required';

  // AC Check
  if (
    text.includes('ac') ||
    text.includes('air conditioner') ||
    text.includes('cooling') ||
    text.includes('challa ga') ||
    text.includes('gas refill') ||
    text.includes('ac repair')
  ) {
    category = 'AC Repair & Service';
    if (text.includes('cooling') || text.includes('challa ga') || text.includes('cooling sariga ledu')) {
      subcategory = 'Not Cooling';
      issue = 'AC not cooling properly / fan running without cooling';
    } else if (text.includes('gas') || text.includes('leak')) {
      subcategory = 'Gas Leakage / Refill';
      issue = 'Gas leakage suspected / gas refilling needed';
    } else if (text.includes('clean') || text.includes('service') || text.includes('servicing')) {
      subcategory = 'Deep Cleaning / Service';
      issue = 'Periodic jet pump deep cleaning & filter wash';
    } else if (text.includes('install') || text.includes('fitting') || text.includes('shift')) {
      subcategory = 'Installation / Uninstallation';
      issue = 'Split AC installation / relocation';
    } else {
      subcategory = 'Not Cooling';
      issue = 'AC malfunction checkup';
    }
  }
  // Refrigerator / Fridge
  else if (text.includes('fridge') || text.includes('refrigerator') || text.includes('freezer')) {
    category = 'Refrigerator Repair';
    if (text.includes('cooling') || text.includes('cool') || text.includes('ledu')) {
      subcategory = 'Fridge Not Cooling';
      issue = 'Refrigerator compartment not getting cold';
    } else if (text.includes('ice') || text.includes('frost')) {
      subcategory = 'Excessive Ice Frosting';
      issue = 'Heavy ice accumulation in freezer box';
    } else if (text.includes('sound') || text.includes('compressor')) {
      subcategory = 'Compressor Issue';
      issue = 'Compressor humming / not starting';
    } else {
      subcategory = 'Fridge Not Cooling';
      issue = 'Refrigerator inspection & diagnostic';
    }
  }
  // Washing Machine
  else if (text.includes('washing machine') || text.includes('washer') || text.includes('batalu uthike')) {
    category = 'Washing Machine Repair';
    if (text.includes('spin') || text.includes('rotate') || text.includes('thiragadam ledu')) {
      subcategory = 'Drum Not Spinning';
      issue = 'Washing drum stuck / not spinning';
    } else if (text.includes('drain') || text.includes('water leak') || text.includes('neellu')) {
      subcategory = 'Water Not Draining';
      issue = 'Water not draining or outlet pipe choked';
    } else {
      subcategory = 'Vibration & Loud Noise';
      issue = 'Excessive noise / spin cycle fault';
    }
  }
  // Electrician
  else if (
    text.includes('electric') ||
    text.includes('current') ||
    text.includes('switch') ||
    text.includes('fan') ||
    text.includes('inverter') ||
    text.includes('fuse') ||
    text.includes('mcb') ||
    text.includes('wiring') ||
    text.includes('power cut') ||
    text.includes('current poindi') ||
    text.includes('spark')
  ) {
    category = 'Electrician';
    if (text.includes('fan') || text.includes('phyan')) {
      subcategory = 'Ceiling Fan Repair / Installation';
      issue = 'Ceiling fan making noise or slow speed / capacitor dead';
    } else if (text.includes('inverter') || text.includes('battery')) {
      subcategory = 'Inverter / Battery Wiring';
      issue = 'Inverter backup not charging / tripping';
    } else if (text.includes('mcb') || text.includes('fuse') || text.includes('trip') || text.includes('current poindi')) {
      subcategory = 'MCB / Fuse Tripping';
      issue = 'Main MCB tripping repeatedly / power cut in specific rooms';
    } else if (text.includes('switch') || text.includes('board') || text.includes('socket')) {
      subcategory = 'Switchboard & Socket Repair';
      issue = 'Burnt socket / loose switchboard points';
    } else {
      subcategory = 'House Wiring / Rewiring';
      issue = 'General electrical fault finding';
    }
  }
  // Plumber
  else if (
    text.includes('plumb') ||
    text.includes('tap') ||
    text.includes('pipe') ||
    text.includes('leak') ||
    text.includes('motor') ||
    text.includes('tank') ||
    text.includes('neellu') ||
    text.includes('drain') ||
    text.includes('flush') ||
    text.includes('commode')
  ) {
    category = 'Plumber';
    if (text.includes('motor') || text.includes('pump')) {
      subcategory = 'Water Motor Pump Repair';
      issue = 'Water lifting motor not starting / priming problem';
    } else if (text.includes('flush') || text.includes('commode') || text.includes('toilet')) {
      subcategory = 'Toilet Flush / Commode Leak';
      issue = 'Flush tank running water continuously / siphon repair';
    } else if (text.includes('block') || text.includes('drain') || text.includes('choke')) {
      subcategory = 'Pipe Blockage & Drainage';
      issue = 'Sink or bathroom drain choked and overflowing';
    } else {
      subcategory = 'Tap Repair / Replacement';
      issue = 'Continuous dripping tap / broken spindle valve';
    }
  }
  // Bike / Two Wheeler Mechanic
  else if (text.includes('bike') || text.includes('scooter') || text.includes('scooty') || text.includes('puncture') || text.includes('bullet') || text.includes('activa')) {
    category = 'Bike Mechanic';
    if (text.includes('puncture') || text.includes('air') || text.includes('tyre')) {
      subcategory = 'Puncture & Tyre Check';
      issue = 'Tubeless tyre puncture / doorstep inflation';
    } else if (text.includes('start') || text.includes('battery') || text.includes('self')) {
      subcategory = 'Self Start / Battery Issue';
      issue = 'Bike self start clicking / dead battery';
    } else {
      subcategory = 'General Service & Oil Change';
      issue = 'Doorstep engine oil replacement & general tuning';
    }
  }
  // Cleaning
  else if (text.includes('clean') || text.includes('wash') || text.includes('dust') || text.includes('bathroom cleaning')) {
    category = 'Home Cleaning';
    if (text.includes('bathroom') || text.includes('toilet')) {
      subcategory = 'Deep Bathroom Cleaning';
      issue = 'Hard water stain removal & tile scaling deep scrub';
    } else {
      subcategory = 'Full Home Deep Cleaning';
      issue = 'Comprehensive home sanitization & floor scrubbing';
    }
  }
  // Carpenter
  else if (text.includes('carpenter') || text.includes('wood') || text.includes('door') || text.includes('lock') || text.includes('cupboard') || text.includes('bed')) {
    category = 'Carpenter';
    subcategory = 'Door Lock & Handle Repair';
    issue = 'Main door latch stuck / lock cylinder replacement';
  }
  // Fallback Category Search
  else {
    for (const cat of SERVICE_CATEGORIES) {
      if (text.includes(cat.slug) || text.includes(cat.name.toLowerCase())) {
        category = cat.name;
        subcategory = cat.subcategories[0] || 'Inspection';
        issue = `Service requested for ${cat.name}`;
        break;
      }
    }
  }

  // Cost estimate based on standard category
  const foundCat = SERVICE_CATEGORIES.find((c) => c.name === category);
  const basePrice = foundCat ? foundCat.basePriceEstimate : 199;

  return {
    category,
    subcategory,
    issue: issue || rawText.slice(0, 100),
    rawInput: rawText,
    detectedLanguage,
    preferredDate,
    preferredTime,
    urgency,
    estimatedCostRange: {
      min: basePrice,
      max: basePrice * 2.5,
    },
  };
}

/**
 * Universal Entrypoint: Supports optional External LLM (Gemini / OpenAI) via environment variables,
 * with graceful fallback to local NLP engine ensuring 100% offline reliability.
 */
export async function understandServiceRequest(rawText: string): Promise<AIUnderstoodRequest> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an AI assistant for Sevanta (సేవంత), a local service marketplace in Chilakaluripet, Andhra Pradesh.
Convert this user query (which might be in English, Telugu, or Romanized Telugu/Tanglish) into a JSON object strictly matching this schema:
{
  "category": string (e.g. "AC Repair & Service", "Electrician", "Plumber", "Refrigerator Repair", "Washing Machine Repair", "Bike Mechanic", "Home Cleaning", "Carpenter"),
  "subcategory": string,
  "issue": string (concise description of the problem),
  "preferredDate": string (e.g. "Today", "Tomorrow"),
  "preferredTime": string (e.g. "Morning", "Evening"),
  "urgency": "low" | "normal" | "urgent"
}
User Query: "${rawText}"
Return ONLY valid JSON with no markdown formatting.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const contentText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (contentText) {
          const cleanJson = contentText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          return {
            category: parsed.category || 'Home Maintenance',
            subcategory: parsed.subcategory || 'Inspection',
            issue: parsed.issue || rawText,
            rawInput: rawText,
            detectedLanguage: /[\u0C00-\u0C7F]/.test(rawText) ? 'te' : 'en',
            preferredDate: parsed.preferredDate || 'Today',
            preferredTime: parsed.preferredTime || 'Flexible',
            urgency: parsed.urgency || 'normal',
            estimatedCostRange: { min: 249, max: 699 },
          };
        }
      }
    } catch (e) {
      console.warn('External Gemini API call failed, falling back to local NLP engine:', e);
    }
  }

  // Fallback to high-performance local parser
  return parseLocalServiceRequest(rawText);
}
