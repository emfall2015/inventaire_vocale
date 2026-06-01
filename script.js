const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsContent = document.getElementById('resultsContent');

let selectedFile = null;

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
async function loadSemantic() {
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
function buildPhrase(occurrences, semantic) {
    const parts = [];
    // Déclaration d'un objet numbers pour gérer les traductions
    const numbers = {
        1: "un",
        2: "deux",
        3: "trois"
    };

    Object.entries(occurrences).forEach(([classe, nb]) => { //Object.entries() retourne un tableau
    //  contenant les paires clé-valeur des propriétés énumérables d'un objet
        const name = semantic[classe]?.fr || classe;
        const nbr = numbers[nb] || nb;

        parts.push(`${nbr} ${name}${nb > 1 ? "s" : ""}`);
    });
// Construction de la phrase
// join transforme le tbleau en texte 
// remplace lar derniere virgule par un "et" et ajoute un "." à la fin
    return "J'ai détecté " +
        parts.join(", ").replace(/, ([^,]*)$/, " et $1") +
        ".";
}
// Ajouter les définitions 
function buildDefinitions(occurrences, semantic) {
    let definitions = "";

    Object.entries(occurrences).forEach(([classe]) => {
        definitions += semantic[classe]?.definition + "<br><br>";
    });

    return definitions;
}
// Affichage resultat
function renderResult(occurrences,phrase, definitions) {
  
    Object.entries(occurrences).forEach(([classe, nb]) => {
    const div = document.createElement("div");
    div.className = "result-item";
    div.textContent = nb + "  " + classe;
    resultsContent.appendChild(div);
    });
    const div = document.createElement("div");
    div.className = "result-item";
    div.innerHTML = phrase + "<br><br>" + definitions;

   resultsContent.appendChild(div);
}

// Function analyser Image
async function analyzeImage() {
    if (!selectedFile) {
        alert("Veuillez sélectionner une image");
        return;
    }

    resultsContent.innerHTML = "";

    const img = new Image();
    img.src = URL.createObjectURL(selectedFile);

    const semantic = await loadSemantic();
    const model = await chargerModele();

    const predictions = await model.detect(img);

    const occurrences = getOccurrences(predictions);

    const phrase = buildPhrase(occurrences, semantic);
    const definitions = buildDefinitions(occurrences, semantic);

    renderResult(occurrences,phrase, definitions);

    console.log("Occurrences:", occurrences);
    console.log(phrase);
}

imageInput.addEventListener('change', chargerImage);
analyzeBtn.addEventListener('click', analyzeImage);