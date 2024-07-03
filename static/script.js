let data = null;

const ActionType = {
    START  : 0,
    CONTINUE : 1,
    SOUND : 2,
    MATCH: 3,
    CHARACTER : 4,
    FillInBlank : 5,
    WhichOne: 6,
    ENGLISH : 7,
    JAPANESE : 8,
    PLAY: 9
}
const ChallengeType = {
    GuessSound : 0,
    SelectCharacter : 1,
    Matching : 2,
    FillInTheBlank : 3,
    WhichOneOfThese: 4,
    ToEnglish : 5,
    ToJapanese : 6,
    Nothing : 7
}

let heading = document.getElementById("heading");
let textArea = document.getElementById("inputString");
let prompt = document.getElementById("prompt");
let wordBank = document.getElementById("word-bank");
let optionPadLeft = document.getElementById("option-left");
let optionPadRight = document.getElementById("option-right");
let errorBox = document.getElementById("error");
let rightAnswer = document.getElementById('right-answer');

textArea.onchange = () => errorBox.classList.contains("hidden") ? '' : errorBox.classList.add("hidden")

const update = () => {
    console.log(`data = ${JSON.stringify(data, null, 2)}`)

    textArea.value = ''
    wordBank.innerHTML = ''
    optionPadLeft.innerHTML = ''
    optionPadRight.innerHTML = ''
    prompt.innerHTML = data ? data.prompt : "";
    rightAnswer.innerHTML = data?.rightAnswer ? data.rightAnswer : ""
    heading.innerHTML = (data && data.title) ? data.title : "Start Lesson"
    textArea.classList.contains("hidden") ? '' : textArea.classList.add("hidden")

    switch (data?.type) {
        case ChallengeType.GuessSound: case ChallengeType.SelectCharacter:
            case ChallengeType.FillInTheBlank: case ChallengeType.WhichOneOfThese:
            for (let opt of data.options) {
                let btn = document.createElement('button')
                btn.classList.add('btn', 'btn-guess-sound')
                data.type === ChallengeType.GuessSound ?
                    btn.classList.add('btn-guess-sound') : data.type === ChallengeType.SelectCharacter ?
                        btn.classList.add('btn-select-character') : btn.classList.add('btn-fill-blank')
                btn.innerHTML = opt
                btn.onclick = () => submit(opt)
                optionPadLeft.appendChild(btn);
            }
            break
        case ChallengeType.Matching:
            let left = 0;
            for (let opt of data.options) {
                let btn = document.createElement('button')
                btn.classList.add('btn', 'btn-matching')
                btn.innerHTML = opt
                btn.onclick = () => submit(opt)
                left < data.options.length/2 ? optionPadLeft.appendChild(btn) : optionPadRight.appendChild(btn)
                left++
            }
            break
        case ChallengeType.ToEnglish:
            textArea.classList.remove("hidden")
            for (let opt of data.options) {
                let btn = document.createElement('button')
                btn.classList.add('btn', 'btn-english-chip')
                btn.innerHTML = opt
                btn.onclick = () => textArea.value += ' ' + opt
                wordBank.appendChild(btn);
            }
            break
        case ChallengeType.ToJapanese:
            textArea.classList.remove("hidden")
            break
        default:
            break
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
            data = JSON.parse(xhr.response)
            update()
        }
    };

    let actionData = {};
    actionData.optionValue = option ? option : '';

    switch (data?.type) {
        case ChallengeType.GuessSound:
            actionData.type = ActionType.SOUND
            break
        case ChallengeType.SelectCharacter:
            actionData.type = ActionType.CHARACTER
            break
        case ChallengeType.Matching:
            actionData.type = ActionType.MATCH
            break
        case ChallengeType.FillInTheBlank:
            actionData.type = ActionType.FillInBlank
            break
        case ChallengeType.WhichOneOfThese:
            actionData.type = ActionType.WhichOne
            break
        case ChallengeType.ToEnglish:
            let chips = getChips(data.options, textArea.value)
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
    document.getElementById('inputString').focus()
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

fetch("/info").then(res => res.json()).then(d => {data = d; update()});