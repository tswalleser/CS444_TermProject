function scoreQuestionnaire(formID, total) {
    switch(formID) {

        case "GAD-7":
            if (total <= 4) return "Minimal Anxiety";
            if (total <= 9) return "Mild Anxiety";
            if (total <= 14) return "Moderate Anxiety";
            return "Severe Anxiety";

        case "PHQ-9":
            if (total <= 4) return "Minimal Depression";
            if (total <= 9) return "Mild Depression";
            if (total <= 14) return "Moderate Depression";
            if (total <= 19) return "Moderately Severe Depression";
            return "Severe Depression";

        case "DSM-5":
            if (total >= 31) return "Probable PTSD";
            return "Little to no PTSD";

        default:
            return "No score available";
    }
}

function questionnaireScoring(formID, resultID) {
    const form = document.getElementById(formID);
    const resultBox = document.getElementById(resultID);

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        let total = 0;
        let unanswered = [];
        const questions = form.querySelectorAll("fieldset");
       
        questions.forEach((field, index) => {
            const qName = field.querySelector("input[type='radio']").name;
            const selected = form.querySelector(`input[name="${qName}"]:checked`);
            if (selected) {
                total += parseInt(selected.value);
            } else {
                unanswered.push(index + 1);
            }
        });

        if (unanswered.length > 0) {
            alert("Please answer all questions before submitting. Unanswered questions: " + unanswered.join(", "));
            return;
        }

        const severity = scoreQuestionnaire(formID, total);
        
        resultBox.innerHTML = `
            <h2>${formID} Results</h2>
            <p><strong>Total Score:</strong> ${total}</p>
            <p><strong>Severity:</strong> ${severity}</p>
        `;
        resultBox.style.display = "block";

        window.scrollTo({ top: resultBox.offsetTop, behavior: "smooth" });
    });
}


