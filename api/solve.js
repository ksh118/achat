export default async function handler(req, res) {
  // CORS 및 메서드 체크
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { image } = req.body;
  
  // 사용자님이 보내주신 실제 API 키입니다.
  const apiKey = 'AIzaSyAzF6xtF1ncr4CHSAWJWdrJ4pD4DJTxpvs'; 

  try {
    // 404 에러를 방지하는 가장 정확한 API 주소입니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "이 이미지의 문제를 분석해서 정답과 풀이를 한국어로 자세히 설명해줘." },
            { inline_data: { mime_type: "image/jpeg", data: image } }
          ]
        }]
      })
    });

    const data = await response.json();

    // API 응답 에러 처리
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    // 결과 텍스트만 추출
    const resultText = data.candidates[0].content.parts[0].text;
    res.status(200).json({ answer: resultText });

  } catch (err) {
    res.status(500).json({ error: 'AI 서버 연결 실패: ' + err.message });
  }
}
