import fs from "fs"
import path from "path";
import { parse as parseHTML } from "node-html-parser"
import iconv from "iconv-lite"
import { getFiles } from "@/utils/fs";
import { ParserAbstract } from "../ParserAbstract";

export class CommentsParser extends ParserAbstract {
    targetDirectory: string = "comments"
    logName: string = "CommentsParser"

    async parse(): Promise<string[]> {
        let files = await getFiles(this.targetPath, ".html", true)

        files.sort((a, b) => this.getFileNumber(a) - this.getFileNumber(b))

        let data = []
        for (const file of files) {
            // read file and get urls

            let filePath = path.join(this.targetPath, file)
            let fileData = await fs.promises.readFile(filePath)
            let fileContent = iconv.decode(fileData, "win1251")

            // parse content
            let urls = this.parseFile(fileContent)

            for (const url of urls) {
                data.push(url)
            }
        }

        return data
    }
    parseFile(fileContent: string) {
        const root = parseHTML(fileContent)
        let links = root.querySelectorAll('.item__main:nth-child(2) > a')
        return links.map(l => l.attributes.href)
    }

    getFileNumber(filename: string): number {
        const match = filename.match(/.+?(\d+).+/)
        if (match !== null) {
            return Number(match[1])
        }
        return 0
    }
}