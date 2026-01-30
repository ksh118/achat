export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { image, text } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    let contents = [{ parts: [] }];
    if (image) {
      contents[0].parts.push({ text: "이미지 속 문제를 풀고 한국어로 설명해줘." });
      contents[0].parts.push({ inline_data: { mime_type: "image/jpeg", data: image } });
    } else {
      contents[0].parts.push({ text: text });
    }

    // 모델명을 gemini-1.5-flash-latest 또는 gemini-pro로 시도해보세요.
    // 여기서는 가장 최신 안정화 명칭인 'gemini-1.5-flash'를 사용하되 URL 형식을 맞춥니다.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    const data = await response.json();

    // 만약 모델을 못 찾는다고 하면 'gemini-pro'로 자동 전환해서 재시도하는 로직을 추가했습니다.
    if (data.error && data.error.message.includes("not found")) {
        const fallback = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: text || "이미지 분석 부탁해" }] }] })
        });
        const fallbackData = await fallback.json();
        return res.status(200).json(fallbackData);
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'AI 연결 실패' });
  }
}
