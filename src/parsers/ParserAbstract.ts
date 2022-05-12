import path from "path"
import { Logger } from "../utils/logger"

export abstract class ParserAbstract {
    abstract targetDirectory: string
    targetPath: string

    abstract logName: string
    logger: Logger

    init(archivePath: string) {
        this.targetPath = path.join(archivePath, this.targetDirectory)
        this.logger = new Logger(this.logName)
    }

    abstract parse(): Promise<object>

    log(...args: any[]) {
        this.logger.log(...args)
    }

    error(...args: any[]) {
        this.logger.error(...args)
    }
}
