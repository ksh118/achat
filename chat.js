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

  const { image, question, history = [] } = req.body;
  
  if (!image || !question) {
    return res.status(400).json({ error: '이미지와 질문이 필요합니다.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('GEMINI_API_KEY가 설정되지 않았습니다.');
    return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
  }

  try {
    // 대화 컨텍스트 구성
    let conversationContext = "이전 대화:\n";
    
    // 최근 메시지만 포함 (이미지 제외)
    history.slice(-6).forEach(msg => {
      if (msg.type === 'user' && !msg.image) {
        conversationContext += `사용자: ${msg.content}\n`;
      } else if (msg.type === 'ai') {
        conversationContext += `AI: ${msg.content}\n`;
      }
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { 
              text: `당신은 친절한 AI 선생님입니다. 학생이 문제에 대해 추가 질문을 했습니다.

${conversationContext}

학생의 새로운 질문: ${question}

위 대화 내용을 참고하여 학생의 질문에 친절하고 자세하게 답변해주세요. 
이전에 설명한 문제와 관련된 질문이라면 그 맥락을 이어서 설명해주세요.` 
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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
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
        error: `API 오류 (${response.status})` 
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
        error: 'AI가 응답을 생성하지 못했습니다.' 
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
