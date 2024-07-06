let data = null;

const ActionType = {
    START  : 0,
    CONTINUE : 1,
    MATCH: 2,
    FillInBlank : 3,
    CHARACTER: 4,
    ENGLISH : 5,
    JAPANESE : 6,
    PLAY: 7
}
const ChallengeType = {
    SelectCharacter : 0,
    Matching : 1,
    FillInTheBlank : 2,
    ToEnglish : 3,
    ToJapanese : 4,
    Nothing : 5
}

let heading = document.getElementById("heading");
let textArea = document.getElementById("inputString");
let prompt = document.getElementById("prompt");
let wordBank = document.getElementById("word-bank");
let optionPadLeft = document.getElementById("option-left");
let optionPadRight = document.getElementById("option-right");
let errorBox = document.getElementById("error");
let rightAnswer = document.getElementById('right-answer');
let progressBar = document.querySelector(".progress-bar-fill");

textArea.onchange = () => errorBox.classList.contains("hidden") ? '' : errorBox.classList.add("hidden")
let last_selection = '';

const update = () => {
    console.log(`data = ${JSON.stringify(data, null, 2)}`)

    textArea.value = '';
    wordBank.innerHTML = '';
    optionPadLeft.innerHTML = '';
    optionPadRight.innerHTML = '';
    prompt.innerHTML = data ? data.prompt : "";
    rightAnswer.innerHTML = data?.rightAnswer ? data.rightAnswer : "";
    heading.innerHTML = (data && data.title) ? data.title : "Start Lesson";
    progressBar.style.width = data?.progress + '%'
    if (!textArea.classList.contains("hidden")) textArea.classList.add("hidden");
    if (!errorBox.classList.contains("hidden")) errorBox.classList.add("hidden")

    switch (data?.type) {
         case ChallengeType.SelectCharacter:
        case ChallengeType.FillInTheBlank:
            for (let opt of data.options) {
                let btn = document.createElement('button');
                btn.classList.add('btn', 'btn-select-character');
                btn.innerHTML = opt;
                btn.onclick = () => submit(opt);
                optionPadLeft.appendChild(btn);
            }
            break;
        case ChallengeType.Matching:
            for (let opt of data.options) {
                let btn = document.createElement('button');
                btn.classList.add('btn');
                btn.classList.add('btn-matching');
                btn.innerHTML = opt;
                btn.onclick = () => {
                    submit(data.prompt);
                    submit(opt);
                }
                optionPadLeft.appendChild(btn);
            }
            break;
        case ChallengeType.ToEnglish:
            textArea.classList.remove("hidden");
            for (let opt of data.options) {
                let btn = document.createElement('button');
                btn.classList.add('btn', 'btn-english-chip');
                btn.innerHTML = opt;
                btn.onclick = () => textArea.value = (textArea.value+' '+ opt).trim();
                wordBank.appendChild(btn);
            }
            break;
        case ChallengeType.ToJapanese:
            textArea.classList.remove("hidden");
            break;
        default:
            break;
    }
}

function getChips(strings, target) {
    function helper(target, used) {
        if (target === "") {
            return [];
        }

        for (let i = 0; i < strings.length; i++) {
            if (!used[i]) {
                const s = strings[i];

                // Check without space
                if (target.toUpperCase().startsWith(s.toUpperCase())) {
                    used[i] = true;
                    const result = helper(target.slice(s.length), used);
                    if (result !== null) {
                        return [s, ...result];
                    }
                    used[i] = false;
                }

                // Check with space
                if (target.toUpperCase().startsWith(" " + s.toUpperCase())) {
                    used[i] = true;
                    const result = helper(target.slice(s.length + 1), used);
                    if (result !== null) {
                        return [s, ...result];
                    }
                    used[i] = false;
                }
            }
        }

        return null;
    }
    return helper(target, Array(strings.length).fill(false));
}

const submit = (option = null) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', "/action", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            data = JSON.parse(xhr.response);
            update();
            document.getElementById('inputString').focus();
        }
    };

    let actionData = {};
    actionData.optionValue = option ? option : '';

    switch (data?.type) {
        case ChallengeType.SelectCharacter:
            actionData.type = ActionType.CHARACTER
            break
        case ChallengeType.Matching:
            actionData.type = ActionType.MATCH
            break
        case ChallengeType.FillInTheBlank:
            actionData.type = ActionType.FillInBlank
            break
        case ChallengeType.ToEnglish:
            let chips = getChips(data.options, textArea.value.replaceAll(' ', ''))
            if (chips == null) {
                errorBox.classList.remove("hidden");
                return
            }
            actionData.englishChips = chips;
            actionData.type = ActionType.ENGLISH
            break
        case ChallengeType.ToJapanese:
            actionData.japaneseTranslate = textArea.value;
            actionData.type = ActionType.JAPANESE
            break
        default:
            actionData.type = ActionType.START
            break
    }

    if (data == null || data.type === ChallengeType.Nothing) {
        actionData.type = ActionType.START
    } else if (option == null && textArea.value === '') {
        actionData.type = ActionType.CONTINUE
    }

    xhr.send(JSON.stringify(actionData));
}

const play = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', "/action", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    let actionData = {};
    actionData.type = ActionType.PLAY;
    xhr.send(JSON.stringify(actionData));
}

const clearAll = () => textArea.value = '';

update()

fetch("/info").then(res => res.json()).then(d => {
    data = d;
    update()
});

textArea.addEventListener("keypress", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
    }
});
