export default async function handler(req, res) {
  // POST 요청인지 확인
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; // Vercel 설정에서 넣을 비밀 키

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "이 사진 속 문제를 인식해서 단계별 풀이와 최종 정답을 한국어로 설명해줘." },
            { inline_data: { mime_type: "image/jpeg", data: image } }
          ]
        }]
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'AI 분석 중 오류가 발생했습니다.' });
  }
}
