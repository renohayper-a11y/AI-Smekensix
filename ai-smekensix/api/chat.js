module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  try {
    const { message, image } = req.body || {};

    if (!message && !image) {
      return res.status(400).json({
        error: "Pesan atau foto belum dikirim"
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL;

    if (!apiKey) {
      return res.status(500).json({
        error: "API Key OpenRouter belum dipasang"
      });
    }

    if (!model) {
      return res.status(500).json({
        error: "Model OpenRouter belum dipasang"
      });
    }

    let userContent = message || "Baca foto ini dan jawab dengan jelas.";

    if (image) {
      userContent = [
        {
          type: "text",
          text: message || "Baca foto soal ini dan jawab dengan jelas dalam bahasa Indonesia."
        },
        {
          type: "image_url",
          image_url: {
            url: image
          }
        }
      ];
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "Content-Type": "application/json",
          "X-Title": "AI Smekensix"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "Kamu adalah AI Smekensix buatan Reno. Jawab dengan jelas, ramah, dan membantu dalam bahasa Indonesia."
            },
            {
              role: "user",
              content: userContent
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenRouter mengalami masalah"
      });
    }

    return res.status(200).json({
      reply: data?.choices?.[0]?.message?.content || "AI tidak memberikan jawaban."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Server AI Smekensix mengalami kesalahan"
    });
  }
};
