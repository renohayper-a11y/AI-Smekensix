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

    let userContent =
      message ||
      "Jawab dengan jelas dalam bahasa Indonesia.";

    // FOTO
    if (image) {
      userContent = [
        {
          type: "text",
          text:
            message ||
            "Baca foto soal ini dan jawab dalam bahasa Indonesia. Gunakan teks biasa. Jangan gunakan simbol bintang."
        },
        {
          type: "image_url",
          image_url: {
            url: image
          }
        }
      ];
    }

    // FILE
    if (fileData) {
      const nama = fileName || "file";
      const tipe = fileType || "";

      // GAMBAR
      if (tipe.startsWith("image/")) {
        userContent = [
          {
            type: "text",
            text:
              "Baca dan analisis file gambar " +
              nama +
              ". Jawab dalam bahasa Indonesia dengan jelas. Jangan gunakan simbol bintang."
          },
          {
            type: "image_url",
            image_url: {
              url: fileData
            }
          }
        ];
      }

      // PDF
      else if (
        tipe === "application/pdf" ||
        nama.toLowerCase().endsWith(".pdf")
      ) {
        userContent = [
          {
            type: "text",
            text:
              "Baca file PDF bernama " +
              nama +
              ". Jelaskan dan jawab isi atau pertanyaan dari file tersebut dalam bahasa Indonesia. Jangan gunakan Markdown dan jangan gunakan simbol bintang."
          },
          {
            type: "file",
            file: {
              filename: nama,
              file_data: fileData
            }
          }
        ];
      }

      // FILE TEKS
      else if (
        tipe.startsWith("text/") ||
        nama.toLowerCase().endsWith(".txt") ||
        nama.toLowerCase().endsWith(".csv") ||
        nama.toLowerCase().endsWith(".html") ||
        nama.toLowerCase().endsWith(".css") ||
        nama.toLowerCase().endsWith(".js") ||
        nama.toLowerCase().endsWith(".json")
      ) {
        const bagian = fileData.split(",")[1] || "";

        const isiFile = Buffer.from(
          bagian,
          "base64"
        ).toString("utf8");

        userContent =
          "Baca dan analisis file berikut.\n\n" +
          "Nama file: " +
          nama +
          "\n\nIsi file:\n" +
          isiFile;
      }

      // FILE LAIN
      else {
        userContent =
          "Saya mengunggah file bernama " +
          nama +
          ". Jenis file: " +
          tipe +
          ". Jelaskan isi atau kegunaan file tersebut jika dapat diproses.";
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
          ],

          plugins: [
            {
              id: "file-parser"
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

    // HAPUS SEMUA SIMBOL BINTANG
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
        error?.message ||
        "Server AI Smekensix mengalami kesalahan"
    });
  }
};
