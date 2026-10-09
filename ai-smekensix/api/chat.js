
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
        error: "Token Cloudflare belum dipasang"
      });
    }

    let prompt = message || "";

    // Foto atau file gambar
    let gambar = image || "";

    if (fileData && (fileType || "").startsWith("image/")) {
      gambar = fileData;
    }

    if (gambar) {
      const hasil = await fetch(
        "https://api.cloudflare.com/client/v4/accounts/" +
          accountId +
          "/ai/run/@cf/llava-hf/llava-1.5-7b-hf",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image: gambar.replace(
              /^data:image\/[^;]+;base64,/,
              ""
            ),
            prompt:
              prompt ||
              "Baca foto soal ini dan jawab dalam bahasa Indonesia."
          })
        }
      );

      const data = await hasil.json();

      if (!hasil.ok || !data.success) {
        return res.status(502).json({
          error:
            data.errors?.map(e => e.message).join(", ") ||
            "Gagal membaca foto"
        });
      }

      let reply =
        data.result?.description ||
        data.result?.response ||
        "Foto diterima, tetapi AI belum memberikan jawaban.";

      reply = String(reply).replace(
        /[*＊★☆✱✲✳✴✵✶✷✸✹✺✻✼✽✾✿]/g,
        ""
      );

      return res.status(200).json({
        reply: reply.trim()
      });
    }

    // PDF belum diaktifkan pada langkah ini
    if (
      fileData &&
      (
        (fileType || "") === "application/pdf" ||
        (fileName || "").toLowerCase().endsWith(".pdf")
      )
    ) {
      return res.status(400).json({
        error: "Fitur PDF sedang disiapkan. Chat teks tetap bisa digunakan."
      });
    }

    if (fileData) {
      return res.status(400).json({
        error: "Jenis file ini belum didukung."
      });
    }

    // Chat teks
    const hasil = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/" +
        accountId +
        "/ai/run/@cf/meta/llama-3.1-8b-instruct-fp8",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "Kamu adalah AI Smekensix buatan Reno. Jawab dengan jelas dan ramah dalam bahasa Indonesia. Gunakan teks biasa tanpa simbol bintang."
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

    const data = await hasil.json();

    if (!hasil.ok || !data.success) {
      return res.status(502).json({
        error:
          data.errors?.map(e => e.message).join(", ") ||
          "Cloudflare AI gagal menjawab"
      });
    }

    let reply =
      data.result?.response ||
      "AI belum memberikan jawaban.";

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
            
