# Version 1.0


from flask import Flask, render_template, url_for, request, redirect, make_response
from functools import wraps
from collections import defaultdict
import requests
import os, json, re, yaml
from settings import APP_STATIC
app = Flask(__name__)
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.poolmanager import PoolManager
import ssl
import re
import time
import uwsgi, pickle
from operator import itemgetter
import Grid

app.config['PROPAGATE_EXCEPTIONS'] = True
class MyAdapter(HTTPAdapter):
    def init_poolmanager(self, connections, maxsize, block=False):
        self.poolmanager = PoolManager(num_pools=connections,
                maxsize=maxsize,
                block=block,
                ssl_version=ssl.PROTOCOL_SSLv23)
                #ssl_version=ssl.PROTOCOL_SSLv3)

s = requests.Session()
s.mount('https://', MyAdapter())

config = os.path.join(os.path.dirname(os.path.realpath(__file__)), "lims_user_config")
config_options = yaml.load(open(config, "r"))
USER = config_options['username']
PASSW = config_options['password']
PORT = config_options['port']
LIMS_API_ROOT =config_options['lims_end_point']

# This decorator make a function able to read the project ID input of the user and then launch the
# data gathering process.
def navbarForm(func):
    @wraps(func)
    def inner(*args, **kwargs):
        errors = ''
        if request.method == "GET":     # If the request is GET, we apply the function.
            return func(*args, **kwargs)
        else:                           # If the request is POST or PUT, we check the input and then redirect the URL.
            project_id = request.form['project_id'].strip()
            if not project_id:
                return redirect( url_for('page_not_found', pId='fail', code_error=1) )
            if not errors:
                # Validate the project_id and raise an error if it is invalid
                if not is_project_id_valid(project_id):
                    return redirect( url_for('page_not_found', pId='fail', code_error=2) )
                else:
            # If there are no errors, create a dictionary containing all the entered
                    # data and pass it to the template to be displayed
                    data = {'project_id': project_id}
                    # Since the form data is valid, render the success template
                    return redirect( url_for('data_table', pId=project_id) )
    return inner

# Here we define some useful functions

# This function validates the shape of the project ID
def is_project_id_valid(project_id):
    """Validate the project_id using a regex."""
    if not re.match("^[a-zA-Z0-9_]+$", project_id):
        return False
    return True

@app.route('/', methods=['GET', 'POST'])
@app.route('/home', methods=['GET', 'POST'])
@navbarForm
def index():
    r = s.get(LIMS_API_ROOT + "/LimsRest/getRecentDeliveries", auth=(USER, PASSW), verify=False)
    data = json.loads(r.content)
    projects = []
    review_projects = []
    active_projects = []
    if len(data) > 0:
         projects = data
    for project in projects:
        unreviewed = False
        runs =[]
        recentDate = 0
        for sample in project['samples']:
            if 'basicQcs' not in sample or len(sample['basicQcs']) == 0:
               if 'ready' not in project:
                  project['ready'] = False
            else:
               project['ready'] = True
               for qc in sample['basicQcs']:
                  if qc['qcStatus'] == 'Under-Review':
                       unreviewed = True
                  if 'run' not in qc:
                       continue
                  trimmed = re.match("([A-Z|0-9]+_[0-9]+)", qc['run']).groups()[0]
                  if trimmed not in runs:
                      runs.append(trimmed)
                  if qc['createDate'] > recentDate:
                      recentDate = qc['createDate']
        project['run'] = ", ".join(runs)
        project['ordering'] = recentDate
        project['date'] = time.strftime('%Y-%m-%d %H:%M', time.localtime((recentDate/1000)))
        if unreviewed:
            review_projects.append(project)
        else:
            active_projects.append(project)
    review_projects.sort(key=itemgetter('ordering'))
    active_projects.sort(key=itemgetter('ordering'))
    if uwsgi.cache_exists("delivered", "igoqc"):
        delivery_data = json.loads(pickle.loads(uwsgi.cache_get("delivered", "igoqc")))
    else:
        delReq = s.get(LIMS_API_ROOT + "/LimsRest/getRecentDeliveries?time=2&units=d", auth=(USER, PASSW), verify=False)
        del_content = delReq.content
        delivery_data = json.loads(del_content)
        if uwsgi is not None:
           uwsgi.cache_set("delivered", pickle.dumps(del_content), 3600)
    for project in delivery_data:
        recentDate = 0
        for sample in project['samples']:
            if 'basicQcs' in sample:
                for qc in sample['basicQcs']:
                     if qc['createDate'] > recentDate:
                         recentDate = qc['createDate']
        project['ordering'] = recentDate
        project['date'] = time.strftime('%Y-%m-%d %H:%M', time.localtime((recentDate/1000)))
    delivery_data.sort(key=itemgetter('ordering'))
    return render_template("index.html", **locals())

def build_grid_from_samples(samples, pType):
    header = ["Run", "Sample", "IGO Id", "Genome", "Tumor or Normal",
                 "Concentr.  (nM)", "Final Library Yield (fmol)", "Coverage Target", "Requested Reads (Millions)", "Initial Pool",
                 "QC Status", "Pct. Adapters", "Reads Examined", "Unpaired Reads", "Sum Reads",
                 "Unmapped", "Pct. Duplic."]
    hs_header = ["Run", "Sample", "IGO Id", "Initial Pool", "QC Status", "Tumor or Normal",
                 "Coverage Target", "Requested Reads (Millions)", "Sum MTC", "Sum Reads", "Pct. Duplic.", "Pct. Off Bait",
                 "Mean Tgt Cvg", "Reads Examined", "Unmapped", "Unpaired Reads", "Pct. Adapters",
                 "Pct. Zero Cvg", "Pct. 10x", "Pct. 30x", "Pct. 100x", "Genome"]
    rna_header =  ["Run", "Sample", "IGO Id", "Genome", "Tumor or Normal",
                     "Concentr.  (nM)", "Final Library Yield (fmol)", "Requested Reads (Millions)", "Initial Pool",
                     "QC Status", "Pct. Adapters", "Reads Examined", "Unpaired Reads", "Sum Reads",
                     "Unmapped", "Pct. Duplic.",
                     "Pct. Ribos.", "Pct. Coding", "Pct. Utr", "Pct. Intron.", "Pct. Intergenic", "Pct. Mrna"]
    #compute the sum of the 'readDuped' by 'sampleName'
    sumReadDict = defaultdict(int)
    l = {}
    for sample in samples:
        if sample['qc']['qcStatus'] != "Failed" and sample['qc']['qcStatus'] != "Failed-Reprocess":
            if sample['qc']['readsExamined']>0:
                sumReadDict[sample['cmoId']] += sample['qc']['readsExamined']
            else:
                sumReadDict[sample['cmoId']] += sample['qc']['unpairedReadsExamined']

    #compute the sum of the 'meanTargetCoverage' by 'sampleName'
    l = {}
    sumMtcDict = defaultdict(float)

    for sample in samples:
        if sample['qc']['qcStatus'] != "Failed" and sample['qc']['qcStatus'] != "Failed-Reprocess":
            sumMtcDict[sample['cmoId']] += sample['qc']['meanTargetCoverage']
    for sample in samples:
        sample['sumMtc'] = sumMtcDict[sample['cmoId']]
        sample['sumReads'] = sumReadDict[sample['cmoId']]
        l[sample['qc']['sampleName']] = 1

    #format of 'run'
    for sample in samples:
        if 'run' not in sample['qc'] or '_' not in sample['qc']['run']:
            continue
        l = sample['qc']['run'].split('_')
        sample['qc']['run_toprint'] = l[0] + '_' + l[1]

    #format of 'concentration'
    for sample in samples:
        l = sample['concentration'].split()
        if l[1] == 'pM':
            l[0] = float(l[0]) / 1000
        sample['concentration'] = float(l[0])

    for sample in samples:
        if 'quantIt' in sample['qc']:
            pType['quanted'] = True
        else:
            sample['qc']['quantIt'] = 0.0
            sample['qc']['quantUnits'] = "NA"
        if 'qcControl' in sample['qc']:
            pType['qcControlled'] = True
        else:
            sample['qc']['qcControl'] = 0.0
            sample['qc']['qcUnits'] = 0.0
        if 'startingAmount' in sample['qc']:
            pType['startable'] = True
        else:
            sample['qc']['startingAmount'] = 0.0

    if pType['table'] == 'hs':
        header = hs_header
    elif pType['table'] == 'rna':
        header = rna_header
    genome_index = header.index("Genome")
    if "startable" in pType:
        if pType["startable"]:
            header.insert(genome_index + 1, "Starting Amount")
    if "qcControlled" in pType:
        if pType["qcControlled"]:
            header.insert(genome_index + 1, "Library Quality Control")
    if "quanted" in pType:
        if pType["quanted"]:
            header.insert(genome_index + 1, "Quant-it")

    grid = Grid.Grid()
    grid.set_header(header)
    grid.assign_value_types()
    row = 0
    for sample in samples:
        qc = sample['qc']
        grid.set_value("Run", row, qc['run'])
        grid.set_value("QC Status", row, qc['qcStatus'])
        grid.set_value("Sample", row, qc['sampleName'])
        grid.set_value("QC Record Id", row, qc['recordId'])
        grid.set_value("IGO Id", row, sample['baseId'])
        grid.set_value("Genome", row, sample['species'])
        grid.set_value("Tumor or Normal", row, 'Normal')
        grid.set_style("Tumor or Normal", row, "text-primary")
        if sample['tumorOrNormal'] == 'Tumor':
            grid.set_value("Tumor or Normal", row, 'Tumor')
            grid.set_style("Tumor or Normal", row, "text-danger")
        grid.set_value("Concentr.  (nM)", row, format_fp(sample['concentration']))
        grid.set_value("Final Library Yield (fmol)", row, sample['yield'])
        cov_target = "" if sample['coverageTarget'] == 0 else sample['coverageTarget'] # hack; coverage target is set to 0 in LIMS by default at pull, will display as empty string on site
        grid.set_value("Coverage Target", row, format_int(cov_target))
        grid.set_value("Requested Reads (Millions)", row, format_int(sample['requestedNumberOfReads']))
        grid.set_value("Pct. Adapters", row, qc['percentAdapters'] * 100) #
        grid.set_value("Reads Examined", row, format_int(qc['readsExamined']))
        grid.set_value("Unpaired Reads", row, format_int(qc['unpairedReadsExamined']))
        grid.set_value("Initial Pool", row, "")
        if "initialPool" in sample:
            grid.set_value("Initial Pool", row, sample["initialPool"])
        grid.set_value("Unmapped", row, format_int(qc['unmapped']))
        grid.set_value("Pct. Duplic.", row, format_fp(qc['percentDuplication'] * 100)) #
        if pType["startable"]:
            grid.set_value("Starting Amount", row, qc["startingAmount"])
        if pType["qcControlled"]:
            grid.set_value("Library Quality Control", row, "{:,.2f}".format(qc["qcControl"]) + " " +  str(qc["qcUnits"]))
        if pType["quanted"]:
            grid.set_value("Quant-it", row, "{:,.2f}".format(qc["quantIt"]) + " " +  qc["quantUnits"])
        grid.set_value("Sum Reads", row, format_int(sample["sumReads"]))
        if pType['table'] != 'hs' and 'requestedNumberOfReads' in sample:
            try:
                if sample['sumReads'] <= float(sample['requestedNumberOfReads']):
                    grid.set_style("Sum Reads", row, "highlight")
            except ValueError:
                grid.set_style("Sum Reads", row, None)
        if pType['table'] == 'rna':
            grid.set_value("Pct. Ribos.", row, format_fp(qc['percentRibosomalBases'] * 100))
            grid.set_value("Pct. Coding", row, format_fp(qc['percentCodingBases'] * 100))
            grid.set_value("Pct. Utr", row, format_fp(qc['percentUtrBases'] * 100))
            grid.set_value("Pct. Intron.", row, format_fp(qc['percentIntronicBases'] * 100))
            grid.set_value("Pct. Intergenic", row, format_fp(qc['percentIntergenicBases'] * 100))
            grid.set_value("Pct. Mrna", row, format_fp(qc['percentMrnaBases'] * 100))
        if pType['table'] == 'hs':
            grid.set_value("Mean Tgt Cvg", row, format_fp(qc['meanTargetCoverage']))
            if "sumMtc" in sample:
               grid.set_value("Sum MTC", row, format_fp(sample['sumMtc']))
               if 'requestedNumberOfReads' in sample:
                   try:
                       if sample['sumMtc'] <= float(sample['requestedNumberOfReads']):
                           grid.set_style("Sum MTC", row, "highlight")
                   except ValueError:
                       grid.set_style("Sum MTC", row, None)
            grid.set_value("Pct. Zero Cvg", row, format_fp(qc['zeroCoveragePercent'] * 100))
            grid.set_value("Pct. Off Bait", row, format_fp(qc['percentOffBait'] * 100))
            grid.set_value("Pct. 10x", row, format_fp(qc['percentTarget10x'] * 100))
            grid.set_value("Pct. 30x", row, format_fp(qc['percentTarget30x'] * 100))
            grid.set_value("Pct. 100x", row, format_fp(qc['percentTarget100x'] * 100))
        row += 1
    return grid

def format_fp(value):
    try:
        return "{:,.2f}".format(value)
    except ValueError:
        return value

def format_int(value):
    try:
        return "{:,}".format(value)
    except ValueError: 
        return value

@app.route('/<pId>', methods=['GET', 'POST'])
@navbarForm
def data_table(pId):

    #define variables
    data = {}
    qcStatusLabel = []
    lims_version = "igo" #tango
    #get the content, turning off SSL_VERIFY_CERTIFICATE and supplying username/pass
    r = s.get(LIMS_API_ROOT + "/LimsRest/getProjectQc?project="+pId, auth=(USER, PASSW), verify=False) #, verify=(lims_version == "igo"))
    t = s.get(LIMS_API_ROOT + "/LimsRest/getPickListValues?list=Sequencing+QC+Status", auth=(USER, PASSW), verify=False) # verify=(lims_version == "igo"))

    #turn the json content (the body of the html reply) into a python dictionary/list object
    data = json.loads(r.content)
    qcStatusLabel = json.loads(t.content)
    #select the subset of the python dictionary that corresponds to what we want to display
    if len(data) == 0:
        return render_template("empty.html", **locals())
    samples = data[0]['samples']

    #fill status dict - CODE MOVED
    status = {}
    l = []
    for i in qcStatusLabel:
        status[i] = 0
    for sample in samples:
        if not sample['qc']['recordId'] in l:
            if 'qcStatus' in sample['qc']:
                status[sample['qc']['qcStatus']] += 1
            l.append(sample['qc']['recordId'])

    #test if the requested project exist in the LIMS else display 404.html
    if data[0]['samples'] == []:
        return redirect( url_for('page_not_found', pId=data[0]['requestId'], code_error=3) )

    if data[0]['requestId'] == "ERROR":
        return redirect( url_for('page_not_found', pId=data[0]['requestId'], code_error=3) )

    #number of samples - CODE MOVED
    l = []
    tumorCount = 0
    normalCount = 0
    for sample in samples:
        if not sample['qc']['sampleName'] in l:
            l.append(sample['qc']['sampleName'])
            if sample['tumorOrNormal'] == "Tumor":
                tumorCount += 1
            elif sample['tumorOrNormal'] == "Normal":
                normalCount += 1
    n = len(l)
    if 'sampleNumber' in data[0]:
        n = data[0]['sampleNumber']

    #fill 'requester' dict - CODE MOVED
    requester = {}
    for label in ['requestId', 'investigator',  'pi', 'projectManager', 'pipelinable', 'analysisRequested', 'cmoProject']:
        if label in data[0]:
            requester[label] = data[0][label]
        else:
            requester[label] = 'N/A'
    if 'requestedNumberOfReads' in samples[0]:
        requester['requestedNumberOfReads'] = samples[0]['requestedNumberOfReads']
        try:
           float(samples[0]['requestedNumberOfReads'])
        except ValueError:
           print("setting to N/A")
           requester['requestedNumberOfReads'] = 'N/A'
    else:
        requester['requestedNumberOfReads'] = 'N/A'
    requester['tumorCount'] = tumorCount
    requester['normalCount'] =  normalCount
    #list all recordId
    recordIds = []
    for sample in samples:
        recordIds.append(sample['qc']['recordId'])

    #fill pType dict - MOVED
    pType = {'recipe': samples[0]['recipe']}
    if 'runType' in samples[0]:
        pType['runType'] = samples[0]['runType']
    if 'RNA' in pType['recipe'] or 'SMARTerAmpSeq' in pType['recipe']:
        pType['table'] = 'rna'
    elif 'baitSet' in samples[0]['qc']:
        pType['table'] = 'hs'
        pType['baitSet'] = samples[0]['qc']['baitSet']
    else:
        pType['table'] = 'md'
    pType['startable'] = False
    pType['quanted'] = False
    pType['qcControlled'] = False

    grid = build_grid_from_samples(samples, pType)

    #get the list of the index for the runs
    #run_indexes = os.listdir ( os.path.join(APP_STATIC, "html/FASTQ") )

    #get the list of the project charts
    #Contract on file name structure RUN_ARBITRARY_NUMBER_OF_STUFF_P01234[_[A-Z]+]?_TYPE.pdf
    charts_links = {}
    project_indexes = os.listdir(APP_STATIC + "/html/PDF") #os.listdir ( os.path.join("", "html/PDF") )
    for project_index in project_indexes:
        l = project_index.split('_')
        if re.match("^[A-Z]+$", l[-2]):
            image_req = l[-3].replace("P", "") + "_" + l[-2]
        else:
            image_req = l[-2].replace("P", "")
        if image_req  == data[0]['requestId']:
            if l[-1].lower() == 'tree.pdf' or l[-1].lower() == "heatmap.pdf":
                charts_links[l[0] + '_'  + l[1] + '_' + l[-1].lower()]  = 'html/PDF/' + project_index
            elif l[-1].lower() == 'pie.pdf':
                charts_links[l[0] + '_' + l[1] + '_pie.pdf'] = 'html/PDF/' + project_index

    #pass it to templates/data_table.html to render with jinja templates
    return render_template("data_table.html", **locals())

#route for display the JSON
@app.route('/JSON_<pId>')
def displayJSON(pId):
    r = s.get(LIMS_API_ROOT + "/LimsRest/getProjectQc?project="+pId,  auth=(USER, PASSW), verify=False)
    data = json.loads(r.content)
    return render_template('json.html', **locals())

#route to post the qc status
@app.route('/post_<pId>_<recordId>_<qcStatus>')
def post_qcStatus(pId, recordId, qcStatus):
    payload = {'record': recordId, 'status': qcStatus}
    url = LIMS_API_ROOT  + "/LimsRest/setQcStatus"
    r = s.post(url, params=payload,  auth=(USER, PASSW), verify=False)
    return make_response(r.text, 200, None)

#route to post all the qc status
@app.route('/postall_<pId>_<qcStatus>')
def postall_qcStatus(qcStatus, pId):

    recordIds = request.args.getlist('recordIds')
    for recordId in recordIds:
        payload = {'record': recordId, 'status': qcStatus}
        url = LIMS_API_ROOT  + "/LimsRest/setQcStatus"
        r = s.post(url, params=payload,  auth=(USER, PASSW), verify=False)
    return make_response(r.text, 200, None)

@app.route('/add_note', methods=['POST'])
def add_note():
   payload = {'request' : request.form['request'], 'user' : 'qc_review', 'igoUser' : 'gabow', 'readMe' : request.form['readMe']}
   url = LIMS_API_ROOT + "/LimsRest/limsRequest"
   r =  s.post(url, params=payload,  auth=(USER, PASSW), verify=False)
   return redirect(url_for('index'))

# We raise an error and display it. This render '404.html' template
@app.route('/page_not_found_<pId>_<int:code_error>')
def page_not_found(pId, code_error):
    if code_error == 1:
        errors = "Bad request => You press 'Go' with an empty field: please enter the project ID."
    elif code_error == 2:
        errors = "Bad request => Please enter a valid project ID"
    elif code_error == 3:
        errors = "The metrics for this project are not loaded in the LIMS (at least up to now) => No metrics available<br>Try JSON button to display the data available for this project"
    else:
        errors="Unknown error => Try again. If the error persists, inspect the code"
    return render_template('404.html', **locals())

@app.context_processor
def utility_processor():
   def getQc(qcStatus):
       newStatus = 'btn-warning'
       if qcStatus == 'Failed':
          newStatus = 'btn-danger'
       elif qcStatus == 'Passed':
          newStatus = 'btn-primary'
       elif qcStatus == 'Under-Review':
          newStatus = 'btn-default'
       return newStatus
   return dict(getQc=getQc)

def isWholeExome(recipe):
    return recipe == "WholeExome-KAPALib" or \
    recipe == "WholeExomeSequencing" or \
    recipe == "Agilent_v4_51MB_Human" or \
    recipe == "WESAnalysis" or \
    recipe == "IDT_Exome_v1_FP" or \
    recipe == "WES"

if __name__ == '__main__':
    app.run()
