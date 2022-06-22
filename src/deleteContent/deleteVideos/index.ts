import { Progress } from "../../progress";
import { Task } from "../../Task";

export async function deleteVideos(progress: Progress) {
    if (progress.task !== Task.DeleteVideos) {
        progress.task = Task.DeleteVideos
    }

}
