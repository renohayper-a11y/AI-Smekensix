
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Metode tidak diizinkan"
    });
  }

  try {
    const {
      message,
      image,
      fileName,
      fileType,
      fileData
    } = req.body || {};

    if (!message && !image && !fileData) {
      return res.status(400).json({
        error: "Pesan belum dikirim"
      });
    }

    const token = process.env.CLOUDFLARE_API_TOKEN;

    const accountId =
      "286bedaef1027dcf1e11660acbe57c01";

    if (!token) {
      return res.status(500).json({
        error: "Token Cloudflare belum dipasang di Vercel"
      });
    }

    let prompt = message || "";

    if (image || fileData) {
      return res.status(400).json({
        error: "Untuk sementara, kirim pertanyaan berupa teks saja. Fitur foto dan PDF belum diaktifkan pada Cloudflare."
      });
    }

    if (fileName) {
      prompt += "\nNama file: " + fileName;
    }

    const response = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/" +
        accountId +
        "/ai/run/@cf/meta/llama-3.1-8b-instruct-fp8",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "Kamu adalah AI Smekensix buatan Reno. Jawab dengan jelas, ramah, dan membantu dalam bahasa Indonesia. Gunakan teks biasa tanpa simbol bintang."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 512
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      return res.status(502).json({
        error:
          data.errors?.map(e => e.message).join(", ") ||
          "Cloudflare AI gagal menjawab"
      });
    }

    let reply = data.result?.response || "AI belum memberikan jawaban.";

    reply = String(reply).replace(
      /[*＊★☆✱✲✳✴✵✶✷✸✹✺✻✼✽✾✿]/g,
      ""
    );

    return res.status(200).json({
      reply: reply.trim()
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Server AI Smekensix mengalami kesalahan"
    });
  }
};
