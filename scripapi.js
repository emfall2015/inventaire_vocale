
const button = document.getElementById('voice');
 document.getElementById('voice').style.display="none";
let dernierePhrase = ""; // Permet de stocker la phrase pour le bouton écouter

button.addEventListener('click', () => {
    if (dernierePhrase) {
        vocaliser(dernierePhrase);
    } else {
        vocaliser("Aucune analyse disponible.");
    }
});

function renderResult(occurrences, phrase, definitions) {
    resultsContent.innerHTML = ""; // Nettoie la zone
    dernierePhrase = phrase;
             document.getElementById('voice').style.display="block";

    // 1. Affichage des badges d'occurrences bruts
    Object.entries(occurrences).forEach(([classe, nb]) => {
        const div = document.createElement("div");
        div.className = "result-item";
        div.innerHTML = `➔ <strong>${nb}</strong> x ${classe}`;
        resultsContent.appendChild(div);
    });

    const divDetail = document.createElement("div");
    divDetail.className = "result-detail";
    divDetail.style.marginTop = "15px";
    divDetail.innerHTML = `<p><em>${phrase}</em></p><hr>${definitions}`;
    resultsContent.appendChild(divDetail);
 document.getElementById('voice').style.display="block"
button.addEventListener('click', () => {
    if (dernierePhrase) {
        vocaliser(dernierePhrase);
    } else {
        vocaliser("Aucune analyse disponible.");
    }
});
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


