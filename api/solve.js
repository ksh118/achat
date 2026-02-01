export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { image } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    // 1.5-flash 모델 사용 (안정성 확보)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "이 이미지의 문제를 풀고 정답과 해설을 한국어로 자세히 알려줘." },
            { inline_data: { mime_type: "image/jpeg", data: image } }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) return res.status(400).json({ error: data.error.message });

    // 여기서 텍스트만 뽑아서 전달해야 함!
    const resultText = data.candidates[0].content.parts[0].text;
    res.status(200).json({ answer: resultText });

  } catch (err) {
    res.status(500).json({ error: '서버 오류: ' + err.message });
  }
}
