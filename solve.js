export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image } = req.body;
  
  if (!image) {
    return res.status(400).json({ error: '이미지가 필요합니다.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('GEMINI_API_KEY가 설정되지 않았습니다.');
    return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { 
              text: `이 이미지 속 문제를 분석하고 풀어주세요.

다음 형식으로 답변해주세요:

📌 문제 분석
- 문제 유형과 핵심 개념을 간단히 설명

🔍 풀이 과정
- 단계별로 자세히 설명
- 각 단계의 이유를 함께 설명

✅ 정답
- 최종 답을 명확하게

💡 추가 팁
- 이런 유형의 문제를 풀 때 주의할 점

친절하고 자세하게 설명해주세요.` 
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
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `API 오류 (${response.status}): ${errorText.substring(0, 200)}` 
      });
    }

    const data = await response.json();

    if (data.error) {
      console.error('Gemini Error:', data.error);
      return res.status(400).json({ 
        error: data.error.message || 'AI 처리 중 오류가 발생했습니다.' 
      });
    }

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected response:', JSON.stringify(data));
      return res.status(500).json({ 
        error: 'AI가 응답을 생성하지 못했습니다. 이미지가 명확한지 확인해주세요.' 
      });
    }

    const answer = data.candidates[0].content.parts[0].text;
    
    res.status(200).json({ answer });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ 
      error: '서버 오류: ' + (err.message || '알 수 없는 오류') 
    });
  }
}
