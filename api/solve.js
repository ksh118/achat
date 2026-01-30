export default async function handler(req, res) {
  const { image, text } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  let parts = [];
  if (image) {
    parts.push({ text: "이 사진 속 문제를 풀고 설명해줘." });
    parts.push({ inline_data: { mime_type: "image/jpeg", data: image } });
  } else if (text) {
    parts.push({ text: text + " (이전 대화 맥락을 고려해서 답변해줘)" });
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] })
  });

  const data = await response.json();
  res.status(200).json(data);
}
