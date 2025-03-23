import fs from "fs"
import path from "path"
import { parse as parseHTML } from "node-html-parser"
import iconv from "iconv-lite"
import { getDirectries, getFiles } from "@/utils/fs"
import { ParserAbstract } from "../ParserAbstract"
import { LikeDataItem } from "./LikeDataItem"
import { LikeType } from "./LikeType"

export class LikesParser extends ParserAbstract {
    logName: string = "LikesParser"
    targetDirectory = "likes"

    async parse(): Promise<LikeDataItem[]> {
        let data: LikeDataItem[] = []

        // for every dir
        // for every file in dir
        // save likes data to plain array with its type

        // get directory content
        let dirs = await getDirectries(this.targetPath)

        // get files in directory
        for (const dir of dirs) {
            // this.log("___directory:", dir)
            let dirPath = path.join(this.targetPath, dir)

            let files = await getFiles(dirPath, ".html", true)

            // parse each file
            // add its links to data array
            for (const file of files) {
                // read file
                let filePath = path.join(dirPath, file)
                let fileData = await fs.promises.readFile(filePath)
                let fileContent = iconv.decode(fileData, "win1251")

                // parse content
                let items = this.parseFile(fileContent)

                for (const item of items) {
                    // save url and type
                    data.push({
                        url: item,
                        type: LikeType[dir]
                    })
                }
            }
        }

        return data
    }

    parseFile(content: string): string[] {
        const root = parseHTML(content)
        let items = root.querySelectorAll(".item a")
        return items.map(i => i.attributes.href)
    }
}


