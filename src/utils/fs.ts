import fs from "fs";
import nodePath from "path";

export async function isExists(path: string): Promise<boolean> {
    try {
        await fs.promises.access(path, fs.constants.R_OK);
    } catch (error) {
        return false;
    }
    return true;
}

export async function getDirectries(path) {
    let dirContent = await fs.promises.readdir(path, {
        withFileTypes: true
    })

    let dirs = dirContent.filter(i => i.isDirectory()).map(i => i.name)

    return dirs
}

export async function getFiles(path, extension = null, reportOther = false) {
    let dirContent = await fs.promises.readdir(path, {
        withFileTypes: true
    })

    let files = dirContent.filter(i => i.isFile()).map(i => i.name)

    // filter by its ext
    if (extension !== null) {
        let filtered = []

        for (const file of files) {
            if (nodePath.extname(file) === extension) {
                filtered.push(file)
            }
            else if (reportOther) {
                console.error("found strange file:", file);
            }
        }

        files = filtered
    }

    return files
}
