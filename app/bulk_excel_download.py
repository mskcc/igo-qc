import requests
import json
import csv
import datetime

projects = ["07428_AH",
"07428_AF",
"07428_AM",
"07428_C",
"07428_AJ",
"07428_T",
"07428_N",
"07428_S",
"07428_O",
"07428_X",
"07428_BB",
"07428_Z",
"07428_H",
"07428_P",
"07428_AY",
"07428_AV",
"07428_BE",
"07428_AS",
"07428_F",
"07428_AG",
"07428_K",
"07428_AR",
"07428_AP",
"07428_BF",
"07428_AD"]


USER = "pms"
PASSW = "tiagostarbuckslightbike"
LIMS_QC_ROOT = "https://igolims.mskcc.org:8443/LimsRest/getProjectQc?project="

def safe_string_extract(obj, field):
    if field in obj:
        return obj[field]
    print("Could not extract %s" % field)
    return ""

for project in projects:
    get_project_qc_url = LIMS_QC_ROOT + project
    project_qc_resp = requests.get(get_project_qc_url, auth=(USER, PASSW), verify=False)
    content = project_qc_resp.content
    try:
        loaded = json.loads(content)
        data = loaded[0]
    except TypeError:
        print("Failure converting service response")

    samples = data["samples"]

    data_file = open("%s.csv" % (project), 'w')
    data_file.write("cmoId, project, recipe, userId, sampleName, baitSet, baseId, run\n")

    for sample in samples:
        cmo_id = safe_string_extract(sample,"cmoId")
        project = safe_string_extract(sample,"project")
        recipe = safe_string_extract(sample,"recipe")
        user_id = safe_string_extract(sample,"userId")
        baseId = safe_string_extract(sample,"baseId")

        qc = sample["qc"]
        sample_name = safe_string_extract(qc,"sampleName")
        bait_set = safe_string_extract(qc,"baitSet")
        run = safe_string_extract(qc,"run")

        data_file.write("%s,%s,%s,%s,%s,%s,%s,%s\n" % (cmo_id, project, recipe, user_id, sample_name, bait_set, baseId, run))
    data_file.close()
