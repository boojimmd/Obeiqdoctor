exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // CORS preflight
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { messages } = JSON.parse(event.body);

    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid messages' }) };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: `تو مشاور بالینی متخصص چاقی و GLP-1 هستی — نام تو ObesiQ AI است.
پاسخ‌ها:
- فارسی، کوتاه، بالینی
- با اعداد و دوزهای مشخص
- بر اساس گایدلاین‌های ADA 2025، KDIGO 2024، ESC 2023، ESHRE 2025
- مخاطب: پزشک متخصص (نه بیمار)
- حداکثر ۱۵۰ کلمه
- اگر خارج از حوزه چاقی/GLP-1 است: «این سوال خارج از تخصص من است» بگو`,
        messages: messages
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'AI unavailable' }) };
    }

    const data = await response.json();
    const reply = data.content && data.content[0] && data.content[0].text
      ? data.content[0].text
      : 'پاسخی دریافت نشد.';

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
