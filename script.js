const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsContent = document.getElementById('resultsContent');
const button = document.getElementById('voice');
button.style.display="none";
const btnHistorique = document.getElementById('historique');
btnHistorique.style.display="none";

let selectedFile = null;
let inventaires = {};

// Prévisualisation de l'image
function chargerImage(event) {
    selectedFile = event.target.files[0];

    if (!selectedFile) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
    };

    reader.readAsDataURL(selectedFile);
}
// Chargement du fichier semantic.json
async function chargerEnrichissement() {
    const res = await fetch("semantic.json");
    return await res.json();
}
// Chargement du modéle COCO
async function chargerModele() {
    return await cocoSsd.load();
}

// Compter le nombre de fois qu'un élément apparait dans une prediction
// occurrences pour chaque classe 

function getOccurrences(predictions) {
    const occurrences = {};

    predictions.forEach(p => {
        occurrences[p.class] = (occurrences[p.class] || 0) + 1;
    });

    return occurrences; // Occurrences: {person: 2, laptop: 1, potted plant: 1}
}
// Construire phrase
function genererPhrase(occurrences, semantic) {
    const parts = [];
    // Déclaration d'un objet traduction pour gérer les traductions
    const traduction = {
        1: "un",
        2: "deux",
        3: "trois",
        4: "quatre"
    };

    Object.entries(occurrences).forEach(([classe, nb]) => { //Object.entries() retourne un tableau
        //  contenant les paires clé-valeur des propriétés énumérables d'un objet
        const name = semantic[classe]?.fr || classe;
        const nbr = traduction[nb] || nb;

        parts.push(`${nbr} ${name}${nb > 1 ? "s" : ""}`);
    });
    // Construction de la phrase
    // join transforme le tableau en texte 
    // remplace la derniere virgule par un "et" et ajoute un "." à la fin
    return "J'ai détecté " +
        parts.join(", ").replace(/, ([^,]*)$/, " et $1") +
        ".";
}
// Ajouter les définitions 
function genererDefinitions(occurrences, semantic) {
    let definitions = "";

    Object.entries(occurrences).forEach(([classe]) => {
        definitions += semantic[classe]?.definition + "<br><br>";
    });

    return definitions;
}
// Affichage resultat
function affichage(occurrences, phrase, definitions, semantic) {

    Object.entries(occurrences).forEach(([classe, nb]) => {
        const div = document.createElement("div");
        div.className = "result-item";
        div.textContent = nb + "  " + (semantic[classe]?.fr || classe) + (nb > 1 ? "s" : "");

        inventaires[(semantic[classe]?.fr || classe) + (nb > 1 ? "s" : "")] = nb;

        resultsContent.appendChild(div);
    });


    const div = document.createElement("div");
    div.className = "result-item";
    div.innerHTML = phrase + "<br><br>" + definitions;
    button.style.display="block";
    btnHistorique.style.display="block";

    resultsContent.appendChild(div);

    //Lecture de la synthése vocal 
    button.addEventListener('click', () => {
        if (definitions) {
            vocaliser(phrase + definitions);
        } else {
            vocaliser("Aucune analyse disponible.");
        }
    });
    // Téléchargement Historique
    btnHistorique.addEventListener('click', () => {
        if (inventaires) {
            historique(
                {
                    "date": dateDuJour(),
                    "image": selectedFile.name,
                    "inventaire": inventaires
                }
            );
        }
    });
}

// Function detecterObjets fonction qui analyse une Image et 
//detecter les objets
async function detecterObjets() {
    if (!selectedFile) {
        alert("Veuillez sélectionner une image");
        return;
    }

    resultsContent.innerHTML = "";

    const img = new Image();
    img.src = URL.createObjectURL(selectedFile);

    const semantic = await chargerEnrichissement();
    const model = await chargerModele();

    const predictions = await model.detect(img);
    console.log("Predictions "+predictions);

    const occurrences = getOccurrences(predictions);

    const phrase = genererPhrase(occurrences, semantic);
    const definitions = genererDefinitions(occurrences, semantic);

    affichage(occurrences, phrase, definitions, semantic);
    

    //console.log("Occurrences:", occurrences);
    //console.log(phrase);
}

imageInput.addEventListener('change', chargerImage);
analyzeBtn.addEventListener('click', detecterObjets);

function historique(data, fileName = "historique.json") {
    try {

        // Conversion en JSON formaté
        const jsonString = JSON.stringify(data, null, 2);

        // Création d'un Blob et d'un lien de téléchargement
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Libération de l'URL
        URL.revokeObjectURL(url);

        console.log(`Fichier ${fileName} généré avec succès.`);
    } catch (error) {
        console.error("Erreur lors de la génération du fichier JSON :", error.message);
    }
}


// Formatage date YYYY-MM-DD HH:MM
function padZero(num) {
    return num < 10 ? "0" + num : num;
}
function dateDuJour() {
    const maintenant = new Date();

    const annee = maintenant.getFullYear();
    const mois = padZero(maintenant.getMonth()+1); // maintenant.getMonth() renvoie 0 pour le premier Mois

    const jour = padZero(maintenant.getDate());

    const heures = padZero(maintenant.getHours());
    const minutes = padZero(maintenant.getMinutes());

    // Format final : YYYY-MM-DD HH:MM
    const dateHeure = `${annee}-${mois}-${jour} ${heures}:${minutes}`;
    return dateHeure;
}

function vocaliser(voice) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stoppe la voix en cours si nécessaire

        const voiceNettoye = voice
            .replace(/<br\s*\/?>/gi, "\n")  // supprime les <br>, <br/> et <br />
            .replace(/<[^>]*>/g, "")      // supprime toute autre balise HTML
            .replace(/\./g, "");           // suppression des points

        const utterance = new SpeechSynthesisUtterance(voiceNettoye);
        utterance.lang = "fr-FR";
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

