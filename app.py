from flask import Flask, render_template
import requests
import json
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

@app.route('/')
def data_table():
    #get the content, turning off SSL_VERIFY_CERTIFICATE and supplying username/pass
    r = s.get("https://toro.cbio.mskcc.org:8443/LimsRest/getProjectQc?project=06159", auth=("user","81892f87-8730-405b-a220-e64455482c4b"), verify=False)
    #turn the json content (the body of the html reply) into a python dictionary/list object
    data = json.loads(r.content)
    #select the subset of the python dictionary that corresponds to what we want to display
    samples = data['samples']
    #compute the sum of the 'readDuped' by 'sampleName'
    sumDict = {}
    for i in samples:
	if not sumDict.has_key(i['qc']['sampleName']):
		sumDict[i['qc']['sampleName']] = 0
	sumDict[i['qc']['sampleName']] += i['qc']['readsDuped']
    for i in samples:   	
	i['qc']['sumReads'] = sumDict[i['qc']['sampleName']]
    #compute the sum of the 'meanTargetCoverage' by 'sampleName'
    sumDict = dict.fromkeys( sumDict.iterkeys(), 0 )
    for i in samples:
        sumDict[i['qc']['sampleName']] += i['qc']['meanTargetCoverage']
    for i in samples:
        i['qc']['sumMtc'] = sumDict[i['qc']['sampleName']]
    

    requester = {'id': data['requestId'], 'investigator': data['investigator'], 'pi': data['pi'], 'projectManager': data['projectManager'], \
		'pipelinable': data['pipelinable'], 'analysisRequested': data['analysisRequested'], 'cmoProject': data['cmoProject']}

    #print samples
    #pass it to templates/data_table.html to render with jinja templates
    return render_template("data_table.html", **locals())


@app.route('/index')
def index():
	return render_template("index.html", **locals())


if __name__ == '__main__':
    app.run(debug=True, host="localhost", port=5600)
