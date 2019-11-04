from requests.models import Response

resp = Response()
resp.code = "expired"
resp.error_type = "expired"
resp.status_code = 200
resp._content = b'["Under-Review","IGO-Complete","Passed","Failed","Resequence-Pool","Repool-Sample","Recapture-Sample","New-Library-Needed","Required-Additional-Reads"]'