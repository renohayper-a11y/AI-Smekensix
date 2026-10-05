module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({
        error: "Pesan belum diisi"
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: "API Key OpenRouter belum dipasang"
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "X-Title": "AI Smekensix"
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL,
          messages: [
            {
              role: "system",
              content:
                "Kamu adalah AI Smekensix buatan Reno. Jawab dengan jelas, ramah, dan membantu dalam bahasa Indonesia."
            },
            {
              role: "user",
              content: message
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
      reply:
        data.choices?.[0]?.message?.content ||
        "AI tidak memberikan jawaban."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Server AI Smekensix mengalami kesalahan"
    });
  }
};