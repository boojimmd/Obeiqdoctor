exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { messages } = JSON.parse(event.body);

    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid messages' }) };
    }

    const SYSTEM = `تو مشاور بالینی متخصص چاقی و GLP-1 هستی — نام تو ObesiQ AI است.
پاسخ‌ها:
- فارسی، کوتاه، بالینی
- با اعداد و دوزهای مشخص
- بر اساس گایدلاین‌های ADA 2025، KDIGO 2024، ESC 2023، ESHRE 2025
- مخاطب: پزشک متخصص (نه بیمار)
- حداکثر ۱۵۰ کلمه
- اگر خارج از حوزه چاقی/GLP-1 است بگو: این سوال خارج از تخصص من است`;

    // Convert messages to Gemini format
    const geminiContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const apiKey = process.env.GEMINI_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: geminiContents,
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.3
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini error:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'AI unavailable' }) };
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'پاسخی دریافت نشد.';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
