# Version 1.0

import sys
import uwsgi, pickle
from flask import Flask, render_template, url_for, request, redirect, make_response, jsonify, flash, session
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

# Configurations
sys.path.insert(0, os.path.abspath("config"))
config = os.path.join(os.path.dirname(os.path.realpath(__file__)), "lims_user_config")
config_options = yaml.load(open(config, "r"))

# Constants
from .constants import LIMS_TASK_REPOOL, LIMS_TASK_SET_QC_STATUS, API_RECORD_ID, API_PROJECT, API_QC_STATUS, API_RECIPE, RECIPE_IMPACT, RECIPE_HEMEPACT, RECIPE_MSK_ACCESS, USER_ID, CACHE_PROJECT_PREFIX, CACHE_PICKLIST
from .settings import FASTQ_PATH, URL_PREFIX, STATIC_FOLDER, TEMPLATE_FOLDER

# Configure app
app = Flask(__name__, static_folder=os.path.abspath(STATIC_FOLDER), template_folder=os.path.abspath(TEMPLATE_FOLDER))
app.config['PROPAGATE_EXCEPTIONS'] = True
app.config['SECRET_KEY'] = config_options['secret_key']

# Wrappers
cors = CORS(app, resources={r"/saveConfig": {"origins": "*"}, r"/authenticate": {"origins": "*"}, r"/getRecentRuns": {"origins": "*"}, r"/getRequestProjects": {"origins": "*"}, r"/changeRunStatus": {"origins": "*"}, r"/getSeqAnalysisProjects": {"origins": "*"}, r"/projectInfo/*": {"origins": "*"}, r"/getFeedback": {"origins": "*"}, r"/submitFeedback": {"origins": "*"}})

# Models
from mongoengine import connect
connect('run_qc', connect=False) # Defers background connections until 1st db operation is attempted, Avoids pymongo.errors.ServerSelectionTimeoutError

# Modules
sys.path.insert(0, os.path.abspath("app"))
import project
import config_manager
from utils import create_resp

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
@app.before_request
def before_request():
    session.permanent = True
    app.permanent_session_lifetime = datetime.timedelta(minutes=15)     # TODO - Find way to refresh (forces login)
@login_manager.user_loader
def load_user(user_id):
    return current_user
@app.route('/login')
def login():
    return render_template('login.html', URL_PREFIX=URL_PREFIX)
@app.route('/authenticate', methods=['POST'])
def authenticate():
    username = ''
    try:
        username = request.form.get("username")
        password = request.form.get("password")
        if username == None or password == None:
            flash('Missing username or password. Please try again.')
            return render_template('login.html', URL_PREFIX=URL_PREFIX)
    except:
        flash('Missing username or password. Please try again.')
        return render_template('login.html', URL_PREFIX=URL_PREFIX)
    try:
        result = ldap_authenticate(username, password)
    except ldap.INVALID_CREDENTIALS:
        return create_resp(False, 'Please check your login details and try again.', {})
    if is_authorized(result):
        app.logger.info('Successful Authentication: %s' % username)
        login_user(User(username))
        current_user = User(username)
        session[USER_ID] = username     # Place user_id in the session so we can extract it later
        return redirect(url_for('index'))
    else:
        flash('Missing username or password. Please try again.')
        return redirect(url_for('login.html', URL_PREFIX=URL_PREFIX))

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

@app.route('/', methods=['GET', 'POST'])
@navbarForm
@login_required
def index():
    return render_template('index.html', **locals())

@app.route('/static/<path:path>', methods=['GET', 'POST'])
def route_static(path):
    if path != "" and os.path.exists(app.static_folder + path):
        return send_from_directory(app.static_folder, path)
    app.logger.error('Could not find asset: %s' % path)
    return render_template('404.html', **locals())

# This function validates the shape of the project ID
def is_project_id_valid(project_id):
    """Validate the project_id using a regex."""
    if not re.match("^[a-zA-Z0-9_]+$", project_id):
        return False
    return True

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

    days = request.args.get('days')
    try:
        latest_age = 7 if (days == None) else int(days)
    except ValueError:
        app.logger.error('Could not parse date range from value: ' +  days)
        latest_age = 7
    app.logger.info("Returning files last modified less than %d days ago" % latest_age)

    # Add Recent Runs data for links to HTML files
    datenow = datetime.datetime.now()
    run_data = []
    for eachfile in dir_data:
        mtime = datetime.datetime.fromtimestamp(os.path.getmtime(eachfile))
        last_modified = (datenow - mtime).days
        # logger.info("File: %s. Modified %s days ago" % (eachfile, str(last_modified)))
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

#route for display the JSON
@app.route('/JSON_<pId>')
def displayJSON(pId):
    r = s.get(LIMS_API_ROOT + "/LimsRest/getProjectQc?project="+pId,  auth=(USER, PASSW), verify=False)
    data = json.loads(r.content)
    return render_template('json.html', **locals())

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

        qc_status_change_success = request_qc_status_change(id, qc_status, project, recipe)
        if qc_status_change_success:
            id_status_success.append(LIMS_TASK_SET_QC_STATUS)
        else:
            id_status_fail.append(LIMS_TASK_SET_QC_STATUS)

        if len(id_status_fail) > 0:
            failed_requests[id] = id_status_fail
        if len(id_status_success) > 0:
            successful_requests[id] = id_status_success

    # Update the cache for this project to reflect the new run status
    project_key = '%s%s' % (CACHE_PROJECT_PREFIX, project)
    get_project_qc_url = LIMS_API_ROOT + "/LimsRest/getProjectQc?project="+project
    get_and_cache_project_info(get_project_qc_url, project_key)

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
    # Any custom capture/pooled capture
    recipe_lc = recipe.lower()
    return (RECIPE_HEMEPACT in recipe_lc or RECIPE_IMPACT in recipe_lc or RECIPE_MSK_ACCESS in recipe_lc) and status == 'Repool-Sample'

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

def get_and_cache_project_info(url, key):
    app.logger.info('Submitting request to %s' % url)
    resp = s.get(url, auth=(USER, PASSW), verify=False)
    content = resp.content

    try:
        data = json.loads(content)
    except TypeError:
        app.logger.error("Failure converting service response")
        return {}

    entry = data[0]
    samples = [] if 'samples' not in entry else entry['samples']
    num_samples = len(samples)

    if num_samples > 200:
        # TODO - large requests will be cached for a long time
        cache_data(key, content, CACHE_TIME_LONG)
    else:
        cache_data(key, content, CACHE_TIME_SHORT)

    return content

@app.route('/projectInfo/<pId>', methods=['GET'])
def project_info(pId):
    if not is_project_id_valid(pId):
        return create_resp(False, 'Invalid pId', {})

    # TODO - project_prefix constant
    project_key = '%s%s' % (CACHE_PROJECT_PREFIX, pId)
    get_project_qc_resp = get_cached_data(project_key)
    if not get_project_qc_resp:
        get_project_qc_url = LIMS_API_ROOT + "/LimsRest/getProjectQc?project="+pId
        get_project_qc_resp = get_and_cache_project_info(get_project_qc_url, project_key)

    # TODO - picklist constant
    qc_status_label_content = get_cached_data(CACHE_PICKLIST)
    if not qc_status_label_content:
        qc_status_label_url = LIMS_API_ROOT + "/LimsRest/getPickListValues?list=Sequencing+QC+Status"
        app.logger.info('Submitting request to %s' % qc_status_label_url)
        qc_status_label_resp = s.get(qc_status_label_url, auth=(USER, PASSW), verify=False)
        qc_status_label_content = qc_status_label_resp.content
        cache_data(CACHE_PICKLIST, qc_status_label_content, CACHE_TIME_LONG)

    try:
        get_project_qc = json.loads(get_project_qc_resp)
        qc_status_label = json.loads(qc_status_label_content)
    except TypeError:
        return create_resp(False, 'Error requesting from LIMS', None)

    if len(get_project_qc) == 0:
        return create_resp(False, 'No project data', None)

    if get_project_qc[0]['samples'] == [] or get_project_qc[0]['requestId'] == "ERROR":
        return create_resp(False, 'No project data', None)

    data = project.get_project_info(pId, qc_status_label, get_project_qc)

    return create_resp(True, 'success', data)

@app.route('/getFeedback', methods=['GET'])
def get_feedback():
    f=open("feedback.txt", "r")
    contents = f.read()
    lines = contents.split('\n')

    feedback = { '1': [], '0': [] }
    for l in lines:
        vals = l.split(',')
        if(len(vals)!=3):
            continue
        type = vals[0]
        text = vals[1]
        status = str(vals[2])

        # TODO - improve status checking
        if status not in feedback:
            continue

        feedback[status].append([type, text])

    return create_resp(True, 'success', { 'feedback': feedback })

@app.route('/submitFeedback', methods=['POST'])
def submit_feedback():
    msg = EmailMessage()

    to = "streidd@mskcc.org"
    frm = "streidd@mskcc.org"
    msg['From'] = frm
    msg['To'] = to

    feedback_type = request.json['type']
    app.logger.info("Sending %s feedback to %s" % (feedback_type, to))

    subject = "[RUN-QC:BUG] " if feedback_type == 'bug' else "[RUN-QC:FEATURE REQUEST] "
    subject += request.json["subject"]
    msg['Subject'] = subject

    # Write Feedback
    f = open("./feedback.txt", "a")
    f.write("%s,%s,%d\n" % (feedback_type, request.json["subject"], 0))
    f.close()

    # Read Feedback
    f = open("./feedback.txt", "r")
    currentFeedback = f.read()
    f.close()

    content = "%s\nCURRENT FEEDBACK\n%s" % (request.json['body'], currentFeedback)
    msg.set_content(content)

    s = smtplib.SMTP('localhost')
    s.send_message(msg)
    s.quit()

    return create_resp(True, 'success', {})

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
    # TODO - Do a json-dumps so that any data-type can be cached
    if uwsgi.cache_exists(key, CACHE_NAME):
        data = uwsgi.cache_get(key, CACHE_NAME)
        app.logger.info("Using cached data for %s" % key)
        return data
    app.logger.info("No data cached for %s" % key)
    return None

def cache_data(key, content, time):
    app.logger.info("Caching %s for %d seconds" % (key, time))
    uwsgi.cache_update(key, content, time, CACHE_NAME)

if __name__ == '__main__':
    app.run()
