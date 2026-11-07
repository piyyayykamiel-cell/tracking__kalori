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
let currentObjectURL = null;

// DATABASE PROGRAM
const programs = {
    balanced: "Pola makan seimbang",
    energy: "Menjaga energi",
    activity: "Mendukung aktivitas harian"
};

// DATABASE MAKANAN
const foodDatabase = [
    {
        keywords: ["cheeseburger", "hamburger", "beefburger", "burger"],
        name: "Burger",
        carbs: 30,
        protein: 17,
        fat: 15
    },
    {
        keywords: ["pizza"],
        name: "Pizza",
        carbs: 36,
        protein: 12,
        fat: 10
    },
    {
        keywords: ["french fries", "potato wedges", "chips"],
        name: "Kentang Goreng",
        carbs: 40,
        protein: 4,
        fat: 15
    },
    {
        keywords: ["hotdog", "hot dog"],
        name: "Hot Dog",
        carbs: 25,
        protein: 10,
        fat: 15
    },
    {
        keywords: ["ice cream", "icecream"],
        name: "Es Krim",
        carbs: 25,
        protein: 4,
        fat: 10
    },
    {
        keywords: ["banana"],
        name: "Pisang",
        carbs: 27,
        protein: 1,
        fat: 0.3
    },
    {
        keywords: ["broccoli"],
        name: "Brokoli",
        carbs: 11,
        protein: 4,
        fat: 0.5
    },
    {
        keywords: ["strawberry"],
        name: "Stroberi",
        carbs: 12,
        protein: 1,
        fat: 0.5
    },
    {
        keywords: ["orange"],
        name: "Jeruk",
        carbs: 15,
        protein: 1,
        fat: 0.2
    },
    {
        keywords: ["burrito"],
        name: "Burrito",
        carbs: 50,
        protein: 18,
        fat: 15
    },
    {
        keywords: ["bagel"],
        name: "Bagel",
        carbs: 55,
        protein: 11,
        fat: 2
    },
    {
        keywords: ["sandwich"],
        name: "Sandwich",
        carbs: 35,
        protein: 15,
        fat: 12
    }
];

// LOGIN
document.getElementById("loginForm")
.addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("loginName").value.trim();

    if (!name) return;

    document.getElementById("name").value = name;

    loginPage.hidden = true;
    profilePage.hidden = false;
});

// SIMPAN PROFIL
document.getElementById("profileForm")
.addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const selectedProgram = document.getElementById("program").value;

    document.getElementById("userDisplay").textContent = name;

    document.getElementById("programDisplay").textContent =
        programs[selectedProgram] || "Belum dipilih";

    profilePage.hidden = true;
    appPage.hidden = false;

    loadAI();
});

// LOGOUT
document.getElementById("logoutBtn")
.addEventListener("click", function() {
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

    uploadImage.value = "";

    if (currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
        currentObjectURL = null;
    }

    statusText.textContent =
        "Menyiapkan sistem pengenalan makanan...";
});

// MEMUAT AI
async function loadAI() {
    if (model) return;

    statusText.textContent = "Sedang memuat sistem AI...";

    try {
        if (typeof mobilenet === "undefined") {
            throw new Error("Library MobileNet tidak ditemukan.");
        }

        model = await mobilenet.load({
            version: 2,
            alpha: 1.0
        });

        statusText.textContent =
            "AI siap digunakan. Silakan scan makanan.";

    } catch (error) {
        console.error("AI ERROR:", error);

        statusText.textContent =
            "AI gagal dimuat. Periksa koneksi internet.";
    }
}

// BUKA KAMERA
document.getElementById("openCamera")
.addEventListener("click", async function() {
    try {
        stopCamera();

        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia) {
            throw new Error("Browser tidak mendukung kamera.");
        }

        stream = await navigator.mediaDevices.getUserMedia({
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

    analyzeButton.disabled = false;
    resultCard.hidden = true;

    statusText.textContent =
        "Foto berhasil diambil. Tekan Scan Makanan.";
});

// MATIKAN KAMERA
document.getElementById("stopCamera")
.addEventListener("click", function() {
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

        analyzeButton.disabled = false;
        resultCard.hidden = true;

        statusText.textContent =
            "Foto berhasil diupload. Tekan Scan Makanan.";
    };

    image.onerror = function() {
        statusText.textContent = "Foto gagal dibuka.";
    };

    image.src = currentObjectURL;
});

// MENCOCOKKAN HASIL AI
function findFood(predictions) {
    for (const prediction of predictions) {
        const label = prediction.className.toLowerCase();

        for (const food of foodDatabase) {
            if (food.keywords.some(keyword =>
                label.includes(keyword)
            )) {
                return food;
            }
        }
    }

    return null;
}

// TOMBOL SCAN MAKANAN
analyzeButton.addEventListener("click", async function() {
    if (!selectedImage) {
        statusText.textContent =
            "Ambil atau upload foto terlebih dahulu.";
        return;
    }

    if (!model) {
        statusText.textContent = "AI sedang dimuat...";

        await loadAI();

        if (!model) return;
    }

    analyzeButton.disabled = true;

    statusText.textContent =
        "Sedang mengenali makanan...";

    try {
        const predictions = await model.classify(
            selectedImage,
            20
        );

        console.log("Hasil AI:", predictions);

        const detectedFood = findFood(predictions);

        if (!detectedFood) {
            resultCard.hidden = true;

            const labels = predictions
                .slice(0, 3)
                .map(item => item.className)
                .join(", ");

            statusText.textContent =
                "Makanan belum cocok dengan database. Prediksi AI: " + labels;

            return;
        }

        showResult(detectedFood);

        statusText.textContent =
            "Scan berhasil. Hasil merupakan estimasi nutrisi.";

    } catch (error) {
        console.error("SCAN ERROR:", error);

        statusText.textContent =
            "Terjadi kesalahan saat scan makanan.";

    } finally {
        analyzeButton.disabled = false;
    }
});

// MENAMPILKAN HASIL KALORI
function showResult(food) {
    const carbCalories = food.carbs * 4;
    const proteinCalories = food.protein * 4;
    const fatCalories = food.fat * 9;

    const totalCalories =
        carbCalories + proteinCalories + fatCalories;

    const carbPercent =
        carbCalories / totalCalories * 100;

    const proteinPercent =
        proteinCalories / totalCalories * 100;

    const fatPercent =
        fatCalories / totalCalories * 100;

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
