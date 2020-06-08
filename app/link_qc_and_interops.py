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

    # lanes_loaded = {"projects":[{"project":"05732_AJ","samples":[{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_10"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_40"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_19"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_33"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_47"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_11"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_26"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_18"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_9"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_2"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_32"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_12"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_45"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_42"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_5"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_20"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_31"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_6"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_21"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_41"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_46"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_27"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_17"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_29"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_23"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_44"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_7"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_22"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_28"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_16"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_14"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_30"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_43"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_15"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_37"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_13"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_25"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_35"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_1"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_36"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_38"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_50"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_51"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_34"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_48"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_24"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_49"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_54"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_52"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_53"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_3"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_8"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_39"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_4"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_55"},{"flowCellLanes":[1,2,3,4],"sample":"05732_AJ_56"}]}]}
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

fields = ["Sample", "Run"]
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

for project in projects:
    lane_dic = get_sample_to_lane_dic(project)
    qc_grid = get_qc_grid(project)

    # Write headers
    joinedInterOpsCsv.write("Project,%s,%s,%s\n" % (",".join(fields),"Lane",",".join(interops_fields)))
    for k,row in qc_grid.items():
        base_row = "%s," % project
        prj_sample = row["IGO Id"]
        run = row["Run"]

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
