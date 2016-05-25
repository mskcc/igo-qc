# Version 1.0

from flask import Flask, render_template, url_for, request, redirect
from functools import wraps
import requests
import os, json, re
from settings import APP_STATIC, LIMS_version
app = Flask(__name__)
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.poolmanager import PoolManager
import ssl
from cred import authCodes

class MyAdapter(HTTPAdapter):
    def init_poolmanager(self, connections, maxsize, block=False):
        self.poolmanager = PoolManager(num_pools=connections,
                maxsize=maxsize,
                block=block,
                ssl_version=ssl.PROTOCOL_SSLv3)

s = requests.Session()
s.mount('https://', MyAdapter())


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
    return render_template("index.html", **locals())


@app.route('/<pId>', methods=['GET', 'POST'])
@navbarForm
def data_table(pId):

    #define variables
    data = {}
    qcStatusLabel = []

    #get the content, turning off SSL_VERIFY_CERTIFICATE and supplying username/pass
    r = s.get("https://" + LIMS_version  + ".cbio.mskcc.org:8443/LimsRest/getProjectQc?project="+pId, auth=authCodes, verify=False)
    t = s.get("https://" + LIMS_version  + ".cbio.mskcc.org:8443/LimsRest/getPickListValues?list=Sequencing+QC+Status", auth=authCodes, verify=False)

    #turn the json content (the body of the html reply) into a python dictionary/list object
    data = json.loads(r.content)
    qcStatusLabel = json.loads(t.content)

    #select the subset of the python dictionary that corresponds to what we want to display
    samples = data['samples']

    #test if the requested project exist in the LIMS else display 404.html
    if data['samples'] == []:
        return redirect( url_for('page_not_found', pId=data['requestId'], code_error=3) )

    if data['requestId'] == "ERROR":
        return redirect( url_for('page_not_found', pId=data['requestId'], code_error=3) )


    #compute the sum of the 'readDuped' by 'sampleName'
    sumDict = {}
    l = {}
    for sample in samples:
	if not sumDict.has_key(sample['qc']['sampleName']):
		sumDict[sample['qc']['sampleName']] = 0
 
    if sample['qc']['readsExamined']>0:
        sumDict[sample['qc']['sampleName']] += sample['qc']['readsExamined']
    else:
        sumDict[sample['qc']['sampleName']] += sample['qc']['unpairedReadsExamined']

    for sample in samples:
	if not sample['qc']['sampleName'] in l:
	    sample['qc']['sumReads'] = sumDict[sample['qc']['sampleName']]
        #else:
        #    sample['qc']['sumReads'] = null
        l[sample['qc']['sampleName']] = 1

    #compute the sum of the 'meanTargetCoverage' by 'sampleName'
    sumDict = dict.fromkeys( sumDict.iterkeys(), 0 )
    l = {}
    for sample in samples:
        sumDict[sample['qc']['sampleName']] += sample['qc']['meanTargetCoverage']
    for sample in samples:
        if not sample['qc']['sampleName'] in l:
            sample['qc']['sumMtc'] = sumDict[sample['qc']['sampleName']]
	#else:
	#    sample['qc']['sumMtc'] = null
        l[sample['qc']['sampleName']] = 1

    #format of 'run'
    for sample in samples:
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
    for sample in samples:
	if not sample['qc']['sampleName'] in l:
	    l.append(sample['qc']['sampleName'])
    n = len(l)

    #fill pType dict
    pType = {'recipe': samples[0]['recipe']}
    if 'RNA' in pType['recipe']:
	pType['table'] = 'rna'
    elif 'baitSet' in samples[0]['qc']:
	pType['table'] = 'hs'
	pType['baitSet'] = samples[0]['qc']['baitSet']
    else:
	pType['table'] = 'md'

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
	if label in data:
	    requester[label] = data[label]
	else:
	    requester[label] = 'N/A'
    if 'requestedNumberOfReads' in samples[0]:
        requester['requestedNumberOfReads'] = samples[0]['requestedNumberOfReads']
    else:
	    requester['requestedNumberOfReads'] = 'N/A'

    #list all recordId
    recordIds = []
    for sample in samples:
        recordIds.append(sample['qc']['recordId'])

    #get the list of the index for the runs
    run_indexes = os.listdir ( os.path.join(APP_STATIC, "html/FASTQ") )

    #get the list of the project charts
    charts_links = {}
    project_indexes = os.listdir ( os.path.join(APP_STATIC, "html/PDF") )
    for project_index in project_indexes:
        l = project_index.split('___')
        if l[1] == data['requestId']:
	    if l[2] == 'tree.pdf' or l[1] == 'heatmap.pdf':
                charts_links[l[0] + '_' + l[2]] = 'html/PDF/' + project_index
	    elif l[3] == 'pie.pdf':
		charts_links[l[0] + '_' + l[2] + '_' + l[3]] = 'html/PDF/' + project_index

    #print samples
    #pass it to templates/data_table.html to render with jinja templates
    return render_template("data_table.html", **locals())


#route for display the JSON
@app.route('/JSON_<pId>')
def displayJSON(pId):
    r = s.get("https://" + LIMS_version  + ".cbio.mskcc.org:8443/LimsRest/getProjectQc?project="+pId, auth=authCodes, verify=False)
    data = json.loads(r.content)
    return render_template('json.html', **locals())


#route to post the qc status
@app.route('/post_<pId>_<recordId>_<qcStatus>')
def post_qcStatus(pId, recordId, qcStatus):
    payload = {'record': recordId, 'status': qcStatus}
    url = "https://" + LIMS_version  + ".cbio.mskcc.org:8443/LimsRest/setQcStatus"
    r = s.post(url, params=payload, auth=authCodes, verify=False)
    return redirect(url_for('data_table', pId=pId))


#route to post all the qc status
@app.route('/postall_<qcStatus>_<pId>')
def postall_qcStatus(qcStatus, pId):
    recordIds = request.args.getlist('recordIds')
    for recordId in recordIds:
	payload = {'record': recordId, 'status': qcStatus}
        url = "https://" + LIMS_version  + ".cbio.mskcc.org:8443/LimsRest/setQcStatus"
        r = s.post(url, params=payload, auth=authCodes, verify=False)
    return redirect(url_for('data_table', pId=pId))


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





if __name__ == '__main__':
    app.run(debug=True, host="rho.mskcc.org", port=5600)
