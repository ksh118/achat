export default async function handler(req, res) {
  const { image, text } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  let prompt = "";
  let contents = [{ parts: [] }];

  if (image) {
    contents[0].parts.push({ text: "이미지 속 문제를 풀고 설명해줘." });
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
}
