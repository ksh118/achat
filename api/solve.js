export default async function handler(req, res) {
  // 405 에러 방지: POST 요청이 아니면 거절함
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image, text } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key가 설정되지 않았습니다.' });
  }

  try {
    let contents = [{ parts: [] }];

    if (image) {
      contents[0].parts.push({ text: "이미지 속 문제를 풀고 한국어로 설명해줘." });
      contents[0].parts.push({ inline_data: { mime_type: "image/jpeg", data: image } });
    } else {
      contents[0].parts.push({ text: text });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    const data = await response.json();
    
    // Gemini API 응답 에러 체크
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}
