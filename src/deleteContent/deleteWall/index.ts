import { Progress } from "../../progress";
import { Task } from "../../Task";

export async function deleteWall(progress: Progress) {
    if (progress.task !== Task.DeleteWall) {
        progress.task = Task.DeleteWall
    }

}