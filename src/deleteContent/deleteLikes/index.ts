import config from "../../config";
import { LikeDataItem } from "../../parsers/LikeParser/LikeDataItem";
import { LikesParser } from "../../parsers/LikeParser/LikesParser";
import { LikeType } from "../../parsers/LikeParser/LikeType";
import { Progress } from "../../progress";
import { Task } from "../../Task";
import { deleteLikeBase } from "./base";
import { deleteLikeWallReply } from "./wallReply";
import { deleteLikePhotoComments, deleteLikeTopicComments, deleteLikeVideoComments } from "./comments";
import { reporter } from "./reporter";
import { openPage } from "../vkHelpers";
import manualRemoveReporter from "../manualRemoveReporter";

const customLikes: LikeDataItem[] = [
    // you can setup test data here:
    //{url: "http://vk.com/...", type: LikeType....}
]

let likesOrder = [
    { type: LikeType.wall, reverse: false },
    { type: LikeType.wall_reply, reverse: false },
    { type: LikeType.photo, reverse: true },
    { type: LikeType.photo_comment, reverse: false },
    { type: LikeType.video, reverse: false },
    { type: LikeType.video_comment, reverse: false },
    { type: LikeType.topic_comment, reverse: false },
]

async function getParserData() {
    if (customLikes.length > 0) return customLikes

    let likesParser = new LikesParser();
    likesParser.init(config.archivePath);
    return await likesParser.parse();
}

export async function deleteLikes(progress: Progress) {
    if (!progress.initialized) {

        // get data from parser
        let likesDataRaw = await getParserData();

        let likesData = []
        for (const orderItem of likesOrder) {
            let likesTyped = likesDataRaw.filter(a => a.type === orderItem.type)

            if (orderItem.reverse) {
                likesTyped.reverse()
            }

            likesData = likesData.concat(likesTyped)
        }

        progress.data = likesData
        progress.initialized = true
    }

    for (; progress.index < progress.data.length; progress.index++) {
        const like: LikeDataItem = progress.data[progress.index];

        let pageOk = await openPage(like.url, reporter)
        if (!pageOk) {
            await deleteLikeManual(like)
            continue
        }

        switch (like.type) {
            case LikeType.wall:
            case LikeType.video:
            case LikeType.photo:
                await deleteLikeBase(like)
                break

            case LikeType.wall_reply:
                await deleteLikeWallReply(like)
                break

            case LikeType.photo_comment:
                await deleteLikePhotoComments(like)
                break

            case LikeType.video_comment:
                await deleteLikeVideoComments(like)
                break

            case LikeType.topic_comment:
                await deleteLikeTopicComments(like)
                break

            default:
                await deleteLikeManual(like)
                break
        }
    }
}

// just save to log
async function deleteLikeManual(like: LikeDataItem) {
    await reporter.report(like.url, "Требуется удаление вручную")
    await manualRemoveReporter.report(like.url, "Требуется удаление вручную")
}


