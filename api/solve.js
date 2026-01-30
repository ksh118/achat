export default async function handler(req, res) {
  // POST 요청이 아니면 바로 차단
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 가능합니다.' });
  }

  const { image, text } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    let contents = [{ parts: [] }];
    if (image) {
      contents[0].parts.push({ text: "이미지 속 문제를 단계별로 풀고 정답을 알려줘." });
      contents[0].parts.push({ inline_data: { mime_type: "image/jpeg", data: image } });
    } else {
      contents[0].parts.push({ text: text });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: '서버 분석 오류' });
  }
}
