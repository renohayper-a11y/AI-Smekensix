const pdfParse = require("pdf-parse");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metode tidak diizinkan" });
  }

  try {
    const { message, image, fileName, fileType, fileData } = req.body || {};
    const token = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = "286bedaef1027dcf1e11660acbe57c01";

    if (!token) {
      return res.status(500).json({ error: "Token Cloudflare belum dipasang" });
    }

    if (!message && !image && !fileData) {
      return res.status(400).json({ error: "Pesan belum dikirim" });
    }

    let prompt = message || "";
    let gambar = image || "";

    if (fileData && (fileType || "").startsWith("image/")) {
      gambar = fileData;
    }

    // Membaca foto
    if (gambar) {
      const hasil = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image: gambar.replace(/^data:image\/[^;]+;base64,/, ""),
            prompt: prompt || "Baca foto ini dan jawab dalam bahasa Indonesia."
          })
        }
      );

      const data = await hasil.json();

      if (!hasil.ok || !data.success) {
        return res.status(502).json({
          error: data.errors?.map(e => e.message).join(", ") || "Gagal membaca foto"
        });
      }

      const reply = String(
        data.result?.description || data.result?.response || "Foto belum dapat dijawab."
      ).replace(/[*＊★☆✱✲✳✴✵✶✷✸✹✺✻✼✽✾✿]/g, "");

      return res.status(200).json({ reply: reply.trim() });
    }

    // Membaca teks PDF
    if (fileData && (
      fileType === "application/pdf" ||
      (fileName || "").toLowerCase().endsWith(".pdf")
    )) {
      const base64 = fileData.replace(/^data:application\/pdf;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      const pdf = await pdfParse(buffer);
      const teks = (pdf.text || "").trim();

      if (!teks) {
        return res.status(400).json({
          error: "PDF tidak memiliki teks yang bisa dibaca. PDF hasil scan memerlukan OCR."
        });
      }

      prompt =
        (message || "Jelaskan isi PDF ini dalam bahasa Indonesia.") +
        "\n\nIsi PDF:\n" + teks.slice(0, 12000);
    } else if (fileData) {
      return res.status(400).json({
        error: "Format belum didukung. Gunakan PDF atau gambar."
      });
    }

    // Chat teks atau pertanyaan tentang PDF
    const hasil = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct-fp8`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "Kamu adalah AI Smekensix buatan Reno. Jawab jelas dan ramah dalam bahasa Indonesia. Jangan gunakan simbol bintang."
            },
            { role: "user", content: prompt }
          ],
          max_tokens: 512
        })
      }
    );

    const data = await hasil.json();

    if (!hasil.ok || !data.success) {
      return res.status(502).json({
        error: data.errors?.map(e => e.message).join(", ") || "Cloudflare AI gagal menjawab"
      });
    }

    const reply = String(
      data.result?.response || "AI belum memberikan jawaban."
    ).replace(/[*＊★☆✱✲✳✴✵✶✷✸✹✺✻✼✽✾✿]/g, "");

    return res.status(200).json({ reply: reply.trim() });

  } catch (error) {
    console.error("Kesalahan AI Smekensix:", error);

    return res.status(500).json({
      error: "Server gagal memproses pesan atau PDF."
    });
  }
};
