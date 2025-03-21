import fs from "fs"
import path from "path"
import util from "util"
import dateformat from "date-format"
import config from "../config"

const terminalFontStyles = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",

    fgBlack: "\x1b[30m",
    fgRed: "\x1b[31m",
    fgGreen: "\x1b[32m",
    fgYellow: "\x1b[33m",
    fgBlue: "\x1b[34m",
    fgMagenta: "\x1b[35m",
    fgCyan: "\x1b[36m",
    fgWhite: "\x1b[37m",

    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m",
}

export class Logger {
    private static readonly logRoot = "./logs/"
    private static directoryCreated = false
    private static logDirectory: string

    private readonly logStdout: NodeJS.WriteStream & { fd: 1 }
    private readonly logSource: string

    private logFile: fs.WriteStream = null
    readonly logPath: string

    constructor(logSource: string) {
        this.logStdout = process.stdout;
        this.logSource = logSource

        // create directory for all loggers
        // path like: ./logs/20200101_174511/
        if (config.logToFile && !Logger.directoryCreated) {
            let logTime = Logger.getCurrentDateString()
            Logger.logDirectory = path.join(Logger.logRoot, logTime)
            fs.mkdirSync(Logger.logDirectory, { recursive: true });
            Logger.directoryCreated = true
            this.logPath = path.join(Logger.logDirectory, `${this.logSource}.log`)
        }
    }

    // private createLogFile() {
    //     const logPath = path.join(Logger.logDirectory, `${this.logSource}.log`)
    //     this.logFile = fs.createWriteStream(logPath, { flags: "w" })
    // }

    static getCurrentDateString(): string {
        return dateformat("yyyy.MM.dd hh-mm-ss", new Date())
    }

    log(...args: any[]) {
        this.logStdout.write(`[${this.logSource}] ${util.format(...args)}\n`);
    }

    error(...args: any[]) {
        const message = `${util.format(...args)}\n`
        if (config.logToFile) {
            fs.appendFileSync(this.logPath, message + "\n")
        }
        this.logStdout.write(`${terminalFontStyles.fgRed}[${this.logSource}] ${message}${terminalFontStyles.reset}`);
    }

    debug(...args: any[]) {
        if (config.debug) {
            console.log(...args)
        }
    }

    // async dumpObject(name: string, obj: any) {
    //     let filePath = path.join(Logger.logDirectory, name + ".json")
    //     await fs.promises.writeFile(filePath, JSON.stringify(obj, null, 4))
    // }
}

export let logger = new Logger("mainlog")