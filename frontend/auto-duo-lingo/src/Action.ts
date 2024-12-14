import { Action, ActionData, WS } from "./Types";

export const start = (ws: WS) => {
    let action = { type: Action.START };
    ws.current?.send(JSON.stringify(action))
}

export const proceed = (ws: WS) => {
    let action = { type: Action.CONTINUE };
    ws.current?.send(JSON.stringify(action))
}

export const chooseOption = (val: string, ws: WS) => {
    let data: ActionData = {
        type: Action.CHOOSE,
        optionValue: val
    }
    ws.current?.send(JSON.stringify(data))
}

export const matchOption = (ques: string, val: string, ws: WS) => {
    let data: ActionData = {
        type: Action.MATCH,
        optionValue: ques
    }
    ws.current?.send(JSON.stringify(data))
    data.optionValue = val;
    ws.current?.send(JSON.stringify(data))
}

export const checkJapanese = (val: string, ws: WS) => {
    let data: ActionData = {
        type: Action.JAPANESE,
        japaneseTranslate: val
    }
    ws.current?.send(JSON.stringify(data))
}

export const englishCheck = (chips: string[], ws: WS) => {
    let data: ActionData = {
        type: Action.ENGLISH,
        englishChips: chips
    }
    ws.current?.send(JSON.stringify(data));
}

export function getChips(strings: string[], target: string): string[] | null {
    const lowercaseToIndex: Record<string, number> = {};
    for (let i = 0; i < strings.length; i++) {
        lowercaseToIndex[strings[i].toLowerCase()] = i;
    }

    function getVariants(s: string): string[] {
        const key = s.toLowerCase();
        // If we have synonyms for this string, return them. Otherwise, just return the string itself.
        return synonymsMap[key] ?? [s];
    }

    function helper(t: string, used: boolean[]): string[] | null {
        t = t.trim();
        if (t === "") {
            return [];
        }

        for (let i = 0; i < strings.length; i++) {
            if (!used[i]) {
                const s = strings[i];
                const variants = getVariants(s);

                // Attempt to match any of the variants
                for (const variant of variants) {
                    const pattern = new RegExp(`^\\s*${variant}\\s*`, "i");
                    const match = t.match(pattern);
                    if (match) {
                        used[i] = true;
                        const remainingTarget = t.slice(match[0].length);
                        const result = helper(remainingTarget, used);
                        if (result !== null) {
                            return [s, ...result];
                        }
                        used[i] = false; // backtrack
                    }
                }
            }
        }
        return null;
    }

    return helper(target, Array<boolean>(strings.length).fill(false));
}

const synonymsMap: Record<string, string[]> = {
    // Contractions
    "i'm": ["I am", "I'm"],
    "you're": ["you are", "you're"],
    "he's": ["he is", "he's", "he has"],
    "she's": ["she is", "she's", "she has",],
    "it's": ["it is", "it's", "it has"],
    "we're": ["we are", "we're"],
    "they're": ["they are", "they're"],
    "don't": ["do not", "don't"],
    "doesn't": ["does not", "doesn't"],
    "didn't": ["did not", "didn't"],
    "can't": ["can not", "cannot", "can't"],
    "won't": ["will not", "won't"],
    "wouldn't": ["would not", "wouldn't"],
    "shouldn't": ["should not", "shouldn't"],
    "couldn't": ["could not", "couldn't"],
    "haven't": ["have not", "haven't"],
    "hasn't": ["has not", "hasn't"],
    "hadn't": ["had not", "hadn't"],
    "isn't": ["is not", "isn't"],
    "aren't": ["are not", "aren't"],
    "wasn't": ["was not", "wasn't"],
    "weren't": ["were not", "weren't"],
    "let's": ["let us", "let's"],
    "you've": ["you have", "you've"],
    "we've": ["we have", "we've"],
    "they've": ["they have", "they've"],
    "I've": ["I have", "I've"],
    "who's": ["who is", "who's"],
    "what's": ["what is", "what's"],
    "where's": ["where is", "where's"],
    "when's": ["when is", "when's"],
    "why's": ["why is", "why's"],
    "how's": ["how is", "how's"],
    "there's": ["there is", "there's"],
    "here's": ["here is", "here's"],

    // Numbers
    "one": ["one", "1"],
    "two": ["two", "2"],
    "three": ["three", "3"],
    "four": ["four", "4"],
    "five": ["five", "5"],
    "six": ["six", "6"],
    "seven": ["seven", "7"],
    "eight": ["eight", "8"],
    "nine": ["nine", "9"],
    "ten": ["ten", "10"],
    "eleven": ["eleven", "11"],
    "twelve": ["twelve", "12"],
    "thirteen": ["thirteen", "13"],
    "fourteen": ["fourteen", "14"],
    "fifteen": ["fifteen", "15"],
    "sixteen": ["sixteen", "16"],
    "seventeen": ["seventeen", "17"],
    "eighteen": ["eighteen", "18"],
    "nineteen": ["nineteen", "19"],
    "twenty": ["twenty", "20"],
    "thirty": ["thirty", "30"],
    "forty": ["forty", "40"],
    "fifty": ["fifty", "50"],
    "sixty": ["sixty", "60"],
    "seventy": ["seventy", "70"],
    "eighty": ["eighty", "80"],
    "ninety": ["ninety", "90"],
    "hundred": ["hundred", "100"],
    "thousand": ["thousand", "1000"],

    // Phrases
    "don't know": ["do not know", "don't know"],
    "isn't working": ["is not working", "isn't working"],
    "won't be": ["will not be", "won't be"],
    "i'll": ["I will", "I'll"],
    "you'll": ["you will", "you'll"],
    "he'll": ["he will", "he'll"],
    "she'll": ["she will", "she'll"],
    "it'll": ["it will", "it'll"],
    "we'll": ["we will", "we'll"],
    "they'll": ["they will", "they'll"]
};
