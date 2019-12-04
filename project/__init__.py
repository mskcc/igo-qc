import os
import re
from collections import defaultdict

import Grid
import headers
import logger
from settings import APP_STATIC

def get_project_info(pId, qc_status_label, get_project_qc):
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

    return data

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

def getColumnOrder(type):
    if type in headers.order:
        logger.info("Returning column order for %s" % type)
        return headers.order[type]
    logger.error("No column order set for %s. Returning empty list" % type)
    return headers.order['default']

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
                  "QC Status", "Mean Tgt Cvg", "Pct. Duplic.", "Pct. Adapters", "Reads Examined", "Unpaired Reads", "Sum Reads","Unmapped",
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
        grid.set_value("Concentr.  (nM)", row, round_float(sample['concentration']))
        grid.set_value("Final Library Yield (fmol)", row, round_float(sample['yield']))
        # TODO: coverageTarget seems dependent on pending data
        if "coverageTarget" in sample:
            cov_target = "" if sample['coverageTarget'] == 0 else sample['coverageTarget']  # hack; coverage target is set to 0 in LIMS by default at pull, will display as empty string on site
            grid.set_value("Coverage Target", row, cov_target)
        else:
            # TODO - provide an alert about fields
            grid.set_value("Coverage Target", row, "NOT AVAILABLE")
        requestedNumReads = get_sample_value(sample, 'requestedNumberOfReads')
        grid.set_value("Requested Reads (Millions)", row, to_int(requestedNumReads))
        grid.set_value("Pct. Adapters", row, round_float(qc['percentAdapters'] * 100, 6))
        grid.set_value("Reads Examined", row, qc['readsExamined'])
        grid.set_value("Unpaired Reads", row, qc['unpairedReadsExamined'])
        grid.set_value("Initial Pool", row, "")
        if "initialPool" in sample:
            grid.set_value("Initial Pool", row, sample["initialPool"])
        grid.set_value("Unmapped", row, qc['unmapped'])
        grid.set_value("Pct. Duplic.", row, round_float(qc['percentDuplication']* 100))
        if project_type["startable"]:
            grid.set_value("Starting Amount", row, qc["startingAmount"])
        if project_type["qcControlled"]:
            grid.set_value("Library Quality Control", row, "{:,.2f}".format(qc["qcControl"]) + " " +  str(qc["qcUnits"]))
        if project_type["quanted"]:
            grid.set_value("Quant-it", row, "{:,.2f}".format(qc["quantIt"]) + " " +  qc["quantUnits"])
        grid.set_value("Sum Reads", row, sample["sumReads"])
        if project_type['table'] == 'rna':
            grid.set_value("Pct. Ribos.", row, round_float(qc['percentRibosomalBases'] * 100))
            grid.set_value("Pct. Coding", row, round_float(qc['percentCodingBases'] * 100))
            grid.set_value("Pct. Utr", row, round_float(qc['percentUtrBases'] * 100))
            grid.set_value("Pct. Intron.", row, round_float(qc['percentIntronicBases'] * 100))
            grid.set_value("Pct. Intergenic", row, round_float(qc['percentIntergenicBases']* 100) )
            grid.set_value("Pct. Mrna", row, round_float(qc['percentMrnaBases']* 100) )
        if project_type['table'] == 'wgs':
            add_sum_mtc(grid, row, sample, qc)
            grid.set_value("Mean Tgt Cvg", row, round_float(qc["mean_COVERAGE"]))
            grid.set_value("PCT_EXC_MAPQ", row, round_float(qc['pct_EXC_MAPQ']* 100) )
            grid.set_value("PCT_EXC_DUPE", row, round_float(qc['pct_EXC_DUPE']* 100) )
            grid.set_value("PCT_EXC_BASEQ", row, round_float(qc['pct_EXC_BASEQ']* 100) )
            grid.set_value("PCT_EXC_TOTAL", row, round_float(qc['pct_EXC_TOTAL']* 100) )
            grid.set_value("PCT_10X", row, round_float(qc['percentTarget10x']* 100) )
            grid.set_value("PCT_30X", row, round_float(qc['percentTarget30x']* 100) )
            grid.set_value("PCT_40X", row, round_float(qc['percentTarget40x']* 100) )
            grid.set_value("PCT_80X", row, round_float(qc['percentTarget80x']* 100) )
            grid.set_value("PCT_100X", row, round_float(qc['percentTarget100x']* 100) )
        if project_type['table'] == 'hs':
            grid.set_value("Mean Tgt Cvg", row, round_float(qc['meanTargetCoverage']))
            add_sum_mtc(grid, row, sample, qc)
            grid.set_value("Pct. Zero Cvg", row, round_float(qc['zeroCoveragePercent'] * 100))
            grid.set_value("Pct. Off Bait", row, round_float(qc['percentOffBait'] * 100))
            grid.set_value("Pct. 10x", row, round_float(qc['percentTarget10x'] * 100))
            grid.set_value("Pct. 30x", row, round_float(qc['percentTarget30x'] * 100))
            grid.set_value("Pct. 100x", row, round_float(qc['percentTarget100x'] * 100))
        row += 1

    return {
        'header': grid.get_header(),
        'val_types': grid.get_val_types(),
        'grid': grid.get_grid(),
        'style': grid.get_style()
    }

'''
Rounds floats to two decimal points
'''
def round_float(num, decimal_places = 2):
    try:
        return round(num,decimal_places)
    except TypeError:
        logger.error('Could not round %s as float to %d decimal places' % (str(num), decimal_places))
        return num


def get_charts_links(project_qc_info):
    charts_links = {}
    chart_pdfs = APP_STATIC + "/html/PDF"
    try:
        project_indexes = os.listdir(chart_pdfs) #os.listdir ( os.path.join("", "html/PDF") )
    except FileNotFoundError:
        logger.error('Could not find path: %s' % chart_pdfs)
        return charts_links
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
            col = 'meanTargetCoverage'
            if 'HumanWholeGenome' in sample['recipe']:
                col = 'mean_COVERAGE'
            sumMtcDict[sample['cmoId']] += sample['qc'][col]
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

def get_sample_value(sample, field):
    val = "NOT AVAILABLE"
    if field in sample:
        val = sample[field]
    return val


def add_sum_mtc(grid, row, sample, qc):
    grid.set_value("Mean Tgt Cvg", row, round_float(qc['meanTargetCoverage']))
    if "sumMtc" in sample:
       grid.set_value("Sum MTC", row, round_float(sample['sumMtc']))

def to_int(value):
    try:
        return int(value)
    except ValueError:
        logger.error('Could not parse %s to float' % str(value))
        return value
