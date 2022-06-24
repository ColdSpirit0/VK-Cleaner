import config from "../config";
import { Reporter } from "../Reporter";

const manualRemoveReporter = new Reporter(config.manualRemoveReportFilename);
export default manualRemoveReporter