module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method tidak diizinkan"
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
        error: "Pesan, foto, atau file belum dikirim"
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

    let userContent = message || "Jawab dengan jelas dalam bahasa Indonesia.";

    if (image) {
      userContent = [
        {
          type: "text",
          text:
            message ||
            "Baca foto soal ini dan jawab dalam bahasa Indonesia. Gunakan teks biasa. Jangan gunakan Markdown dan jangan gunakan simbol bintang."
        },
        {
          type: "image_url",
          image_url: {
            url: image
          }
        }
      ];
    }

    if (fileData) {
      const nama = fileName || "file";
      const tipe = fileType || "";

      if (tipe.startsWith("image/")) {
        userContent = [
          {
            type: "text",
            text:
              "Baca dan analisis file gambar " +
              nama +
              ". Jawab dalam bahasa Indonesia. Gunakan teks biasa. Jangan gunakan Markdown dan jangan gunakan simbol bintang."
          },
          {
            type: "image_url",
            image_url: {
              url: fileData
            }
          }
        ];
      } else if (
        tipe.startsWith("text/") ||
        nama.endsWith(".txt") ||
        nama.endsWith(".csv") ||
        nama.endsWith(".html") ||
        nama.endsWith(".css") ||
        nama.endsWith(".js") ||
        nama.endsWith(".json")
      ) {
        const bagian = fileData.split(",")[1] || "";

        const isiFile = Buffer.from(
          bagian,
          "base64"
        ).toString("utf8");

        userContent =
          "Baca file berikut dan bantu saya menjawab atau menganalisisnya.\n\n" +
          "Nama file: " +
          nama +
          "\n\nIsi file:\n" +
          isiFile;
      } else {
        userContent =
          "Saya mengunggah file bernama " +
          nama +
          ". Jenis file: " +
          tipe +
          ". Jelaskan apakah file ini dapat diproses dan apa yang perlu dilakukan untuk membacanya.";
      }
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
              content:
                "Kamu adalah AI Smekensix buatan Reno. Jawab dalam bahasa Indonesia dengan jelas dan membantu. Gunakan teks biasa. Jangan gunakan Markdown. Jangan gunakan tanda bintang atau simbol bintang."
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
        error:
          data?.error?.message ||
          "OpenRouter mengalami masalah"
      });
    }

    let reply =
      data?.choices?.[0]?.message?.content ||
      "AI tidak memberikan jawaban.";

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
      error:
        "Server AI Smekensix mengalami kesalahan"
    });
  }
};
