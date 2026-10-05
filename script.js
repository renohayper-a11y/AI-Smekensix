function kirim() {
    const input = document.getElementById("pertanyaan");
    const chat = document.getElementById("chat");
    const pesan = input.value.trim();

    if (pesan === "") return;

    chat.innerHTML += `<div class="user">${pesan}</div>`;

    const teks = pesan.toLowerCase();
    let jawaban = "";

    if (teks.includes("halo") || teks.includes("hai") || teks.includes("hi")) {
        jawaban = "Halo 👋 Saya Smekensix. Ada yang bisa saya bantu?";
    }
    else if (teks.includes("siapa kamu")) {
        jawaban = "Saya AI Smekensix 🤖, asisten digital yang sedang kamu buat.";
    }
    else if (teks.includes("nama kamu")) {
        jawaban = "Nama saya Smekensix 🤖.";
    }
    else if (teks.includes("apa kabar")) {
        jawaban = "Saya baik dan siap membantu kamu 😄.";
    }
    else if (teks.includes("terima kasih") || teks.includes("makasih")) {
        jawaban = "Sama-sama 😊.";
    }
    else if (teks.includes("jam")) {
        jawaban = "Sekarang waktu perangkat kamu menunjukkan " +
            new Date().toLocaleTimeString("id-ID");
    }
    else if (teks.includes("tanggal")) {
        jawaban = "Hari ini " +
            new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            });
    }
    else if (teks.includes("belajar")) {
        jawaban = "Tentu 📚. Saya bisa membantu menjelaskan materi dengan bahasa yang sederhana.";
    }
    else if (teks.includes("coding") || teks.includes("koding")) {
        jawaban = "Saya bisa membantu kamu belajar coding langkah demi langkah 💻.";
    }
    else if (teks.includes("bantu")) {
        jawaban = "Tentu 👍 Jelaskan apa yang ingin kamu kerjakan.";
    }
    else {
        jawaban =
            "Saya masih belajar 🤖. Coba tanyakan tentang coding, belajar, tanggal, waktu, atau perkenalkan diri.";
    }

    chat.innerHTML += `<div class="bot">${jawaban}</div>`;

    input.value = "";

    localStorage.setItem(
        "riwayatSmekensix",
        chat.innerHTML
    );
}


function hapusRiwayat() {
    localStorage.removeItem("riwayatSmekensix");

    document.getElementById("chat").innerHTML =
        '<div class="bot">Halo 👋 Saya Smekensix!</div>';
}


window.onload = function () {
    const riwayat =
        localStorage.getItem("riwayatSmekensix");

    if (riwayat) {
        document.getElementById("chat").innerHTML =
            riwayat;
    }
};