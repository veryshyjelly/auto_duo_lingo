import React from "react"

export type WS = React.MutableRefObject<WebSocket | null>;

export enum ChallengeType {
    Matching,
    ChooseOption,
    ToEnglish,
    ToJapanese,
    Nothing,
}

export type Info = {
    type: ChallengeType
    progress: number,
    title?: string,
    prompt?: string,
    options?: string[],
    rightAnswer?: string
}

export enum Action {
    START,
    CONTINUE,
    MATCH,
    CHOOSE,
    ENGLISH,
    JAPANESE,
    PLAY,
}

export type ActionData = {
    type: Action,
    optionValue?: string,
    englishChips?: string[],
    japaneseTranslate?: string
}
