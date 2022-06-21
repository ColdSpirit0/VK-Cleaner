import config from "../config";
import { Reporter } from "../Reporter";
import { Task } from "../Task";


export const reporter = new Reporter(Task.DeleteLikes);
export const manualRemoveReporter = new Reporter(config.manualRemoveReportFilename);
