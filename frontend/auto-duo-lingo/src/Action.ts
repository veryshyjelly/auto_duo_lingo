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
    function helper(target: string, used: boolean[]): string[] | null {
        target = target.trim(); // Trim leading and trailing spaces to ensure consistent checks

        if (target === "") {
            return [];
        }

        for (let i = 0; i < strings.length; i++) {
            if (!used[i]) {
                const s = strings[i];
                const pattern = new RegExp(`^\\s*${s}\\s*`, "i"); // Match `s` surrounded by any spaces

                const match = target.match(pattern);
                if (match) {
                    used[i] = true;
                    // Slice the matched portion from the target
                    const remainingTarget = target.slice(match[0].length);
                    const result = helper(remainingTarget, used);
                    if (result !== null) {
                        return [s, ...result];
                    }
                    used[i] = false; // Backtrack
                }
            }
        }

        return null;
    }

    return helper(target, Array<boolean>(strings.length).fill(false));
}
