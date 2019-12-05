import sys
import os

sys.path.insert(0, os.path.abspath("tests/mock_modules"))
import mock_logger
sys.modules['logger'] = __import__('mock_logger')

sys.path.insert(0, os.path.abspath("config"))
import project

sys.path.insert(0, os.path.abspath("tests/mock_responses"))
from get_project_info_resp import get_project_info_resp
from get_project_info_resp_chipSeq import chip_seq_resp

sys.path.insert(0, os.path.abspath("tests/mocks"))
from lims_get_project_qc_pedPeg import lims_ped_peg
from lims_get_project_qc_chipSeq import lims_chip_seq
from lims_qc_status_label import lims_qc_status_label


def test_get_project_info():
    print("***************************\n****** Project Test *******\n***************************")
    print("Success" if test_get_project_info_multiple_recipes() else "Failure")
    print("Success" if test_get_project_info_single_recipe() else "Failure")
    return True

def test_get_project_info_single_recipe():
    print("***Testing Single Recipe***")
    return resp_tester(lims_chip_seq, chip_seq_resp)

def test_get_project_info_multiple_recipes():
    print("***Testing Multiple Recipe***")
    return resp_tester(lims_ped_peg, get_project_info_resp)

def resp_tester(lims_resp, expected_resp):
    # Use ped_peg, which should have both an rna & wgs recipe
    data = project.get_project_info('', lims_qc_status_label, lims_resp)
    for key in expected_resp.keys():
        if (data[key] != expected_resp[key]):
            print('FAILURE ON KEY: %s' % key)
            print(data[key])
            print(expected_resp[key])
    assert data == expected_resp
    return True
