import { IRecord, IPageMap, IConfig } from './interfaces';
import sha1 from 'sha1';
import { delay, logger } from './utils';
import { config, algorithmConfig } from './configProvider';
import { HtmlConvSpec, MdConvSpec } from './conversionSpecs';
import PouchDb from 'pouchdb';

/**
 * @function constructRecord Constructs an IRecord Object
 * @param type "epubcfi" or "pdf", can be used to map back to origial (pdf not supported yet)
 * @param pagemapValue value of the "epubcfi" or "pdf" mapping
 * @param dataField1 original text that was highlighted
 * @param dataField2 note that was added to the original text
 * @param source describes the source of the original record
 * @param richContent map to any rich content that the record should come bundled with
 * //TODO: fix up docs
 */
export function constructRecord(
    dataField1: string,
    dataField2: string,
    source: string,
    pageMap?: IPageMap,
    configEntity: IConfig | string | undefined = undefined,
    set: string = 'default',
    notebook?: string,
    richContent: string = ''
): IRecord {
    let now: string = Date.now().toString();
    let configObj: any = config(configEntity)
    let algorithmConfigObj: any = algorithmConfig(set, configObj);

    let record: IRecord = {
        pageMap: pageMap,
        dataField1: dataField1,
        dataField2: dataField2,
        source: source,
        richContent: richContent,
        _id: sha1(`${now}${dataField1}${dataField2}`),
        timestampCreated: Date.now(),
        timestampModified: Date.now(),
        set: set,
        pastExports: new Array<number>(),
        flashcard: {
            scheduler: {
                easinessFactor: algorithmConfigObj.new.initialFactor,
                pastRevisions: new Array<number>(),
                nextRevision: Date.now()
            }
        },
        notebook: notebook
    }
    return record;
}

/**
 * @function isRecord Checks if an object is of type `IRecord`
 * @param obj object of any type
 */
export function isRecord(obj: any): obj is IRecord{
    let bools: Array<boolean> = [
        'dataField1' in obj,
        'dataField2' in obj,
        '_id' in obj,
        'timestampCreated' in obj,
        'timestampModified' in obj,
        'flashcard' in obj,
        'source' in obj
    ]
    let check: boolean = bools.every((x)=>{return x===true});
    return check;
}

/**
 * @function convert General function that formats strings making up
 * the title, the highlight and the note. For instance in case of HTML
 * you will want to wrap the title with <h1> and </h1>
 * @param record IRecord or an Array of IRecord objects
 * @param title Title of the summary/set
 * @param wrapTitle Format wrapper for the title
 * @param wrapDataField1 Format wrapper for the highlighted text
 * @param wrapDataField2 Format wrapper for the note added
 * @returns string
 */
export function convert(
    record: IRecord | Array<IRecord>,
    title: string,
    wrapTitle: [string, string],
    wrapDataField1: [string, string],
    wrapDataField2: [string, string]
){
    let serializedString: string = "";
    // callback to format output string:
    let cb = (x: IRecord, 
              prop: "dataField1" | "dataField2",
              wrapLeft: string, 
              wrapRight: string)=> {
              if (x[prop] != null){
                serializedString += `${wrapLeft}${x[prop]}${wrapRight}`
              }
    }
    serializedString += `${wrapTitle[0]}${title}${wrapTitle[1]}`;
    if (isRecord(record)){
        cb(record, "dataField1", wrapDataField1[0], wrapDataField1[1]);
        cb(record, "dataField2", wrapDataField2[0], wrapDataField2[1]);
    }
    else{
        record.forEach((x)=>{
            cb(x, "dataField1", wrapDataField1[0], wrapDataField1[1]);
            cb(x, "dataField2", wrapDataField2[0], wrapDataField2[1]);
        });
    }
    return serializedString;
}

/**
 * @function convertToMarkdown Converts IRecords to a Markdown
 * serialized string.
 * @param record IRecord or an Array of IRecord Objects
 * @param title Desired title of the Markdown document
 * @returns string
 */
export function convertToMarkdown(
    record: IRecord | Array<IRecord>,
    title: string
): string{
    return convert(record, 
                   title,
                   MdConvSpec.WRAP_TITLE(),
                   MdConvSpec.WRAP_DF1(),
                   MdConvSpec.WRAP_DF2());
}

/**
 * @function convertToHtml Converts IRecords to an HTML document
 * serialized string.
 * @param record IRecord or an Array of IRecord Objects
 * @param title Desired title of the HTML Document
 * @param cssFile CSS file for styling
 * @param cssDataField1Class CSS class bound to Highlight elements
 * @param cssDataField2Class CSS class bound to Note elements
 * @param cssTitleClass CSS class bound to the title
 * @returns string
 */
export function convertToHtml(
    record: IRecord | Array<IRecord>,
    title: string,
    cssFile: string = 'default.css',
    cssDataField1Class: string = 'highlight',
    cssDataField2Class: string = 'note',
    cssTitleClass: string = 'title'
): string {
    let htmlCore: string = HtmlConvSpec.PRE(title, cssFile);
    htmlCore += convert(
        record, 
        title,
        HtmlConvSpec.WRAP_TITLE(cssTitleClass),
        HtmlConvSpec.WRAP_DF1(cssDataField1Class),
        HtmlConvSpec.WRAP_DF2(cssDataField2Class));
    htmlCore += HtmlConvSpec.TRAIL();
    return htmlCore;
}

// export function convertToFlashcard(
//     record: IRecord | Array<IRecord>,
//     ankiEngine: AnkiEgressEngine,
//     // deckModel: IModel
// ): void{
//     if (isRecord(record)){
//         ankiEngine.addCard(record);
//     }
//     else{
//         for (let el of record){
//             ankiEngine.addCard(el);
//         }
//     }
// }

/**
 * @function constructRecords facilitates creation of IRecord objects from a SQL query response
 * @param responseArrayFromSql an Array of entries returned from a SQL query (Promise response)
 * @returns Array<IRecord>
 * Intended pattern of usage:
 * ```javascript
 * sqlQueryRun(dbPath, query).then((response)=>{
 *   constructRecords(response).then((response)=>{
 *       // do what you need to records here
 *   });
 * });
 * ```
 */
export async function constructRecords(
    responseArrayFromSql: Array<IRecord>
) {
    let records: Array<IRecord> = new Array<IRecord>();
    for (let rec of responseArrayFromSql){
        await new Promise(async (resolve, reject) => {
            await delay(2);
            let record: IRecord  = constructRecord(
                rec.dataField1, 
                rec.dataField2,
                rec.source,
                rec.pageMap,
                rec.configEntity,
                rec.set,
                rec.notebook,
                rec.richContent
            );
            records.push(record);
            resolve(records);
        });
    }
    return records;
};

export class RefineryDatabaseWrapper {
    config: any;
    // auth: Promise<nano.DatabaseAuthResponse>;
    // server: nano.DatabaseScope;
    db: PouchDB.Database;

    constructor(){
        this.config = config();
        // TODO: more secure handling of the database authentication:
        const opts = {
            auth: {
                username: this.config.refinery.database.user,
                password: this.config.refinery.database.password
            }
        }
        const server = this.config.refinery.database.databaseServer;
        const name = this.config.refinery.database.databaseName;
        const db = new PouchDb(server + name, opts)
        // this.auth = couchDb.auth(username, userpass);
        // this.server = server;
        this.db = db;
        // TODO: local db and sync methods
    }
}

