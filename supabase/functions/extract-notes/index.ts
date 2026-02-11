import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractedNote {
  name: string;
  type: "top" | "heart" | "base";
  confidence: number;
}

interface ExtractedEmotion {
  emotion: string;
  confidence: number;
}

const COMMON_NOTES = [
  // Top notes
  "bergamot", "lemon", "orange", "grapefruit", "lime", "mandarin", "pink pepper", "black pepper", "cardamom", "ginger", "saffron", "lavender", "basil", "mint", "eucalyptus",
  // Heart notes
  "rose", "jasmine", "ylang-ylang", "iris", "violet", "peony", "lily", "tuberose", "magnolia", "geranium", "freesia", "neroli", "orange blossom", "gardenia",
  // Base notes
  "vanilla", "sandalwood", "cedarwood", "oud", "musk", "amber", "patchouli", "vetiver", "tonka bean", "benzoin", "leather", "tobacco", "incense", "myrrh", "frankincense", "oakmoss", "labdanum", "cashmeran", "ambroxan"
];

const NOTE_TYPES: Record<string, "top" | "heart" | "base"> = {
  // Top notes
  "bergamot": "top", "lemon": "top", "orange": "top", "grapefruit": "top", "lime": "top", "mandarin": "top", "pink pepper": "top", "black pepper": "top", "cardamom": "top", "ginger": "top", "saffron": "top", "lavender": "top", "basil": "top", "mint": "top", "eucalyptus": "top",
  // Heart notes
  "rose": "heart", "jasmine": "heart", "ylang-ylang": "heart", "iris": "heart", "violet": "heart", "peony": "heart", "lily": "heart", "tuberose": "heart", "magnolia": "heart", "geranium": "heart", "freesia": "heart", "neroli": "heart", "orange blossom": "heart", "gardenia": "heart",
  // Base notes
  "vanilla": "base", "sandalwood": "base", "cedarwood": "base", "oud": "base", "musk": "base", "amber": "base", "patchouli": "base", "vetiver": "base", "tonka bean": "base", "benzoin": "base", "leather": "base", "tobacco": "base", "incense": "base", "myrrh": "base", "frankincense": "base", "oakmoss": "base", "labdanum": "base", "cashmeran": "base", "ambroxan": "base"
};

const EMOTIONS = ["luxurious", "confident", "magnetic", "fresh", "joyful", "nostalgic", "mysterious", "elegant", "powerful", "romantic", "cozy", "energizing", "sophisticated", "playful", "sensual", "warm", "cool", "bold", "subtle", "exotic"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { postId, content, fragranceName, brandName } = await req.json();

    if (!postId || !content) {
      return new Response(
        JSON.stringify({ error: "postId and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create extraction record
    await supabase
      .from("ai_extracted_notes")
      .upsert({
        post_id: postId,
        extracted_notes: [],
        processing_status: "processing",
      }, { onConflict: "post_id" });

    // Call AI to extract notes and emotions
    const systemPrompt = `You are a fragrance expert AI that extracts perfume notes and emotional characteristics from user reviews.

Given a fragrance review, identify:
1. Fragrance notes mentioned (top, heart, base notes)
2. Emotions/feelings the fragrance evokes

Return a JSON object with this structure:
{
  "notes": [
    {"name": "Rose", "type": "heart", "confidence": 0.95}
  ],
  "emotions": [
    {"emotion": "Romantic", "confidence": 0.88}
  ]
}

Common fragrance notes include: ${COMMON_NOTES.join(", ")}
Common fragrance emotions: ${EMOTIONS.join(", ")}

Only include notes/emotions you're confident about (confidence > 0.6).
Capitalize note and emotion names properly.`;

    const userPrompt = `Fragrance: ${fragranceName}${brandName ? ` by ${brandName}` : ""}

Review:
${content}

Extract the fragrance notes and emotions from this review.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted, please add more credits" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response
    let extractedNotes: ExtractedNote[] = [];
    let extractedEmotions: ExtractedEmotion[] = [];

    try {
      // Extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        extractedNotes = (parsed.notes || []).filter((n: ExtractedNote) => n.confidence >= 0.6);
        extractedEmotions = (parsed.emotions || []).filter((e: ExtractedEmotion) => e.confidence >= 0.6);
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fall back to keyword matching
      const lowerContent = content.toLowerCase();
      
      for (const note of COMMON_NOTES) {
        if (lowerContent.includes(note.toLowerCase())) {
          extractedNotes.push({
            name: note.charAt(0).toUpperCase() + note.slice(1),
            type: NOTE_TYPES[note] || "heart",
            confidence: 0.7
          });
        }
      }

      for (const emotion of EMOTIONS) {
        if (lowerContent.includes(emotion.toLowerCase())) {
          extractedEmotions.push({
            emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
            confidence: 0.7
          });
        }
      }
    }

    // Update extraction record
    const { error: updateError } = await supabase
      .from("ai_extracted_notes")
      .update({
        extracted_notes: extractedNotes,
        extracted_emotions: extractedEmotions,
        processing_status: "completed",
        processed_at: new Date().toISOString(),
      })
      .eq("post_id", postId);

    if (updateError) {
      console.error("Error updating extraction record:", updateError);
      throw updateError;
    }

    // Also insert the extracted notes into fragrance_notes table if not already present
    if (extractedNotes.length > 0) {
      const { data: existingNotes } = await supabase
        .from("fragrance_notes")
        .select("name")
        .eq("post_id", postId);

      const existingNames = new Set((existingNotes || []).map(n => n.name.toLowerCase()));
      const newNotes = extractedNotes.filter(n => !existingNames.has(n.name.toLowerCase()));

      if (newNotes.length > 0) {
        await supabase
          .from("fragrance_notes")
          .insert(newNotes.map(note => ({
            post_id: postId,
            name: note.name,
            note_type: note.type,
          })));
      }
    }

    // Similarly for emotions
    if (extractedEmotions.length > 0) {
      const { data: existingEmotions } = await supabase
        .from("post_emotions")
        .select("emotion")
        .eq("post_id", postId);

      const existingEmotionNames = new Set((existingEmotions || []).map(e => e.emotion.toLowerCase()));
      const newEmotions = extractedEmotions.filter(e => !existingEmotionNames.has(e.emotion.toLowerCase()));

      if (newEmotions.length > 0) {
        await supabase
          .from("post_emotions")
          .insert(newEmotions.map(emotion => ({
            post_id: postId,
            emotion: emotion.emotion,
          })));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notes: extractedNotes,
        emotions: extractedEmotions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Extract notes error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
