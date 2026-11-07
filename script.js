
const loginPage = document.getElementById("loginPage");
const profilePage = document.getElementById("profilePage");
const appPage = document.getElementById("appPage");

const camera = document.getElementById("camera");
const preview = document.getElementById("preview");
const placeholder = document.getElementById("placeholder");
const uploadImage = document.getElementById("uploadImage");
const analyzeButton = document.getElementById("analyzeButton");
const resultCard = document.getElementById("resultCard");
const statusText = document.getElementById("status");

let model = null;
let stream = null;
let selectedImage = null;

// LOGIN
document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("loginName").value.trim();

    if (!name) return;

    document.getElementById("name").value = name;

    loginPage.hidden = true;
    profilePage.hidden = false;
});

// SIMPAN PROFIL
document.getElementById("profileForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();

    const programs = {
        balanced: "Pola makan seimbang",
        energy: "Menjaga energi",
        activity: "Mendukung aktivitas harian"
    };

    document.getElementById("userDisplay").textContent = name;

    document.getElementById("programDisplay").textContent =
        programs[document.getElementById("program").value];

    profilePage.hidden = true;
    appPage.hidden = false;

    loadAI();
});

// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", function() {
    stopCamera();

    appPage.hidden = true;
    loginPage.hidden = false;

    document.getElementById("loginForm").reset();
    document.getElementById("profileForm").reset();

    selectedImage = null;
    preview.removeAttribute("src");
    resultCard.hidden = true;
    analyzeButton.disabled = true;

    camera.style.display = "none";
    preview.style.display = "none";
    placeholder.style.display = "block";
});

// MEMUAT AI
async function loadAI() {
    if (model) return;

    statusText.textContent = "Memuat sistem AI...";

    try {
        model = await mobilenet.load();

        statusText.textContent =
            "AI siap digunakan. Silakan scan makanan.";

    } catch (error) {
        console.error(error);

        statusText.textContent =
            "Gagal memuat AI. Periksa koneksi internet.";
    }
}

// BUKA KAMERA
document.getElementById("openCamera").addEventListener("click", async function() {
    try {
        stopCamera();

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment"
            },
            audio: false
        });

        camera.srcObject = stream;
        await camera.play();

        camera.style.display = "block";
        preview.style.display = "none";
        placeholder.style.display = "none";

        selectedImage = camera;
        analyzeButton.disabled = false;
        resultCard.hidden = true;

        statusText.textContent = "Kamera aktif.";

    } catch (error) {
        console.error(error);

        statusText.textContent =
            "Kamera gagal dibuka. Izinkan akses kamera HP.";
    }
});

// AMBIL FOTO
document.getElementById("takePhoto").addEventListener("click", function() {
    if (!stream || camera.readyState < 2) {
        statusText.textContent = "Buka kamera terlebih dahulu.";
        return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;

    canvas.getContext("2d").drawImage(
        camera,
        0,
        0,
        canvas.width,
        canvas.height
    );

    selectedImage = canvas;

    preview.src = canvas.toDataURL("image/jpeg");

    preview.style.display = "block";
    camera.style.display = "none";
    placeholder.style.display = "none";

    stopCamera();

    analyzeButton.disabled = false;
    resultCard.hidden = true;

    statusText.textContent = "Foto berhasil diambil. Tekan Scan Makanan.";
});

// MATIKAN KAMERA
document.getElementById("stopCamera").addEventListener("click", function() {
    stopCamera();

    if (selectedImage === camera) {
        selectedImage = null;
        analyzeButton.disabled = true;
        placeholder.style.display = "block";
        camera.style.display = "none";
    }

    statusText.textContent = "Kamera dimatikan.";
});

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    camera.srcObject = null;
}

// UPLOAD FOTO
uploadImage.addEventListener("change", function(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        statusText.textContent = "File harus berupa gambar.";
        return;
    }

    stopCamera();

    const url = URL.createObjectURL(file);

    const image = new Image();

    image.onload = function() {
        selectedImage = image;

        preview.src = url;
        preview.style.display = "block";

        camera.style.display = "none";
        placeholder.style.display = "none";

        analyzeButton.disabled = false;
        resultCard.hidden = true;

        statusText.textContent =
            "Foto berhasil diupload. Tekan Scan Makanan.";
    };

    image.onerror = function() {
        URL.revokeObjectURL(url);
        statusText.textContent = "Foto gagal dibuka.";
    };

    image.src = url;
});

// DATABASE PERKIRAAN NUTRISI SATU PORSI
const foodDatabase = [
    {
        keywords: ["pizza"],
        name: "Pizza",
        carbs: 36, protein: 12, fat: 10
    },
    {
        keywords: ["cheeseburger", "hamburger"],
        name: "Burger",
        carbs: 30, protein: 17, fat: 15
    },
    {
        keywords: ["french fries"],
        name: "Kentang Goreng",
        carbs: 40, protein: 4, fat: 15
    },
    {
        keywords: ["hotdog"],
        name: "Hot Dog",
        carbs: 25, protein: 10, fat: 15
    },
    {
        keywords: ["ice cream"],
        name: "Es Krim",
        carbs: 25, protein: 4, fat: 10
    },
    {
        keywords: ["banana"],
        name: "Pisang",
        carbs: 27, protein: 1, fat: 0.3
    },
    {
        keywords: ["broccoli"],
        name: "Brokoli",
        carbs: 11, protein: 4, fat: 0.5
    },
    {
        keywords: ["strawberry"],
        name: "Stroberi",
        carbs: 12, protein: 1, fat: 0.5
    },
    {
        keywords: ["orange"],
        name: "Jeruk",
        carbs: 15, protein: 1, fat: 0.2
    },
    {
        keywords: ["burrito"],
        name: "Burrito",
        carbs: 50, protein: 18, fat: 15
    },
    {
        keywords: ["bagel"],
        name: "Bagel",
        carbs: 55, protein: 11, fat: 2
    }
];

// TOMBOL SCAN
analyzeButton.addEventListener("click", async function() {
    if (!selectedImage) {
        statusText.textContent = "Ambil atau upload foto terlebih dahulu.";
        return;
    }

    if (!model) {
        statusText.textContent = "AI sedang dimuat.";

        await loadAI();

        if (!model) return;
    }

    analyzeButton.disabled = true;
    statusText.textContent = "Sedang mengenali makanan...";

    try {
        const predictions = await model.classify(selectedImage, 5);

        console.log("Hasil AI:", predictions);

        let detectedFood = null;

        for (const prediction of predictions) {
            const label = prediction.className.toLowerCase();

            detectedFood = foodDatabase.find(food =>
                food.keywords.some(keyword => label.includes(keyword))
            );

            if (detectedFood) break;
        }

        if (!detectedFood) {
            resultCard.hidden = true;

            statusText.textContent =
                "Makanan belum dikenali. Coba foto yang lebih jelas.";

            return;
        }

        showResult(detectedFood);

        statusText.textContent = "Scan berhasil.";

    } catch (error) {
        console.error(error);

        statusText.textContent =
            "Terjadi kesalahan saat scan makanan.";

    } finally {
        analyzeButton.disabled = false;
    }
});

// HASIL KALORI DAN DIAGRAM
function showResult(food) {
    const carbCalories = food.carbs * 4;
    const proteinCalories = food.protein * 4;
    const fatCalories = food.fat * 9;

    const totalCalories =
        carbCalories + proteinCalories + fatCalories;

    const carbPercent = carbCalories / totalCalories * 100;
    const proteinPercent = proteinCalories / totalCalories * 100;

    const fatPercent = fatCalories / totalCalories * 100;

    document.getElementById("foodName").textContent =
        food.name;

    document.getElementById("totalCalories").textContent =
        Math.round(totalCalories) + " kkal";

    document.getElementById("chartCalories").textContent =
        Math.round(totalCalories);

    document.getElementById("carbsValue").textContent =
        food.carbs + " gram";

    document.getElementById("proteinValue").textContent =
        food.protein + " gram";

    document.getElementById("fatValue").textContent =
        food.fat + " gram";

    document.getElementById("pieChart").style.background =
        `conic-gradient(
            #d77fa4 0% ${carbPercent}%,
            #efb1c9 ${carbPercent}% ${carbPercent + proteinPercent}%,
            #f8dce7 ${carbPercent + proteinPercent}% 100%
        )`;

    resultCard.hidden = false;

    resultCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
