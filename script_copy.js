
const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsContent = document.getElementById('resultsContent');

let selectedFile = null;
let phrase = [];
let definitions = "";

// Prévisualisation image
imageInput.addEventListener('change', (event) => {

    selectedFile = event.target.files[0];
  
    if (selectedFile) {

        const reader = new FileReader();

        reader.onload = function (e) {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
        }

        reader.readAsDataURL(selectedFile);
    }
});

// Analyse
analyzeBtn.addEventListener('click', () => {

    if (!selectedFile) {
        alert("Veuillez sélectionner une image");
        return;
    }
      // Reinitialisation de l'affichage 
        phrase =[];
        definitions = "";
    // Convertir input file en image 
    const img = new Image();
    img.src = URL.createObjectURL(selectedFile);


    // Chargement du fichier semantic.json 
    fetch("semantic.json")
        .then(res => res.json())
        .then(semantic => {
            // Chargement du modéle coco ssd 
            cocoSsd.load().then(model => {
                model.detect(img).then(predictions => {

                    resultsContent.innerHTML = "";

                    const occurrences = {};

                    // 1. Compter les classes
                    predictions.forEach(p => {
                        occurrences[p.class] = (occurrences[p.class] || 0) + 1;
                    });
                    console.log(occurrences);

                    // 2. Afficher
                    Object.entries(occurrences).forEach(([classe, nb]) => {
                        const div = document.createElement("div");
                        div.className = "result-item";

                        // div.textContent = nb + "  " + classe;
                        div.textContent = nb + "  " + (semantic[classe]?.fr || classe+ (nb>1? "s" :""));
                        resultsContent.appendChild(div);

                        if (nb === 1) {
                            nbr = "un";
                        }
                        else if (nb === 2) {
                            nbr = "deux";
                        }
                        else if (nb === 3) {
                            nbr = "trois";
                        }
                        else {
                            nbr = nb;
                        }
                        console.log(nbr , (semantic[classe]?.fr || classe));
                        console.log(phrase);
                        phrase.push(nbr + ' ' + (semantic[classe]?.fr || classe) +(nb>1? "s" :""));
                        definitions += semantic[classe]?.definition+"<br><br>" ;
                    });
                    phrase =
                        "J'ai détecté " +
                        phrase.join(", ").replace(/, ([^,]*)$/, " et $1") +  // remplace la derniere virgule par un 'et' ajoute un .
                        ".";

                    const div = document.createElement("div");
                    div.className = "result-item";
                    div.innerHTML  = phrase+"<br><br>"+definitions;
                    resultsContent.appendChild(div);
                    console.log("Occurrences:", occurrences);
                    console.log(phrase);
                });
            });


        });
});



