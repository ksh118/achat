export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image } = req.body;
  
  // 이미지 데이터 검증
  if (!image) {
    return res.status(400).json({ error: '이미지 데이터가 필요합니다.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  // API 키 검증
  if (!apiKey) {
    console.error('GEMINI_API_KEY가 설정되지 않았습니다.');
    return res.status(500).json({ error: 'API 키가 설정되지 않았습니다. 관리자에게 문의하세요.' });
  }

  try {
    // Gemini 1.5 Flash 모델 사용
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { 
              text: `이미지 속 문제를 분석하고 다음 형식으로 답변해주세요:

1. 문제 유형과 주제
2. 단계별 풀이 과정
3. 최종 답
4. 추가 설명이나 팁

한국어로 자세하고 친절하게 설명해주세요.` 
            },
            { 
              inline_data: { 
                mime_type: "image/jpeg", 
                data: image 
              } 
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        }
      })
    });

    // 응답 확인
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return res.status(response.status).json({ 
        error: `Gemini API 오류: ${response.status}` 
      });
    }

    const data = await response.json();

    // 에러 체크
    if (data.error) {
      console.error('Gemini returned error:', data.error);
      return res.status(400).json({ error: data.error.message || 'AI 처리 중 오류가 발생했습니다.' });
    }

    // 응답 데이터 검증
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Unexpected response structure:', data);
      return res.status(500).json({ error: 'AI 응답 형식이 올바르지 않습니다.' });
    }

    // AI 답변 추출 (텍스트 문자열만)
    const aiAnswer = data.candidates[0].content.parts[0].text;
    
    // 성공 응답
    res.status(200).json({ answer: aiAnswer });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ 
      error: 'AI 연결 실패: ' + (err.message || '알 수 없는 오류') 
    });
  }
}
