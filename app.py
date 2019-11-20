# Version 1.0

import sys
import uwsgi, pickle
from flask import Flask, render_template, url_for, request, redirect, make_response, jsonify
from flask_login import login_user, login_required, LoginManager, UserMixin
from flask_cors import CORS
from functools import wraps
from collections import defaultdict
import requests
import os, json, re, yaml
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.poolmanager import PoolManager
import ssl
import re
import time, datetime, glob
from operator import itemgetter
import ldap
import smtplib
from email.message import EmailMessage
import logging
from logging.config import dictConfig

sys.path.insert(0, os.path.abspath("config"))
import headers
from constants import LIMS_TASK_REPOOL, LIMS_TASK_SET_QC_STATUS, API_RECORD_ID, API_PROJECT, API_QC_STATUS, API_RECIPE, RECIPE_IMPACT, RECIPE_HEMEPACT
from settings import APP_STATIC, FASTQ_PATH, URL_PREFIX
import Grid

# Configurations
config = os.path.join(os.path.dirname(os.path.realpath(__file__)), "lims_user_config")
config_options = yaml.load(open(config, "r"))

# Configure app
app = Flask(__name__)
cors = CORS(app, resources={r"/getRecentRuns": {"origins": "*"}, r"/getRequestProjects": {"origins": "*"}, r"/changeRunStatus": {"origins": "*"}, r"/getSeqAnalysisProjects": {"origins": "*"}, r"/projectInfo/*": {"origins": "*"}})
app.config['PROPAGATE_EXCEPTIONS'] = True
app.config['SECRET_KEY'] = config_options['secret_key']

# Configure modules
class MyAdapter(HTTPAdapter):
    def init_poolmanager(self, connections, maxsize, block=False):
        self.poolmanager = PoolManager(num_pools=connections,
                maxsize=maxsize,
                block=block,
                ssl_version=ssl.PROTOCOL_SSLv23)
s = requests.Session()
s.mount('https://', MyAdapter())
login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

LDAP_URL = config_options['ldap_url']
AUTHORIZED_GROUP = config_options['authorized_group']
USER = config_options['username']
PASSW = config_options['password']
PORT = config_options['port']
LIMS_API_ROOT =config_options['lims_end_point']
CACHE_TIME_LONG = 21600     # 6 hours
CACHE_TIME_SHORT = 300      # 5 minutes
CACHE_NAME = "igoqc"        # Take from .ini file

dictConfig({
    'version': 1,
    'formatters': {
        'default': {
            'format': '[%(asctime)s] %(message)s'
            # 'format': '[%(asctime)s] SAMPLE.REC.BE %(levelname)s in %(module)s: %(message)s'
        }
    },
    'handlers': {
        'wsgi': {
            'class': 'logging.StreamHandler',
            'stream': 'ext://flask.logging.wsgi_errors_stream',
            'formatter': 'default',
        }
    },
    'root': {'level': 'INFO', 'handlers': ['wsgi']},
})

# LOGIN LOGIC
class User(UserMixin):
    def __init__(self, username):
        self.username = username
        self.id = id

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_active(self):
        return True
current_user = User("username")
@login_manager.user_loader
def load_user(user_id):
    return current_user

@app.route('/login')
def login():
    return render_template('login.html', URL_PREFIX=URL_PREFIX)

@app.route('/authenticate', methods=['GET', 'POST'])
def authenticate():
    try:
        username = request.form.get("username")
        password = request.form.get("password")
    except:
        flash('Missing username or password. Please try again.')
        return render_template('login.html')
    try:
        result = ldap_authenticate(username, password)
    except ldap.INVALID_CREDENTIALS:
        flash('Please check your login details and try again.')
        return render_template('login.html')
    if is_authorized(result):
        app.logger.info('Authorizing %s' % username)
        login_user(User(username))
        current_user = User(username)
        return redirect(url_for('index'))
    else:
        flash('You are not authorized to view this page')
        return render_template('login.html')

def get_ldap_connection():
    conn = ldap.initialize(LDAP_URL)
    conn.set_option(ldap.OPT_REFERRALS, 0)
    return conn

def ldap_authenticate(username, password):
    conn = get_ldap_connection()

    conn.simple_bind_s('%s@mskcc.org' % username, password)
    attrs = ['sAMAccountName', 'displayName', 'memberOf', 'title']
    result = conn.search_s(
        'DC=MSKCC,DC=ROOT,DC=MSKCC,DC=ORG',
        ldap.SCOPE_SUBTREE,
        'sAMAccountName=' + username,
        attrs,
    )
    conn.unbind_s()
    return result

def is_authorized(result):
    return AUTHORIZED_GROUP in format_result(result)

def format_result(result):
    p = re.compile('CN=(.*?)\,')
    groups = re.sub('CN=Users', '', str(result))
    return p.findall(groups)


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
@navbarForm
@login_required
def index():
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
    wgs_header = ["Run", "Sample", "IGO Id", "Genome", "Tumor or Normal",
                "Concentr.  (nM)", "Final Library Yield (fmol)", "Coverage Target", "Requested Reads (Millions)", "Initial Pool",
                "QC Status", "MEAN_COVERAGE", "Pct. Duplic.", "Pct. Adapters", "Reads Examined", "Unpaired Reads", "Sum Reads","Unmapped", 
                "PCT_EXC_MAPQ", "PCT_EXC_DUPE", "PCT_EXC_BASEQ", "PCT_EXC_TOTAL", "PCT_10X", "PCT_30X", "PCT_40X", "PCT_80X", "PCT_100X"]    
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
    elif pType['table'] == 'wgs':
        header = wgs_header
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
        if "species" in sample:
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
        if pType['table'] == 'wgs':
            addSumMtc(grid, row, sample, qc)
            grid.set_value("MEAN_COVERAGE", row, format_int(qc["mean_COVERAGE"]))
            grid.set_value("PCT_EXC_MAPQ", row, format_fp(qc['pct_EXC_MAPQ'] * 100))
            grid.set_value("PCT_EXC_DUPE", row, format_fp(qc['pct_EXC_DUPE'] * 100))
            grid.set_value("PCT_EXC_BASEQ", row, format_fp(qc['pct_EXC_BASEQ'] * 100))
            grid.set_value("PCT_EXC_TOTAL", row, format_fp(qc['pct_EXC_TOTAL'] * 100))
            grid.set_value("PCT_10X", row, format_fp(qc['percentTarget10x'] * 100))
            grid.set_value("PCT_30X", row, format_fp(qc['percentTarget30x'] * 100))
            grid.set_value("PCT_40X", row, format_fp(qc['percentTarget40x'] * 100))
            grid.set_value("PCT_80X", row, format_fp(qc['percentTarget80x'] * 100))
            grid.set_value("PCT_100X", row, format_fp(qc['percentTarget100x'] * 100))
        if pType['table'] == 'hs':
            addSumMtc(grid, row, sample, qc)
            grid.set_value("Pct. Zero Cvg", row, format_fp(qc['zeroCoveragePercent'] * 100))
            grid.set_value("Pct. Off Bait", row, format_fp(qc['percentOffBait'] * 100))
            grid.set_value("Pct. 10x", row, format_fp(qc['percentTarget10x'] * 100))
            grid.set_value("Pct. 30x", row, format_fp(qc['percentTarget30x'] * 100))
            grid.set_value("Pct. 100x", row, format_fp(qc['percentTarget100x'] * 100))
        row += 1
    return grid

def addSumMtc(grid, row, sample, qc):
    grid.set_value("Mean Tgt Cvg", row, format_fp(qc['meanTargetCoverage']))
    if "sumMtc" in sample:
       grid.set_value("Sum MTC", row, format_fp(sample['sumMtc']))
       if 'requestedNumberOfReads' in sample:
           try:
               if sample['sumMtc'] <= float(sample['requestedNumberOfReads']):
                   grid.set_style("Sum MTC", row, "highlight")
           except ValueError:
               grid.set_style("Sum MTC", row, None)

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


'''
Returns if a project is ready, which is true if none of its samples have 'basicQcs' entries
'''
def isProjectReady(project):
    samples = project['samples']
    if len(samples) == 0:
        return False

    # Only one sample needs to have a non-empty 'basicQcs' field for the project to be considered ready
    for sample in samples:
        if 'basicQcs' in sample and len(sample['basicQcs']) > 0:
            return True

    return False

'''
Based on the basicQcs::qcStatus of each sample. Only one sample in the project needs to be under-review to be un-reviewed
@param project, Object - Project entry taken directly from response
@returns {boolean}
'''
def isUnreviewed(project):
    samples = project['samples']

    for sample in samples:
        if 'basicQcs' not in sample:
            continue

        basicQcs = sample['basicQcs']
        # Entire project is considered under review if one sample is underReview
        for qc in basicQcs:
            if 'qcStatus' in qc and qc['qcStatus'] == 'Under-Review':
                return True

    return False

'''
Returns recent runs and date of the most recent sample

@param project, Object - Project entry taken directly from response
@returns {[*, number]}
'''
def getRecentDateAndRuns(project):
    samples = project['samples']
    runs = set()
    recentDate = 0

    for sample in samples:
        if 'basicQcs' not in sample:
            continue
        for qc in sample['basicQcs']:
            run = qc['run']
            trimmed = re.match("([A-Z|0-9]+_[0-9|A-Z]+)", qc['run']).groups()[0]
            runs.add(trimmed);
            if qc['createDate'] > recentDate:
                recentDate = qc['createDate'];
    return [ list(runs), recentDate ]

'''
Returns the recent projects from the Seq Analysis LIMS table
'''
@app.route('/getSeqAnalysisProjects', methods=['GET'])
@navbarForm
def getSeqAnalysisProjects():
    cache_key = "seq-analysis-projects"
    content = get_cached_data(cache_key)
    if not content:
        seq_analysis_projects_url = LIMS_API_ROOT + "/LimsRest/getRecentDeliveries"
        app.logger.info("Sending request to %s" % seq_analysis_projects_url)
        resp = s.get(seq_analysis_projects_url, auth=(USER, PASSW), verify=False) # , timeout=10)
        content = resp.content
        cache_data(cache_key, content, CACHE_TIME_SHORT)
    projects = json.loads(content)

    # Logging
    request_names = map(lambda p: p['requestId'], projects)
    app.logger.info("Received %d projects: %s" % (len(projects), str(list(request_names))))

    projectsToReview = []
    projectsToSequenceFurther = []
    for project in projects:
        projectReady = isProjectReady(project)
        project['ready'] = projectReady
        [ runs, recentDate ] = getRecentDateAndRuns(project)

        project['run'] = ', '.join(runs)
        project['ordering'] = recentDate
        project['date'] = time.strftime('%Y-%m-%d %H:%M', time.localtime((recentDate/1000)))

        if isUnreviewed(project):
            projectsToReview.append(project)
        else:
            projectsToSequenceFurther.append(project)


    projectsToReview.sort(key=itemgetter('ordering'))
    projectsToSequenceFurther.sort(key=itemgetter('ordering'))

    data = {
        'projectsToReview': projectsToReview,
        'projectsToSequenceFurther': projectsToSequenceFurther
    }
    return create_resp(True, 'success', data)

'''
Returns the recent projects from the Request table
'''
@app.route('/getRequestProjects', methods=['GET'])
@navbarForm
def getRequestProjects():
    cache_key = "request-projects"
    content = get_cached_data(cache_key)
    if not content:
        req_projects_url = LIMS_API_ROOT + "/LimsRest/getRecentDeliveries?time=2&units=d"
        app.logger.info("Sending request to %s" % req_projects_url)
        resp = s.get(req_projects_url, auth=(USER, PASSW), verify=False) # , timeout=10)
        content = resp.content
        cache_data(cache_key, content, CACHE_TIME_SHORT)
    projects = json.loads(content)

    # Logging
    request_names = map(lambda p: p['requestId'], projects)
    app.logger.info("Received %d projects: %s" % (len(projects), str(list(request_names))))

    for project in projects:
        [ignore, recentDate] = getRecentDateAndRuns(project)
        project['ordering'] = recentDate
        project['date'] = time.strftime('%Y-%m-%d %H:%M', time.localtime((recentDate/1000)))
    projects.sort(key=itemgetter('ordering'))

    data = {
        'recentDeliveries': projects
    }
    return create_resp(True, 'success', data)

'''
Rerender the index when the projects page is reloaded.
This should allow react to reload the projects page from the homepage.
Occurs when user loads the projects page directly, e.g. refreshes page on /projects/<pId>
'''
@app.route('/projects/<pId>', methods=['GET', 'POST'])
@navbarForm
def projects_tmp(pId):
    print("Reloading page for project %s" % pId)
    return index()

@app.route('/getRecentRuns', methods=['GET', 'POST'])
@navbarForm
def get_recent_runs():
    dir_path = FASTQ_PATH
    dir_data = glob.glob(dir_path + "*.html")
    dir_data.sort(key=os.path.getmtime, reverse=True)

    app.logger.info("Found %d runs at %s" % (len(dir_data), dir_path))

    # Add Recent Runs data for links to HTML files
    datenow = datetime.datetime.now()
    latest_age = 7
    app.logger.info("Returning files last modified less than %d days ago" % latest_age)
    run_data = []
    for eachfile in dir_data:
        mtime = datetime.datetime.fromtimestamp(os.path.getmtime(eachfile))
        last_modified = (datenow - mtime).days
        app.logger.info("File: %s. Modified %s days ago" % (eachfile, str(last_modified)))
        if last_modified < latest_age:
            project = {}
            mod_timestamp = mtime.strftime("%Y-%m-%d %H:%M")
            project['date'] = mod_timestamp
            head, tail = os.path.split(eachfile)
            project['path'] = "static/html/FASTQ/" + tail
            project['runName'] = tail
            project['runStats'] = "getInterOpsData?runId=" + tail
            run_data.append(project)

    data = { 'recentRuns': run_data }
    return create_resp(True, 'success', data)

# TODO - Remove method once '/projectInfo/<pId>' is stable
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
    if 'RNA' in pType['recipe'] or 'SMARTerAmpSeq' in pType['recipe'] or '96Well_SmartSeq2' in pType['recipe']:
        pType['table'] = 'rna'
    elif 'baitSet' in samples[0]['qc']:
        pType['table'] = 'hs'
        pType['baitSet'] = samples[0]['qc']['baitSet']
    elif 'WholeGenome' in pType['recipe']:
        pType['table'] = 'wgs'
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
            if l[-1].lower() == 'tree.pdf' or l[-1].lower() == "heatmap.pdf" or l[-1].lower() == "treemap.pdf":
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

# TODO - remove later
#route to post the qc status
@app.route('/post_<pId>_<recordId>_<qcStatus>')
def post_qcStatus(pId, recordId, qcStatus):
    payload = {'record': recordId, 'status': qcStatus}
    url = LIMS_API_ROOT  + "/LimsRest/setQcStatus"
    r = s.post(url, params=payload,  auth=(USER, PASSW), verify=False)
    return make_response(r.text, 200, None)

"""
Modifies Sample QC Status.
Side Effects:
    1) If request is for "repool" of recipe: "HemePact"/"Impact", then also submit request to repool Sample
"""
@app.route('/changeRunStatus')
def change_run_status():
    recordIds_arg = request.args.get(API_RECORD_ID)
    project = request.args.get(API_PROJECT)
    qc_status = request.args.get(API_QC_STATUS)
    recipe = request.args.get(API_RECIPE)
    recordIds = recordIds_arg.split(',')

    successful_requests = {}
    failed_requests = {}
    for id in recordIds:
        id_status_fail = []
        id_status_success = []

        # Repool requests must also modify the samples table
        if(should_repool_sample(recipe, qc_status)):
            repool_success = request_repool(id, recipe, qc_status)
            if repool_success:
                # TODO - Make these constants
                id_status_success.append(LIMS_TASK_REPOOL)
            else:
                id_status_fail.append(LIMS_TASK_REPOOL)

        qc_status_change_success = request_qc_status_change(id, qc_status, project, recipe)
        if qc_status_change_success:
            id_status_success.append(LIMS_TASK_SET_QC_STATUS)
        else:
            id_status_fail.append(LIMS_TASK_SET_QC_STATUS)

        if len(id_status_fail) > 0:
            failed_requests[id] = id_status_fail
        if len(id_status_success) > 0:
            successful_requests[id] = id_status_success

    success = len(failed_requests) == 0
    status = ('Set QC Status' if success else "See 'failedRequests'")

    # TODO - Make status more descriptive about successful/failed requests
    data = {
        'successfulRequests': successful_requests,
        'failedRequests': failed_requests,
        'status': status,
        'success': success
    }
    return create_resp(success, status, data)

def should_repool_sample(recipe, status):
    recipe_lc = recipe.lower()
    return (RECIPE_HEMEPACT in recipe_lc or RECIPE_IMPACT in recipe_lc) and status == 'Repool-Sample'

def request_qc_status_change(id, qc_status, project, recipe):
    set_qc_payload = { 'record': id, 'status': qc_status, 'project': project, 'recipe': recipe }
    set_qc_url = LIMS_API_ROOT  + "/LimsRest/setQcStatus"

    resp = s.post(set_qc_url, params=set_qc_payload,  auth=(USER, PASSW), verify=False)
    return 'NewStatus' in resp.text and resp.status_code == 200

def request_repool(id, recipe, qc_status):
    app.logger.info("Sending repool request for recipe: %s and status: %s" % (recipe, qc_status))

    set_pooled_url = LIMS_API_ROOT  + "/LimsRest/setPooledSampleStatus"
    # Status should be that expected by LIMS for SAMPLES, not the QC site
    set_pooled_payload = {'record': id, 'status': "Ready for - Pooling of Sample Libraries for Sequencing"}
    set_pooled_resp = s.post(set_pooled_url, params=set_pooled_payload,  auth=(USER, PASSW), verify=False)
    app.logger.info(set_pooled_resp.content)

    return set_pooled_resp.status_code == 200

#route to post all the qc status
@app.route('/postall_<pId>_<qcStatus>')
def postall_qcStatus(qcStatus, pId):
    recordIds = request.args.getlist('recordIds')
    for recordId in recordIds:
        payload = {'record': recordId, 'status': qcStatus}
        url = LIMS_API_ROOT  + "/LimsRest/setQcStatus"
        r = s.post(url, params=payload,  auth=(USER, PASSW), verify=False)
    return make_response(r.text, 200, None)


#@deprecation.deprecated(details="This method is deprecated on 06-01-2019 and there are no other methods replacing this method.")
@app.route('/add_note', methods=['POST'])
def add_note():
    """
    This method is deprecated on 06-01-2019 and there are no other methods replacing this method.

    """

    payload = {'request' : request.form['request'], 'user' : 'qc_review', 'igoUser' : 'gabow', 'readMe' : request.form['readMe']}
    url = LIMS_API_ROOT + "/LimsRest/limsRequest"
    r =  s.post(url, params=payload,  auth=(USER, PASSW), verify=False)
    return redirect(url_for('index'))

# TODO - projectInfo and this endpoint both make a call to 'getProjectQc'
@app.route('/getProjectQc/<pId>', methods=['GET'])
def project_qc(pId):
    if pId == 'undefined' or not is_project_id_valid(pId):
        return create_resp(False, 'Invalid pId', {})

    get_project_qc_resp = s.get(LIMS_API_ROOT + "/LimsRest/getProjectQc?project="+pId, auth=(USER, PASSW), verify=False)
    try:
        get_project_qc = json.loads(get_project_qc_resp.content)
    except TypeError:
        return create_resp(False, 'Error requesting from LIMS', None)
    if len(get_project_qc) == 0:
        return create_resp(False, 'No project data', None)

    project_qc_info = get_project_qc[0]
    return create_resp(True, 'success', project_qc_info)

@app.route('/projectInfo/<pId>', methods=['GET'])
def project_info(pId):
    if not is_project_id_valid(pId):
        return create_resp(False, 'Invalid pId', {})

    # TODO - Cache this response
    # TODO - DELETE
    # qc_status_label_resp = s.get(LIMS_API_ROOT + "/getPickListValues?list=Sequencing+QC+Status", auth=(USER, PASSW), verify=False)
    # get_project_qc_resp = s.get(LIMS_API_ROOT + "/getProjectQc?project="+pId, auth=(USER, PASSW), verify=False)

    # get_project_qc_resp = ProjectQc.resp
    # qc_status_label_resp = GetPickListValue.resp
    # TODO - ADD
    qc_status_label_resp = s.get(LIMS_API_ROOT + "/LimsRest/getPickListValues?list=Sequencing+QC+Status", auth=(USER, PASSW), verify=False)
    get_project_qc_resp = s.get(LIMS_API_ROOT + "/LimsRest/getProjectQc?project="+pId, auth=(USER, PASSW), verify=False)

    try:
        qc_status_label = json.loads(qc_status_label_resp.content)
        get_project_qc = json.loads(get_project_qc_resp.content)
    except TypeError:
        return create_resp(False, 'Error requesting from LIMS', None)
    if len(get_project_qc) == 0:
        return create_resp(False, 'No project data', None)

    project_qc_info = get_project_qc[0]
    samples = project_qc_info['samples']

    if project_qc_info['samples'] == [] or project_qc_info['requestId'] == "ERROR":
        return create_resp(False, 'No project data', None)

    requester = get_requester_info(project_qc_info, samples)
    statuses = get_statuses(qc_status_label, samples)
    record_ids = get_record_ids(samples)
    charts_links = get_charts_links(project_qc_info)

    enriched_samples = enrich_samples(samples)
    project_type = get_project_type(enriched_samples)
    grid = get_grid(enriched_samples, project_type)

    data = {
        'requester': requester,
        'statuses': statuses,
        'recordIds': record_ids,
        'grid': grid,
        'chartsLinks': charts_links,
        'projectType': project_type,
        'columnOrder': getColumnOrder(project_type['table'])
    }

    return create_resp(True, 'success', data)

@app.route('/submitFeedback', methods=['POST'])
def submit_feedback():
    msg = EmailMessage()
    app.logger.info(request)
    msg.set_content(request.json['body'])

    to = "streidd@mskcc.org"
    frm = "streidd@mskcc.org"
    msg['From'] = frm
    msg['To'] = to

    feedback_type = request.json['type']
    app.logger.info("Sending %s feedback to %s" % (feedback_type, to))

    subject = "[RUN-QC:BUG] " if feedback_type == 'bug' else "[RUN-QC:FEATURE REQUEST] "
    subject += request.json["subject"]
    msg['Subject'] = subject

    s = smtplib.SMTP('localhost')
    s.send_message(msg)
    s.quit()

    return create_resp(True, 'success', {})

def getColumnOrder(type):
    if type in headers.order:
        app.logger.info("Returning column order for %s" % type)
        return headers.order[type]
    app.logger.error("No column order set for %s. Returning empty list" % type)
    return headers.order['default']

def get_requester_info(project_qc_info, samples):
    common_sample = samples[0]

    requester = {}
    value_labels = ['requestId', 'investigator',  'pi', 'projectManager', 'cmoProject']
    for label in value_labels:
        if label in project_qc_info:
            requester[label] = project_qc_info[label]
        else:
            requester[label] = 'N/A'

    boolean_labels = [ 'pipelinable', 'analysisRequested' ]
    for label in boolean_labels:
        if label in project_qc_info:
            requester[label] = project_qc_info[label]
        else:
            requester[label] = False

    # Requested Number of reads must be present and parseable as a float

    if 'requestedNumberOfReads' in common_sample and isinstance(common_sample['requestedNumberOfReads'], float):
        requester['requestedNumberOfReads'] = float(common_sample['requestedNumberOfReads'])
    else:
        requester['requestedNumberOfReads'] = 'N/A'

    # SET TUMOR & NORMAL COUNT ON REQUESTER
    sample_names = set()
    tumor_count = 0
    normal_count = 0
    for sample in samples:
        sample_qc = sample['qc']
        name = sample_qc['sampleName']
        if name not in sample_names:
            sample_names.add(name)
            if sample['tumorOrNormal'] == 'Tumor':
                tumor_count += 1
            elif sample['tumorOrNormal'] == 'Normal':
                normal_count += 1

    requester['tumorCount'] = tumor_count
    requester['normalCount'] = normal_count

    if 'sampleNumber' in project_qc_info:
        requester['numSamples'] = project_qc_info['sampleNumber']
    else:
        requester['numSamples'] = len(sample_names)

    return requester

def get_statuses(qc_status_label, samples):
    status_dic = {}
    label_set = set()
    for i in qc_status_label:
        status_dic[i] = 0
    for sample in samples:
        if not sample['qc']['recordId'] in label_set:
            if 'qcStatus' in sample['qc']:
                status_dic[sample['qc']['qcStatus']] += 1
            label_set.add(sample['qc']['recordId'])

    return status_dic

def get_record_ids(samples):
    record_ids = []
    for sample in samples:
        record_ids.append(sample['qc']['recordId'])
    return record_ids

def get_project_type(samples):
    common_sample = samples[0]  # First sample of the project should contain common fields
    project_recipe = common_sample['recipe']
    project_qc = common_sample['qc']
    project_type = {
        'recipe': project_recipe,
        'startable': any('startingAmount' in sample['qc'] for sample in samples),
        'quanted': any('quantIt' in sample['qc'] for sample in samples),
        'qcControlled': any('qcControl' in sample['qc'] for sample in samples)
    }
    if 'runType' in common_sample:
        project_type['runType'] = common_sample['runType']
    if 'RNA' in project_recipe or \
            'SMARTerAmpSeq' in project_recipe or \
            '96Well_SmartSeq2' in project_recipe:
        project_type['table'] = 'rna'
    elif 'baitSet' in project_qc:
        project_type['table'] = 'hs'
        project_type['baitSet'] = project_qc['baitSet']
    elif 'HumanWholeGenome' in project_recipe:
        project_type['table'] = 'wgs'
    else:
        project_type['table'] = 'md'

    return project_type

def get_header(project_type):
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
    wgs_header = ["Run", "Sample", "IGO Id", "Genome", "Tumor or Normal",
                  "Concentr.  (nM)", "Final Library Yield (fmol)", "Coverage Target", "Requested Reads (Millions)", "Sum MTC", "Initial Pool",
                  "QC Status", "MEAN_COVERAGE", "Pct. Duplic.", "Pct. Adapters", "Reads Examined", "Unpaired Reads", "Sum Reads","Unmapped",
                  "PCT_EXC_MAPQ", "PCT_EXC_DUPE", "PCT_EXC_BASEQ", "PCT_EXC_TOTAL", "PCT_10X", "PCT_30X", "PCT_40X", "PCT_80X", "PCT_100X"]

    if project_type['table'] == 'hs':
        header = hs_header
    elif project_type['table'] == 'rna':
        header = rna_header
    elif project_type['table'] == 'wgs':
        header = wgs_header

    genome_index = header.index("Genome")
    if "startable" in project_type and project_type["startable"]:
        header.insert(genome_index + 1, "Starting Amount")
    if "qcControlled" in project_type and project_type["qcControlled"]:
        header.insert(genome_index + 1, "Library Quality Control")
    if "quanted" in project_type and project_type["quanted"]:
        header.insert(genome_index + 1, "Quant-it")

    return header

def get_sample_value(sample, field, formatter):
    val = "NOT AVAILABLE"
    if field in sample:
        val = sample[field]
        if formatter:
            val = formatter(val)
    return val

def get_grid(samples, project_type):
    header = get_header(project_type)

    grid = Grid.Grid()
    grid.set_header(header)
    grid.assign_value_types()
    row = 0

    # Samples will not have these values, e.g. 'coverageTarget' if not in the database
    # TODO - Have a check on fields

    common_sample = samples[0]
    if 'coverageTarget' not in common_sample:
        return {
            'header': grid.get_header(),
            'val_types': grid.get_val_types(),
            'grid': grid.get_grid(),
            'style': grid.get_style()
        }

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
        # TODO: coverageTarget seems dependent on pending data
        if "coverageTarget" in sample:
            cov_target = "" if sample['coverageTarget'] == 0 else sample['coverageTarget']  # hack; coverage target is set to 0 in LIMS by default at pull, will display as empty string on site
            grid.set_value("Coverage Target", row, format_int(cov_target))
        else:
            # TODO - provide an alert about fields
            grid.set_value("Coverage Target", row, "NOT AVAILABLE")
        requestedNumReads = get_sample_value(sample, 'requestedNumberOfReads', format_int)
        grid.set_value("Requested Reads (Millions)", row, requestedNumReads)
        grid.set_value("Pct. Adapters", row, qc['percentAdapters'] * 100) #
        grid.set_value("Reads Examined", row, format_int(qc['readsExamined']))
        grid.set_value("Unpaired Reads", row, format_int(qc['unpairedReadsExamined']))
        grid.set_value("Initial Pool", row, "")
        if "initialPool" in sample:
            grid.set_value("Initial Pool", row, sample["initialPool"])
        grid.set_value("Unmapped", row, format_int(qc['unmapped']))
        grid.set_value("Pct. Duplic.", row, format_fp(qc['percentDuplication'] * 100)) #
        if project_type["startable"]:
            grid.set_value("Starting Amount", row, qc["startingAmount"])
        if project_type["qcControlled"]:
            grid.set_value("Library Quality Control", row, "{:,.2f}".format(qc["qcControl"]) + " " +  str(qc["qcUnits"]))
        if project_type["quanted"]:
            grid.set_value("Quant-it", row, "{:,.2f}".format(qc["quantIt"]) + " " +  qc["quantUnits"])
        grid.set_value("Sum Reads", row, format_int(sample["sumReads"]))
        if project_type['table'] != 'hs' and 'requestedNumberOfReads' in sample:
            try:
                if sample['sumReads'] <= float(sample['requestedNumberOfReads']):
                    grid.set_style("Sum Reads", row, "highlight")
            except ValueError:
                grid.set_style("Sum Reads", row, None)
        if project_type['table'] == 'rna':
            grid.set_value("Pct. Ribos.", row, format_fp(qc['percentRibosomalBases'] * 100))
            grid.set_value("Pct. Coding", row, format_fp(qc['percentCodingBases'] * 100))
            grid.set_value("Pct. Utr", row, format_fp(qc['percentUtrBases'] * 100))
            grid.set_value("Pct. Intron.", row, format_fp(qc['percentIntronicBases'] * 100))
            grid.set_value("Pct. Intergenic", row, format_fp(qc['percentIntergenicBases'] * 100))
            grid.set_value("Pct. Mrna", row, format_fp(qc['percentMrnaBases'] * 100))
        if project_type['table'] == 'wgs':
            grid.set_value("MEAN_COVERAGE", row, format_int(qc["mean_COVERAGE"]))
            grid.set_value("PCT_EXC_MAPQ", row, format_fp(qc['pct_EXC_MAPQ'] * 100))
            grid.set_value("PCT_EXC_DUPE", row, format_fp(qc['pct_EXC_DUPE'] * 100))
            grid.set_value("PCT_EXC_BASEQ", row, format_fp(qc['pct_EXC_BASEQ'] * 100))
            grid.set_value("PCT_EXC_TOTAL", row, format_fp(qc['pct_EXC_TOTAL'] * 100))
            grid.set_value("PCT_10X", row, format_fp(qc['percentTarget10x'] * 100))
            grid.set_value("PCT_30X", row, format_fp(qc['percentTarget30x'] * 100))
            grid.set_value("PCT_40X", row, format_fp(qc['percentTarget40x'] * 100))
            grid.set_value("PCT_80X", row, format_fp(qc['percentTarget80x'] * 100))
            grid.set_value("PCT_100X", row, format_fp(qc['percentTarget100x'] * 100))
        if project_type['table'] == 'hs':
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

    return {
        'header': grid.get_header(),
        'val_types': grid.get_val_types(),
        'grid': grid.get_grid(),
        'style': grid.get_style()
    }

def get_charts_links(project_qc_info):
    charts_links = {}
    project_indexes = os.listdir(APP_STATIC + "/html/PDF") #os.listdir ( os.path.join("", "html/PDF") )
    for project_index in project_indexes:
        l = project_index.split('_')
        if re.match("^[A-Z]+$", l[-2]):
            image_req = l[-3].replace("P", "") + "_" + l[-2]
        else:
            image_req = l[-2].replace("P", "")
        if image_req  == project_qc_info['requestId']:
            if l[-1].lower() == 'tree.pdf' or l[-1].lower() == "heatmap.pdf" or l[-1].lower() == "treemap.pdf":
                charts_links[l[0] + '_'  + l[1] + '_' + l[-1].lower()]  = 'html/PDF/' + project_index
            elif l[-1].lower() == 'pie.pdf':
                charts_links[l[0] + '_' + l[1] + '_pie.pdf'] = 'html/PDF/' + project_index

    return charts_links


def enrich_samples(samples):
    sumReadDict = defaultdict(int)
    for sample in samples:
        if sample['qc']['qcStatus'] != "Failed" and sample['qc']['qcStatus'] != "Failed-Reprocess":
            if sample['qc']['readsExamined']>0:
                sumReadDict[sample['cmoId']] += sample['qc']['readsExamined']
            else:
                sumReadDict[sample['cmoId']] += sample['qc']['unpairedReadsExamined']

    #compute the sum of the 'meanTargetCoverage' by 'sampleName'
    sumMtcDict = defaultdict(float)
    for sample in samples:
        if sample['qc']['qcStatus'] != "Failed" and sample['qc']['qcStatus'] != "Failed-Reprocess":
            sumMtcDict[sample['cmoId']] += sample['qc']['meanTargetCoverage']
    for sample in samples:
        sample['sumMtc'] = sumMtcDict[sample['cmoId']]
        sample['sumReads'] = sumReadDict[sample['cmoId']]

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
        if 'quantIt' not in sample['qc']:
            sample['qc']['quantIt'] = 0.0
            sample['qc']['quantUnits'] = "NA"
        if 'qcControl' not in sample['qc']:
            sample['qc']['qcControl'] = 0.0
            sample['qc']['qcUnits'] = 0.0
        if 'startingAmount' not in sample['qc']:
            sample['qc']['startingAmount'] = 0.0

    return samples

def create_resp(success, status, data):
    resp = { 'success': success }
    if status:
        resp['status'] = status
    if data:
        resp['data'] = data
    return jsonify(resp)

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
          newStatus = 'btn-danger disabled'
       elif qcStatus == 'Passed' or qcStatus == 'IGO-Complete':
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


def get_flowcell_id(run_name):
    '''
    Method to extract FlowCell Ids from the run names using regex. If the regex does not match any pattern
    for flowcell ID in the run name, then the Run ID is returned.
    :param run_name:
    :return:
    '''
    hiseq_pattern = (r'([A-Z,0-9,A-Z]{10,10})')
    miseq_pattern = (r'-([A-Z\dA-Z]{5,5})')

    if len(run_name.split("-")) > 1:
        if len(re.findall(miseq_pattern, run_name)) == 1:
            return re.findall(miseq_pattern, run_name)[0]
    elif len(run_name.split("-")) <= 1:
        if len(re.findall(hiseq_pattern, run_name)) == 1:
            return re.findall(hiseq_pattern, run_name)[0]
    else:
        run_values = run_name.split('_')
        run_id = run_values[0] + "_" + run_values[1] + "_" + run_values[2]
        return run_id


@app.route("/getInterOpsData")
def get_interops_data():
    """
    Function that takes the run ID from request parameters and calls LimsRest backend to get related
    InterOps data from LIMS database.
    :return: run_summary.html web-page with InterOps data displayed in a table.
    """
    print(request.args.get("runId"))
    runName = get_flowcell_id(request.args.get("runId"))
    cache_key = "interOps-%s" % runName
    run_summary = get_cached_data(cache_key)
    if run_summary:
        if(len(run_summary) > 0):
            # Only cache if data is returned, otherwise there may be a LimsRest issue
            cache_data(cache_key, run_summary, CACHE_TIME_LONG)
        return render_template('run_summary.html', run_summary=json.loads(run_summary))

    interops_data_url = LIMS_API_ROOT + "/LimsRest/getInterOpsData?runId="+runName
    app.logger.info("Sending %s" % interops_data_url)
    r = s.get(interops_data_url, auth=(USER, PASSW), verify=False)
    run_summary = r.content
    return render_template('run_summary.html', run_summary=json.loads(run_summary))

def get_cached_data(key):
    if uwsgi.cache_exists(key, CACHE_NAME):
        data = uwsgi.cache_get(key, CACHE_NAME)
        app.logger.info("Using cached data for %s" % key)
        return data
    app.logger.info("No data cached for %s" % key)
    return None

def cache_data(key, content, time):
    app.logger.info("Caching %s for %d seconds" % (key, time))
    uwsgi.cache_set(key, content, time, CACHE_NAME)

if __name__ == '__main__':
    app.run()
