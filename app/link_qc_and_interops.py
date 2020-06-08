import requests
import json
import csv
import datetime

USER = "pms"
PASSW = "tiagostarbuckslightbike"
LIMS_INTEROPS_ROOT = "https://igolims.mskcc.org:8443/LimsRest/getInterOpsData?runId="
LIMS_PROJECT_LANES = "http://localhost:5007/LimsRest/getSampleFlowCellLanes?projects="
RUN_QC_ROOT = "https://igo.mskcc.org/run-qc//projectInfo/"

def safe_string_extract(obj, field):
    if field in obj and obj[field] != None:
        return obj[field]
    print("Could not extract %s" % field)
    return ""

def safe_obj_extract(obj, field):
    if field in obj:
        return obj[field]
    print("Could not extract %s" % field)
    return {}

def safe_list_extract(obj, field):
    if field in obj:
        return obj[field]
    print("Could not extract %s" % field)
    return []

def get_json_from_url_resp(url):
    resp = requests.get(url, auth=(USER, PASSW), verify=False)
    content = resp.content
    loaded = json.loads(content)

    return loaded

def get_sample_to_lane_dic(project):
    find_lanes_url = LIMS_PROJECT_LANES + project
    lanes_loaded = get_json_from_url_resp(find_lanes_url)

    lane_project_info = safe_obj_extract(lanes_loaded, "projects")
    lane_dic = {}
    for entry in lane_project_info:
        prj = safe_string_extract(entry, "project")
        lane_dic[prj] = {}
        samples = safe_list_extract(entry, "samples")
        for sample_entry in samples:
            sample = safe_string_extract(sample_entry, "sample")
            lanes = safe_list_extract(sample_entry, "flowCellLanes")
            lane_dic[prj][sample] = lanes

    return lane_dic

def get_qc_grid(project):
    get_project_qc_url = RUN_QC_ROOT + project
    qc_loaded = get_json_from_url_resp(get_project_qc_url)

    qc_data = safe_obj_extract(qc_loaded, "data")
    grid_wrapper = safe_obj_extract(qc_data, "grid")
    grid = safe_obj_extract(grid_wrapper, "grid")

    return grid

def get_interops_data(run, fields):
    url = LIMS_INTEROPS_ROOT + run
    entries = get_json_from_url_resp(url)

    interops_dic = {}
    for entry in entries:
        lane = entry["i_Lane"]
        read = entry["i_Read"]

        # We just choose the first read
        if(read == "1"):
            values = [ safe_string_extract(entry, f) for f in fields ]
            lane_key = int(lane) # QC data has lane as a number
            interops_dic[lane_key] = values

    return interops_dic

joinedInterOpsCsv = open("interOpsQc.csv", "w")

fields = ["Sample", "Run", "Pct. Duplic.", "PCT_EXC_DUPE", "Pct. Adapters", "Quant-it", "Sum Reads", "Sum MTC", "Unmapped", "Unpaired Reads", "Concentr.  (nM)", "Final Library Yield (fmol)", "Mean Tgt Cvg", "PCT_EXC_BASEQ", "PCT_EXC_MAPQ", "PCT_EXC_TOTAL"]
interops_fields = ["i_ClusterPF", "i_ReadsPFM", "i_Q30", "i_Aligned", "i_ErrorRate", "i_Percent_Occupied"]

# TODO - delete
projects = ["05732_AJ"]

# Store all interops data (since a run may be used across multiple projects)
interops_dic = {}

def get_interops_for_run(interops_dic, fields, run):
    if run not in interops_dic:
        run_interops = get_interops_data(run, fields)
        interops_dic[run] = run_interops
    return interops_dic[run]

# Write headers
joinedInterOpsCsv.write("Project,%s,%s,%s\n" % (",".join(fields),"Lane",",".join(interops_fields)))

for project in projects:
    print("processing project: " + project)

    print("\tlane mapping...")
    lane_dic = get_sample_to_lane_dic(project)

    print("\tqc grid...")
    qc_grid = get_qc_grid(project)

    for k,row in qc_grid.items():
        base_row = "%s," % project
        prj_sample = row["IGO Id"]
        run = row["Run"]

        print("\tinterops for run: %s ..." % run)
        run_interops = get_interops_for_run(interops_dic, interops_fields, run)

        for field in fields:
            val = safe_string_extract(row, field)
            base_row = "%s %s," % (base_row, val)

        lanes = lane_dic[project][prj_sample]
        for lane in lanes:
            # TODO - work out w/ Liping.
            # e.g. (Run: TOMS_5330_000000000-C536J, Igo Id: 05732_AJ_37) has FlowCell lanes [1, 2, 3, 4], but the run has only one lane...
            if lane in run_interops:
                lane_info = run_interops[lane]
                lane_info_str = ",".join(lane_info)
                csv_row = "%s %s, %s\n" % (base_row, lane, lane_info_str)

        joinedInterOpsCsv.write(csv_row)

joinedInterOpsCsv.close()
