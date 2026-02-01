export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { image } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    // gemini-pro 대신 최신 모델인 1.5-flash 사용 (에러 방지)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "이 이미지 속 문제를 풀고 한국어로 정답과 해설을 자세히 설명해줘." },
            { inline_data: { mime_type: "image/jpeg", data: image } }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) return res.status(400).json({ error: data.error.message });

    // [핵심] 객체가 아닌 '텍스트 문자열'만 추출해서 전송
    const aiAnswer = data.candidates[0].content.parts[0].text;
    res.status(200).json({ answer: aiAnswer });

  } catch (err) {
    res.status(500).json({ error: 'AI 연결 실패' });
  }
}
