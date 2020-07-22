/**
 * @interface IPageMap
 * describes the interface for mapping extracted data to original source
 * allowing their back-referencing.
 * 
 * Any module serializing this interface must clearly define the ingress
 * and egress behavior independently.
 */
export interface IPageMap {
    pagemapType?: "epubcfi" | "pdf"  // modifiable, can allow additional types
    pagemapValue?: string
}

/**
 * @interface IRecord
 * describes main piece of data thet is going to be handled by Refinery.
 * 
 * Modifiable elements are marked in comments.
 * This interface declares a string indexer and accepts
 * any additional properties in case existing fields do not
 * present enough context for additional data.
 * 
 * It is encouraged to add non-programatic data with names starting
 * with `dataField3` indexing upwards
 */
export interface IRecord {
    [x: string]: any,
    dataField1: string,
    dataField2: string,
    _id: string,
    _rev?: string,
    richContent?: string,
    timestampCreated: number,
    timestampModified: number,
    pageMap?: IPageMap,
    source: string,
    flashcard: IFlashcard,  // data related to flashcard-based scheduling
    notebook?: string,
    linked?: string | Array<string>
}

/**
 * @interface IFlashcard
 * describes flashcard-related metadata of an `IRecord`
 */
export interface IFlashcard {
    easinessFactor: number,
    deck: string,
    scheduler: {
        pastRevisions: Array<number>,
        nextRevision: number
    }
}

/**
 * @type displayCallback describes a front-end display callback
 * for a flashcard in `phlower` front end
 */
export type displayCallback = (flashcard: IRecord, selectField: string)=>void

/**
 * @interface IConfig defines the master config object
 * It is consistent with the YAML spec and is reused
 * for the React App.
 */
export interface IConfig {
    refinery: {

    },
    ibooks: {

    },
    anki: {

    },
    phlower: {
        notebooks: Array<{
            cfgId: string
        }>,
        decks: Array<{
            cfgId: string,
            algorithm: string
        }>,
        algorithms: Array<{
            cfgId: string,
            new: {
                maxPerDay: number,
                startingDelays: [number, number],
                startingIntervals: [number, number],
                initialFactor: number,
                order: 'random' | 'by-creation-date'
            },
            fail: {
                failsUntilLeech: number,
                minLeechInterval: number,
                delays: Array<number>,
                leechAction: number,
                multiplyInterval: number
            },
            rev: {
                maxPerDay: number
                fuzz: number
                multiplyInterval: number
                maxInterval: number
                initialEaseFactorMultiplier: number
                minSpace: number
            },
            timer: boolean,
            maxTimeSpentOnCard: number,
            autoplayAudio: boolean,
            replayAudioWhenFlipped: boolean
        }>
    },
    formatting: Array<{
        cfgId: string,
        fields: Array<{
            name: string,
            css: string
        }>
    }>
}