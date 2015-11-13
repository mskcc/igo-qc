from flask import Flask, render_template, url_for, request, redirect
from functools import wraps
import requests
import json, re
app = Flask(__name__)
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.poolmanager import PoolManager
import ssl

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
                errors = "Please enter the field."
            if not errors:
                # Validate the project_id and raise an error if it is invalid
                if not is_project_id_valid(project_id):
                    errors = errors + "Please enter a valid project ID"
                    return redirect(url_for('error', error_id=404, txt=errors))
            if not errors:
                # If there are no errors, create a dictionary containing all the entered
                # data and pass it to the template to be displayed
                data = {'project_id': project_id}
                # Since the form data is valid, render the success template
                return redirect(url_for('data_table', pId=project_id))
    return inner


# Here we define some useful functions

# This function validates the shape of the project ID
def is_project_id_valid(project_id):
    """Validate the project_id using a regex."""
    if not re.match("^[a-zA-Z0-9]+$", project_id):
        return False
    return True


@app.route('/<pId>', methods=['GET', 'POST'])
@navbarForm
def data_table(pId):
    #get the content, turning off SSL_VERIFY_CERTIFICATE and supplying username/pass
    r = s.get("https://igo.cbio.mskcc.org:8443/LimsRest/getPmProject?project="+pId, auth=("qc","funball"), verify=False)
    t = s.get("https://igo.cbio.mskcc.org:8443/LimsRest/getPickListValues?list=Sequencing+QC+Status", auth=("qc","funball"), verify=False)
    #turn the json content (the body of the html reply) into a python dictionary/list object
    data = json.loads(r.content)
    qcStatusLabel = json.loads(t.content)
    #select the subset of the python dictionary that corresponds to what we want to display
    samples = data['samples']
    #compute the sum of the 'readDuped' by 'sampleName'
    sumDict = {}
    for sample in samples:
	if not sumDict.has_key(sample['qc']['sampleName']):
		sumDict[sample['qc']['sampleName']] = 0
	sumDict[sample['qc']['sampleName']] += sample['qc']['readsDuped']
    for sample in samples:   	
	sample['qc']['sumReads'] = sumDict[sample['qc']['sampleName']]
    #compute the sum of the 'meanTargetCoverage' by 'sampleName'
    sumDict = dict.fromkeys( sumDict.iterkeys(), 0 )
    for sample in samples:
        sumDict[sample['qc']['sampleName']] += sample['qc']['meanTargetCoverage']
    for sample in samples:
        sample['qc']['sumMtc'] = sumDict[sample['qc']['sampleName']]
    #format of 'run'
    for sample in samples:
	l = sample['qc']['run'].split('_')
	sample['qc']['run'] = l[0] + '_' + l[1]
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
	if not sample['cmoId'] in l:
	    if 'qcStatus' in sample['qc']:
  	        status[sample['qc']['qcStatus']] += 1
	    else:
	        sample['qc']['qcStatus'] = 'Passed'
	        status['Passed'] += 1
	    l.append(sample['cmoId'])

    #fill 'requester' dict
    requester = {}
    for label in ['requestId', 'investigator',  'pi', 'projectManager', 'pipelinable', 'analysisRequested', 'cmoProject']:
	if label in data:
	    requester[label] = data[label]
	else:
	    requester[label] = 'N/A'
    if 'requestedNumberOfReads' in samples[0]:
	requester['requestedNumberOfReads'] = 13000000 #samples[0]['requestedNumberOfReads']
    else:
	requester['requestedNumberOfReads'] = 'N/A'

    #print samples
    #pass it to templates/data_table.html to render with jinja templates
    return render_template("data_table.html", **locals())


# /error/<int:error> route and its view. This render '404.html' template
@app.route('/error/<int:error_id><txt>', methods=['GET', 'POST'])
@navbarForm
def error(error_id, txt):
    return render_template('404.html', error_id=error_id, txt=txt)

# We raise an error and display it. This render '404.html' template
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html', error=e), 404





if __name__ == '__main__':
    app.run(debug=True, host="localhost", port=5600)
