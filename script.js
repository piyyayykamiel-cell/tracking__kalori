// ==========================================
// FOODSCAN - PIYYA 💗
// AI ONLINE FOOD RECOGNITION
// ==========================================

// GANTI DENGAN URL CLOUDFLARE WORKER KAMU
const SCAN_API_URL = "https://foodscan-piyya.piyyayykamiel.workers.dev/scan";

// ELEMENT HTML
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

// STATE
let stream = null;
let selectedImage = null;
let currentObjectURL = null;
let isScanning = false;

// DATABASE PROGRAM
const programs = {
    balanced: "Pola makan seimbang",
    energy: "Menjaga energi",
    activity: "Mendukung aktivitas harian"
};

// ==========================================
// LOGIN
// ==========================================

document.getElementById("loginForm")
.addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("loginName")
        .value.trim();

    if (!name) return;

    document.getElementById("name").value = name;

    loginPage.hidden = true;
    profilePage.hidden = false;
});

// ==========================================
// SIMPAN PROFIL
// ==========================================

document.getElementById("profileForm")
.addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("name")
        .value.trim();

    const selectedProgram =
        document.getElementById("program").value;

    document.getElementById("userDisplay").textContent =
        name;

    document.getElementById("programDisplay").textContent =
        programs[selectedProgram] || "Belum dipilih";

    profilePage.hidden = true;
    appPage.hidden = false;

    statusText.textContent =
        "AI online siap digunakan. Silakan upload foto makanan.";
});

// ==========================================
// LOGOUT
// ==========================================

document.getElementById("logoutBtn")
.addEventListener("click", function() {
    stopCamera();

    loginPage.hidden = false;
    profilePage.hidden = true;
    appPage.hidden = true;

    document.getElementById("loginForm").reset();
    document.getElementById("profileForm").reset();

    selectedImage = null;

    resetPreview();
    resetResult();

    uploadImage.value = "";

    statusText.textContent = "Silakan login kembali.";
});

// ==========================================
// RESET PREVIEW
// ==========================================

function resetPreview() {
    camera.style.display = "none";
    preview.style.display = "none";
    placeholder.style.display = "block";

    preview.removeAttribute("src");

    if (currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
        currentObjectURL = null;
    }
}

// ==========================================
// RESET HASIL
// ==========================================

function resetResult() {
    resultCard.hidden = true;

    document.getElementById("foodName").textContent = "";
    document.getElementById("totalCalories").textContent = "0 kkal";
    document.getElementById("chartCalories").textContent = "0";

    document.getElementById("carbsValue").textContent = "0 gram";
    document.getElementById("proteinValue").textContent = "0 gram";
    document.getElementById("fatValue").textContent = "0 gram";

    document.getElementById("pieChart").style.background =
        "#f8dce7";
}

// ==========================================
// KAMERA
// ==========================================

document.getElementById("openCamera")
.addEventListener("click", async function() {

    try {
        stopCamera();

        const mediaDevices = navigator.mediaDevices;

        if (!mediaDevices ||
            !mediaDevices.getUserMedia) {
            throw new Error("Browser tidak mendukung kamera.");
        }

        stream = await mediaDevices.getUserMedia({
            video: {
                facingMode: {
                    ideal: "environment"
                }
            },
            audio: false
        });

        camera.srcObject = stream;

        await camera.play();

        camera.style.display = "block";
        preview.style.display = "none";
        placeholder.style.display = "none";

        selectedImage = camera;

        resetResult();

        analyzeButton.disabled = false;

        statusText.textContent = "Kamera aktif.";

    } catch (error) {
        console.error(error);

        statusText.textContent =
            "Kamera gagal dibuka. Periksa izin kamera HP.";
    }
});

// ==========================================
// AMBIL FOTO
// ==========================================

document.getElementById("takePhoto")
.addEventListener("click", function() {

    if (!stream || camera.readyState < 2) {
        statusText.textContent =
            "Buka kamera terlebih dahulu.";
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

    resetResult();

    analyzeButton.disabled = false;

    statusText.textContent =
        "Foto berhasil diambil. Tekan Scan Makanan.";
});

// ==========================================
// MATIKAN KAMERA
// ==========================================

document.getElementById("stopCamera")
.addEventListener("click", function() {

    stopCamera();

    if (selectedImage === camera) {
        selectedImage = null;

        analyzeButton.disabled = true;

        camera.style.display = "none";
        placeholder.style.display = "block";
    }

    statusText.textContent = "Kamera dimatikan.";
});

function stopCamera() {

    if (stream) {
        stream.getTracks().forEach(track => {
            track.stop();
        });

        stream = null;
    }

    camera.srcObject = null;
}

// ==========================================
// UPLOAD FOTO
// ==========================================

uploadImage.addEventListener("change", function(e) {

    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        statusText.textContent =
            "File harus berupa gambar.";

        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        statusText.textContent =
            "Ukuran foto maksimal 10 MB.";

        return;
    }

    stopCamera();

    if (currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
    }

    currentObjectURL = URL.createObjectURL(file);

    const image = new Image();

    image.onload = function() {

        selectedImage = image;

        preview.src = currentObjectURL;

        preview.style.display = "block";
        camera.style.display = "none";
        placeholder.style.display = "none";

        resetResult();

        analyzeButton.disabled = false;

        statusText.textContent =
            "Foto berhasil diupload. Siap untuk scan.";
    };

    image.onerror = function() {
        statusText.textContent =
            "Foto gagal dibuka.";
    };

    image.src = currentObjectURL;
});

// ==========================================
// KONVERSI FOTO KE BASE64
// ==========================================

function imageToBase64(image) {

    return new Promise((resolve, reject) => {

        try {
            const canvas = document.createElement("canvas");

            const maxSize = 1024;

            let width = image.videoWidth ||
                        image.naturalWidth ||
                        image.width;

            let height = image.videoHeight ||
                         image.naturalHeight ||
                         image.height;

            if (!width || !height) {
                throw new Error("Ukuran foto tidak valid.");
            }

            const scale = Math.min(
                1,
                maxSize / Math.max(width, height)
            );

            width = Math.round(width * scale);
            height = Math.round(height * scale);

            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext("2d");

            context.drawImage(
                image,
                0,
                0,
                width,
                height
            );

            const dataURL = canvas.toDataURL(
                "image/jpeg",
                0.85
            );

            resolve(dataURL.split(",")[1]);

        } catch (error) {
            reject(error);
        }
    });
}

// ==========================================
// VALIDASI HASIL AI
// ==========================================

function validateFood(data) {

    if (!data || typeof data !== "object") {
        throw new Error("Format hasil AI tidak valid.");
    }

    const name = data.food_name;

    const carbs = Number(data.carbs_g);
    const protein = Number(data.protein_g);
    const fat = Number(data.fat_g);

    if (
        typeof name !== "string" ||
        !name.trim() ||
        name.length > 80 ||
        !Number.isFinite(carbs) ||
        !Number.isFinite(protein) ||
        !Number.isFinite(fat) ||
        carbs < 0 ||
        protein < 0 ||
        fat < 0 ||
        carbs > 500 ||
        protein > 500 ||
        fat > 500
    ) {
        throw new Error("Data nutrisi dari AI tidak valid.");
    }

    return {
        name: name.trim(),
        carbs,
        protein,
        fat
    };
}

// ==========================================
// SCAN MAKANAN DENGAN AI ONLINE
// ==========================================

analyzeButton.addEventListener("click", async function() {

    if (isScanning) return;

    if (!selectedImage) {
        statusText.textContent =
            "Ambil atau upload foto terlebih dahulu.";

        return;
    }

    if (SCAN_API_URL.includes("URL-WORKER-KAMU")) {
        statusText.textContent =
            "URL AI belum dipasang. Konfigurasikan backend terlebih dahulu.";

        return;
    }

    isScanning = true;
    analyzeButton.disabled = true;

    resetResult();

    statusText.textContent =
        "Sedang mengirim foto ke AI online...";

    try {

        // KONVERSI GAMBAR
        const base64 = await imageToBase64(selectedImage);

        statusText.textContent =
            "AI sedang mengenali makanan...";

        // KIRIM FOTO KE BACKEND
        const response = await fetch(SCAN_API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                image: base64,
                mimeType: "image/jpeg"
            })

        });

        if (!response.ok) {
            throw new Error(
                "Server AI mengalami masalah. Kode: " +
                response.status
            );
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        // VALIDASI HASIL
        const food = validateFood(result);

        // TAMPILKAN HASIL
        showResult(food);

        statusText.textContent =
            "Scan berhasil! Nutrisi merupakan perkiraan AI.";

    } catch (error) {

        console.error("AI SCAN ERROR:", error);

        resultCard.hidden = true;

        statusText.textContent =
            "Scan gagal: " + error.message;

    } finally {

        isScanning = false;
        analyzeButton.disabled = !selectedImage;
    }
});

// ==========================================
// MENAMPILKAN HASIL NUTRISI
// ==========================================

function showResult(food) {

    const carbCalories = food.carbs * 4;
    const proteinCalories = food.protein * 4;
    const fatCalories = food.fat * 9;

    const totalCalories =
        carbCalories +
        proteinCalories +
        fatCalories;

    const carbPercent =
        totalCalories ? carbCalories / totalCalories * 100 : 0;

    const proteinPercent =
        totalCalories ? proteinCalories / totalCalories * 100 : 0;

    const fatPercent =
        totalCalories ? fatCalories / totalCalories * 100 : 0;

    // NAMA MAKANAN
    document.getElementById("foodName").textContent =
        food.name;

    // TOTAL KALORI
    document.getElementById("totalCalories").textContent =
        Math.round(totalCalories) + " kkal";

    document.getElementById("chartCalories").textContent =
        Math.round(totalCalories);

    // NUTRISI
    document.getElementById("carbsValue").textContent =
        food.carbs + " gram";

    document.getElementById("proteinValue").textContent =
        food.protein + " gram";

    document.getElementById("fatValue").textContent =
        food.fat + " gram";

    // DIAGRAM
    document.getElementById("pieChart").style.background =
        `conic-gradient(
            #d77fa4 0% ${carbPercent}%,
            #efb1c9 ${carbPercent}% ${carbPercent + proteinPercent}%,
            #f8dce7 ${carbPercent + proteinPercent}% 100%
        )`;

    // TAMPILKAN HASIL
    resultCard.hidden = false;

    resultCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// ==========================================
// SELESAI
// ==========================================
