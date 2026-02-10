export default async function handler(req, res) {
  // CORS 허용 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { image } = req.body;
  
  // [중요] 본인의 Gemini API 키를 여기에 직접 넣으세요 (공유 시 안전함)
  const apiKey = 'YOUR_ACTUAL_API_KEY_HERE'; 

  try {
    // 404 에러 방지를 위해 v1beta의 정식 경로를 사용합니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "이 이미지 속 문제를 분석하고 정답과 풀이를 한국어로 아주 자세히 설명해줘." },
            { inline_data: { mime_type: "image/jpeg", data: image } }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    // AI 답변에서 텍스트 데이터만 추출하여 전송합니다.
    const answerText = data.candidates[0].content.parts[0].text;
    res.status(200).json({ answer: answerText });

  } catch (err) {
    res.status(500).json({ error: '서버 연결 오류가 발생했습니다.' });
  }
}
