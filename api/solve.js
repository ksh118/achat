export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { image } = req.body;
  
  // [보안] 본인의 API 키를 여기에 직접 넣으세요. 브라우저에는 노출되지 않습니다.
  const apiKey = 'YOUR_ACTUAL_API_KEY_HERE'; 

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "이 문제의 정답과 풀이를 한국어로 아주 자세히 설명해줘." },
            { inline_data: { mime_type: "image/jpeg", data: image } }
          ]
        }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    // AI 답변 텍스트만 추출하여 전달
    const resultText = data.candidates[0].content.parts[0].text;
    res.status(200).json({ answer: resultText });

  } catch (err) {
    res.status(500).json({ error: 'AI 분석 실패' });
  }
}
