export const CELL_RANGER_APPLICATION_COUNT = 'Expression';  // CASES: "10X_Genomics-Expression+VDJ", "10X_Genomics_GeneExpression-5"
export const CELL_RANGER_APPLICATION_VDJ =  ''; // TODO

// MODAL STATUS MESSAGES
export const MODAL_ERROR = 'MODAL_ERROR';
export const MODAL_UPDATE = 'MODAL_UPDATE';
export const MODAL_SUCCESS = 'MODAL_SUCCESS';

// REDUX
export const PROJECT_FLAGS = 'project_flags';

// HEADERS
export const NGS_HEADERS_TO_REMOVE = ["Chemistry", "CellRangerVersion", "CompressedGraphData", "graphs", "Transcriptome"];

// SERVICE ERRORS
export const NGS_STATS = 'ngs-stats';
export const PROJECT_INFO = 'project-info';

// API fields - Fields of the service response objects
// LIMS
export const LIMS_REQUEST_ID = 'requestId';

// NGS-Stats
export const CROSSCHECK_METRICS_ENTRIES = 'entries';
export const CROSSCHECK_METRICS_PASS = 'pass';
export const CROSSCHECK_METRICS_FLAG = 'flag';
export const CROSSCHECK_METRICS_FLAG_PASS = 'PASS';
export const CROSSCHECK_METRICS_FLAG_WARNING = 'WARNING';
export const CROSSCHECK_METRICS_FLAG_ERROR = 'FAIL';
export const CELL_RANGER_SAMPLE_NAME = 'id';

// HANDSONTABLE
// Columns not shown as selectors, i.e. shouldn't be toggled off so are not shown
export const TABLE_MANDATORY_COLUMNS = new Set(['Sample', 'QC Status', 'QC Record Id']);
