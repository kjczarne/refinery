import { logger } from '../utils';
import { AppleiBooksEngine } from '../ibooks/iBooksEngine';
import { iBooks2AnkiFunction } from './interfaces';

let f: iBooks2AnkiFunction = (
    bookName: string
)=>{
    let iBooksEngine: AppleiBooksEngine = new AppleiBooksEngine();

    iBooksEngine.load(bookName).then(()=>{
        logger.log({
            level: 'info',
            message: `Book ${bookName} loaded from iBooks to Refinery Database.`
        });
    });
}

export default f;