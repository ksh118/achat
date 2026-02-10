export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { image } = req.body;
  
  // [보안] 이 키는 서버(Vercel) 내에서만 사용되며 사용자의 브라우저에는 전달되지 않습니다.
  // 여기에 본인의 실제 API 키를 넣으세요.
  const apiKey = 'YOUR_ACTUAL_API_KEY_HERE'; 

  try {
    // 안정적인 1.5-flash 모델 사용
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "이 문제의 정답과 풀이를 한국어로 아주 자세히 설명해줘.영어 문제면 영어랑 다른언어도 사용가능하고 문제가 아니거나 다른 이미지거나 제대로 확인이 안되면 인식할 수 없습니다. 다시 촬영해 주세요. 라고 뜨게해줘" },
            { inline_data: { mime_type: "image/jpeg", data: image } }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) return res.status(400).json({ error: data.error.message });

    // [중요] 텍스트만 추출하여 전송 (사용자 화면에 [object Object] 방지)
    const resultText = data.candidates[0].content.parts[0].text;
    res.status(200).json({ answer: resultText });

  } catch (err) {
    res.status(500).json({ error: 'AI 분석 실패: 서버 연결 확인 필요' });
  }
}
