#!/usr/bin/env python

import requests

#get this link, supplying the user name and password, and turning off SSL_CERTIFICATE_VERIFY because the toro dev website does not have a certificate
r = requests.get("https://toro.cbio.mskcc.org:8443/LimsRest/getProjectQc?project=06159", auth=("user","81892f87-8730-405b-a220-e64455482c4b"), verify=False)
print r.content
