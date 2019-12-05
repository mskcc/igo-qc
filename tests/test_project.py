import sys
import os

sys.path.insert(0, os.path.abspath("tests/mock_modules"))
import mock_logger
sys.modules['logger'] = __import__('mock_logger')

sys.path.insert(0, os.path.abspath("config"))
import project

sys.path.insert(0, os.path.abspath("tests/mock_responses"))
from get_project_info_resp import get_project_info_resp

sys.path.insert(0, os.path.abspath("tests/mocks"))
from get_project_qc import ped_peg
from qc_status_label import qc_status_label


def test_get_project_info():
    test_get_project_info_multiple_recipes()
    return True

def test_get_project_info_multiple_recipes():
    # Use ped_peg, which should have both an rna & wgs recipe
    data = project.get_project_info('', qc_status_label, ped_peg)
    for key in get_project_info_resp.keys():
        assert (data[key] == get_project_info_resp[key])
    assert data == get_project_info_resp
