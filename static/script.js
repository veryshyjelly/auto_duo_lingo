let data = null;

const ActionType = {
    START  : 0,
    CONTINUE : 1,
    SOUND : 2,
    MATCH: 3,
    CHARACTER : 4,
    FillInBlank : 5,
    ENGLISH : 6,
    JAPANESE : 7
}
const ChallengeType = {
    GuessSound : 0,
    SelectCharacter : 1,
    Matching : 2,
    FillInTheBlank : 3,
    ToEnglish : 4,
    ToJapanese : 5,
    Nothing : 6
}

let heading = document.getElementById("heading");
let textArea = document.getElementById("inputString");
let optionPad = document.getElementById("option-pad");
let prompt = document.getElementById("prompt");

// type Challenge struct {
//     Type    ChallengeType `json:"type"`
//     Title   string        `json:"title"`
//     Prompt  string        `json:"prompt"`
//     Options []string      `json:"options"`
// }

const update = () => {
    console.log(`data = ${JSON.stringify(data, null, 2)}`)
    heading.innerHTML = (data && data.title) ? data.title : "Start Lesson"
    prompt.innerHTML = data ? data.prompt : "";
    textArea.classList.contains("hidden") ? '' : textArea.classList.add("hidden")
    optionPad.innerHTML = ''
    textArea.value = ''

    switch (data?.type) {
        case ChallengeType.GuessSound:
            for (let opt of data.options) {
                let btn = document.createElement('button')
                btn.classList.add('btn-numeric')
                btn.innerHTML = opt
                btn.onclick = () => submit(opt)
                optionPad.appendChild(btn);
            }
            break
        case ChallengeType.SelectCharacter:
            for (let opt of data.options) {
                let btn = document.createElement('button')
                btn.classList.add('btn-numeric')
                btn.innerHTML = opt
                btn.onclick = () => submit(opt)
                optionPad.appendChild(btn);
            }
            break
        case ChallengeType.Matching:
            for (let opt of data.options) {
                let btn = document.createElement('button')
                btn.classList.add('btn-numeric')
                btn.innerHTML = opt
                btn.onclick = () => submit(opt)
                optionPad.appendChild(btn);
            }
            break
        case ChallengeType.FillInTheBlank:
            for (let opt of data.options) {
                let btn = document.createElement('button')
                btn.classList.add('btn-numeric')
                btn.innerHTML = opt
                btn.onclick = () => submit(opt)
                optionPad.appendChild(btn);
            }
            break
        case ChallengeType.ToEnglish:
            textArea.classList.remove("hidden")
            break
        case ChallengeType.ToJapanese:
            textArea.classList.remove("hidden")
            break
        default:
            break
    }
}

// type ActionData struct {
//     Type              Action   `json:"type"`
//     OptionValue       string   `json:"optionValue"`
//     EnglishChips      []string `json:"englishChips"`
//     JapaneseTranslate string   `json:"japaneseTranslate"`
// }

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
        case ChallengeType.ToEnglish:
            actionData.type = ActionType.ENGLISH
            break
        case ChallengeType.ToJapanese:
            actionData.type = ActionType.JAPANESE
            break
        default:
            actionData.type = ActionType.START
            break
    }

    if (option == null && textArea.value === '') actionData.type = ActionType.START;

    xhr.send(JSON.stringify(actionData));
    document.getElementById('inputString').focus()
}

const clearAll = () => textArea.value = '';

update()

fetch("/info").then(res => res.json()).then(d => {data = d; update()});