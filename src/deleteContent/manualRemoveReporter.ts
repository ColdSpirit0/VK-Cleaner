import config from "@/config";
import { Reporter } from "@/classes/Reporter";

const manualRemoveReporter = new Reporter(config.manualRemoveReportFilename);
export default manualRemoveReporter