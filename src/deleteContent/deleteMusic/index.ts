import { Progress } from "../../progress";
import { Task } from "../../Task";

export async function deleteMusic(progress: Progress) {
    if (progress.task !== Task.DeleteMusic) {
        progress.task = Task.DeleteMusic
    }

}