const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsContent = document.getElementById('resultsContent');

let selectedFile = null;
let model = null;// pour éviter de recharger le modèle à chaque clic


//  INITIALISATION ET PRÉ-CHARGEMENT
async function init() {
    resultsContent.innerHTML = `<p class="status">Chargement du modèle</p>`;
    try {
        model = await cocoSsd.load();
        resultsContent.innerHTML = `<p class="empty">Modèle prêt. Aucune analyse pour le moment.</p>`;
    } catch (error) {
        resultsContent.innerHTML = `<p class="error">Erreur de chargement du modèle : ${error.message}</p>`;
    }
}
init();

// GESTION DE LA PRÉVISUALISATION
function chargerImage(event) {
    selectedFile = event.target.files[0];

    if (!selectedFile) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
        resultsContent.innerHTML = `<p class="empty">Image prête à être analysée.</p>`;
    };

    reader.readAsDataURL(selectedFile);
}


//  FONCTIONS REQUISES POUR L'ANALYSE


// Chargement du fichier semantic.json
async function loadSemantic() {
    const res = await fetch("semantic.json");
    return await res.json();
}

// Compter le nombre d'occurrences pour chaque classe
function getOccurrences(predictions) {
    const occurrences = {};
    predictions.forEach(p => {
        occurrences[p.class] = (occurrences[p.class] || 0) + 1;
    });
    return occurrences;
}

// Construire la phrase vocale
function buildPhrase(occurrences, semantic) {
    const parts = [];
    const numbers = {
        1: "un",
        2: "deux",
        3: "trois",
        4: "quatre",
        5: "cinq"
    };

    Object.entries(occurrences).forEach(([classe, nb]) => {
        const name = semantic[classe]?.fr || classe;
        const nbr = numbers[nb] || nb;
        parts.push(`${nbr} ${name}${nb > 1 ? "s" : ""}`);
    });

    if (parts.length === 0) return "Je n'ai détecté aucun objet connu.";

    return "J'ai détecté " + parts.join(", ").replace(/, ([^,]*)$/, " et $1") + ".";
}

// Extraire et formater les définitions
function buildDefinitions(occurrences, semantic) {
    let definitions = "";
    Object.entries(occurrences).forEach(([classe]) => {
        if (semantic[classe]?.definition) {
            const nameFr = semantic[classe]?.fr || classe;
            definitions += `<strong>${nameFr} :</strong> ${semantic[classe].definition}<br><br>`;
        }
    });
    return definitions;
}

// ==========================================
// 5. AFFICHAGE DES RÉSULTATS & SYNTHÈSE VOCALE
// ==========================================
function renderResult(occurrences, phrase, definitions) {
    resultsContent.innerHTML = ""; // Nettoie la zone

    // 1. Affichage des badges d'occurrences bruts
    Object.entries(occurrences).forEach(([classe, nb]) => {
        const div = document.createElement("div");
        div.className = "result-item";
        div.innerHTML = `➔ <strong>${nb}</strong> x ${classe}`;
        resultsContent.appendChild(div);
    });

    
    // 2. Affichage du texte descriptif et des définitions
    const divDetail = document.createElement("div");
    divDetail.className = "result-detail";
    divDetail.style.marginTop = "15px";
    divDetail.innerHTML = `<p><em>${phrase}</em></p><hr>${definitions}`;
    resultsContent.appendChild(divDetail);

    // 3. Synthèse Vocale (Lecture à haute voix)
    vocaliser(phrase);
}

function vocaliser(texte) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stoppe la voix en cours si nécessaire
        const utterance = new SpeechSynthesisUtterance(texte);
        utterance.lang = "fr-FR";
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// ==========================================
// 6. ACTION PRINCIPALE : ANALYSER L'IMAGE
// ==========================================
async function analyzeImage() {
    if (!selectedFile) {
        alert("Veuillez sélectionner une image");
        vocaliser("Veuillez sélectionner une image d'abord.");
        return;
    }

    if (!model) {
        alert("Le modèle n'est pas encore prêt, veuillez patienter.");
        return;
    }

    resultsContent.innerHTML = `<p class="status">Analyse de l'image en cours...</p>`;

    // Création de l'image HTML en mémoire et attente de son chargement complet
    const img = new Image();
    img.src = URL.createObjectURL(selectedFile);

    img.onload = async () => {
        try {
            const semantic = await loadSemantic();

            // Détection d'objets via TensorFlow
            const predictions = await model.detect(img);

            const occurrences = getOccurrences(predictions);
            const phrase = buildPhrase(occurrences, semantic);
            const definitions = buildDefinitions(occurrences, semantic);

            // Rendu visuel et vocal
            renderResult(occurrences, phrase, definitions);

            // Sauvegarde de l'historique en tâche de fond (Bonus)
            sauvegarderHistorique(occurrences);

        } catch (error) {
            console.error(error);
            resultsContent.innerHTML = `<p class="error">Une erreur est survenue pendant l'analyse.</p>`;
        }
    };
}



// Écouteurs d'événements
imageInput.addEventListener('change', chargerImage);
analyzeBtn.addEventListener('click', analyzeImage);