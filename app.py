# Version 1.0

from flask import Flask, render_template, url_for, request, redirect
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
    #stoop = """[{"samples":[{"cmoId":"DS-fastcf-020-N","userId":"DS_FastCF020_BCN01","project":"07037_T","recipe":"WholeExomeSequencing","basicQcs":[{"run":"PITT_0129_BHJHCGBBXX","sampleName":"DS-fastcf-020-N","qcStatus":"Required-Additional-Reads","restStatus":"SUCCESS","totalReads":13159582,"createDate":1497961043213,"reviewedDates":[{"timestamp":1498059710204,"event":"Required-Additional-Reads"}]}],"requestId":"06573_E","requestType":"IMPACT468","investigator":"Britta Weigelt","pi":"Jorge Reis-Filho","projectManager":"Bourque, Caitlin","analysisRequested":true,"recordId":0,"sampleNumber":16,"restStatus":"SUCCESS","autorunnable":false,"deliveryDate":[]}]"""
    #uwsgi.cache_set("delivered", pickle.dumps(stoop), 3600, "igoqc")
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

    #test if the requested project exist in the LIMS else display 404.html
    if data[0]['samples'] == []:
        return redirect( url_for('page_not_found', pId=data[0]['requestId'], code_error=3) )

    if data[0]['requestId'] == "ERROR":
        return redirect( url_for('page_not_found', pId=data[0]['requestId'], code_error=3) )


    #compute the sum of the 'readDuped' by 'sampleName'
    sumReadDict = defaultdict(int) 
    l = {}
    for sample in samples:
        if sample['qc']['readsExamined']>0:
            sumReadDict[sample['cmoId']] += sample['qc']['readsExamined']
        else:
            sumReadDict[sample['cmoId']] += sample['qc']['unpairedReadsExamined']

    #for sample in samples:
    #    if not sample['qc']['sampleName'] in l:
    #        sample['qc']['sumReads'] = sumDict[sample['qc']['sampleName']]
    #    #else:
    #    #    sample['qc']['sumReads'] = null
    #    l[sample['qc']['sampleName']] = 1

    #compute the sum of the 'meanTargetCoverage' by 'sampleName'
    l = {}
    sumMtcDict = defaultdict(float)
    for sample in samples:
        sumMtcDict[sample['cmoId']] += sample['qc']['meanTargetCoverage']
    for sample in samples:
        sample['sumMtc'] = sumMtcDict[sample['cmoId']]
        sample['sumReads'] = sumReadDict[sample['cmoId']]
   # for sample in samples:
   #     if not sample['qc']['sampleName'] in l:
   #         sample['qc']['sumMtc'] = sumDict[sample['qc']['sampleName']]

    #else:
    #    sample['qc']['sumMtc'] = null
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
            

    #number of samples
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

    #fill pType dict
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

    #fill status dict
    status = {}
    l = []
    for i in qcStatusLabel:
        status[i] = 0
    for sample in samples:
        if not sample['qc']['recordId'] in l:
            if 'qcStatus' in sample['qc']:
                status[sample['qc']['qcStatus']] += 1
        #else:
            #sample['qc']['qcStatus'] = 'Under-Review'
            #status['Under-Review'] += 1
            l.append(sample['qc']['recordId'])

    #fill 'requester' dict
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

    #print samples
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
    return redirect(url_for('data_table', pId=pId))


#route to post all the qc status
@app.route('/postall_<pId>_<qcStatus>')
def postall_qcStatus(qcStatus, pId):

    recordIds = request.args.getlist('recordIds')
    for recordId in recordIds:
        payload = {'record': recordId, 'status': qcStatus}
        url = LIMS_API_ROOT  + "/LimsRest/setQcStatus"
        r = s.post(url, params=payload,  auth=(USER, PASSW), verify=False)
    return redirect(url_for('data_table', pId=pId))

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


if __name__ == '__main__':
    app.run()
