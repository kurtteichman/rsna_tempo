from celery import Celery
from celery.result import AsyncResult
from celery import shared_task
from celery import uuid

from celery.decorators import periodic_task
from celery.task.schedules import crontab
from celery.utils.log import get_task_logger

from suds import WebFault
from suds.client import Client
from suds.sudsobject import asdict

import datetime
import time
import requests
import json

from report_templates.models import *

#from process_hl7_both import open_file_and_process_hl7, dexa_modify_report

logger = get_task_logger(__name__)

accession_dict = dict()
accession_dict['start'] = 7777783

#@periodic_task(run_every=(crontab(minute='*/1')), name='myfunc', ignore_result=True)
"""
@periodic_task(run_every=datetime.timedelta(seconds=60))
def myfunc():
    global accession_dict
    print 'periodic_task'
    h, report, accession, mrn, pat_name, msg_dt_str = open_file_and_process_hl7(r'C:\Users\kurtt\Desktop\num_ext\num_ext\report_templates\sample_dexa.hl7')
    print accession,mrn
    AP_spine_data_dict = dict()
    AP_spine_data_dict['L1'] = [1.336,1.6,3.3]
    AP_spine_data_dict['L2'] = [1.542,2.7,4.4]
    AP_spine_data_dict['L3'] = [1.545,2.6,4.3]
    AP_spine_data_dict['L4'] = [1.523,2.4,4.1]
    AP_spine_data_dict['L1-L2'] = [1.442,2.2,3.9]
    AP_spine_data_dict['L1-L3'] = [1.482,2.4,4.1]
    AP_spine_data_dict['L1-L4'] = [1.494,2.4,4.1]
    AP_spine_data_dict['L2-L3'] = [1.544,2.7,4.4]
    AP_spine_data_dict['L2-L4'] = [1.536,2.6,4.3]
    AP_spine_data_dict['L3-L4'] = [1.534,2.5,4.2]

    DualFemur_data_dict = dict()
    DualFemur_data_dict['Neck_Left'] = [0.817,-1.6,0.1]
    DualFemur_data_dict['Neck_Right'] = [0.843,-1.4,0.2]
    DualFemur_data_dict['Neck_Mean'] = [0.830,-1.5,0.2]
    DualFemur_data_dict['Neck_Diff'] = [0.026,0.2,0.2]
    DualFemur_data_dict['Total_Left'] = [1.001,-0.1,1.4]
    DualFemur_data_dict['Total_Right'] = [1.005,0.0,1.4]
    DualFemur_data_dict['Total_Mean'] = [1.003,0.0,1.4]
    DualFemur_data_dict['Total_Diff'] = [0.004,0.0,0.0]

    payload = dict()
    payload['AP_spine_data_dict'] = AP_spine_data_dict
    payload['DualFemur_data_dict'] = DualFemur_data_dict
    payload['accession'] = accession_dict['start']
    payload['mrn'] = mrn
    payload['pat_name'] = pat_name
    payload['msg_dt_str'] = msg_dt_str

    accession_dict['start'] = accession_dict['start'] + 1
    
    requests.post('http://www.kurtteichman.com:81/num_ext/report_templates/submitToPowerscribeFromHL7',json=payload)
"""

def get_authorized_client(client):
    auth_header = client.factory.create('AuthHeader')
    auth_header['SystemID'] = 1
    auth_header['AccessCode'] = 1
    auth_header['Username'] = 'powerscribe_tst'
    auth_header['Password'] = 'powerscribe_tst3'    
    client.set_options(soapheaders=auth_header)
    return client

#auth_client = get_authorized_client(Client('http://nypscribetst.sis.nyp.org/RadPortal/services/auth.asmx?WSDL'))
report_client = get_authorized_client(Client('http://nypscribetst.sis.nyp.org/RadPortal/services/report.asmx?WSDL'))
explorer_client = get_authorized_client(Client('http://nypscribetst.sis.nyp.org/RadPortal/services/explorer.asmx?WSDL'))
order_client = get_authorized_client(Client('http://nypscribetst.sis.nyp.org/RadPortal/services/order.asmx?WSDL'))
system_client = get_authorized_client(Client('http://nypscribetst.sis.nyp.org/RadPortal/services/system.asmx?WSDL'))

#app = Celery('report_templates',
            #broker='amqp://guest:guest@localhost/',
            #backend='rpc://')

def recursive_asdict(d):
    """Convert Suds object into serializable format."""
    out = {}
    for k, v in asdict(d).iteritems():
        if hasattr(v, '__keylist__'):
            out[k] = recursive_asdict(v)
        elif isinstance(v, list):
            out[k] = []
            for item in v:
                if hasattr(item, '__keylist__'):
                    out[k].append(recursive_asdict(item))
                else:
                    out[k].append(item)
        else:
            if isinstance(v, datetime.datetime):
                out[k] = v.isoformat()
            else:
                out[k] = v
    return out

"""CreateReport(ArrayOfInt orderIDs, xs:string text, ReportStatus status, xs:int dictatorID, 
 xs:int signerID, xs:int editorID, xs:int technologistID, 
 xs:int wetReaderID, xs:boolean stat, xs:boolean distribute)"""
#@app.task(ignore_result=False)
@shared_task(ignore_result=False)
def createReport(ignore_result=False):
    pass

#@app.task(ignore_result=False)
@shared_task
def searchUserByCWIDTask(cwid=None):
    global system_client
    suds_system_account_output = system_client.service.GetAccountByUsername(username=cwid)
    # if this exists
    order_data = recursive_asdict(suds_explorer_output)
    return order_data

@shared_task(ignore_result=False)
def searchByAccessionTask(accession):
    global explorer_client
    print accession
    suds_explorer_accession_order_output = explorer_client.service.SearchByAccession("Cornell",accession)
    # if this exists
    order_data = recursive_asdict(suds_explorer_accession_order_output)
    print order_data
    return order_data

@shared_task(ignore_result=False)
def searchByMRNTask(mrn):
    global explorer_client
    print mrn
    #SearchByPatientIdentifier(xs:string site, xs:string identifier, xs:string sort)
    suds_explorer_mrn_order_output = explorer_client.service.SearchByPatientIdentifier("Cornell",mrn,'OrderDate')
    #print suds_explorer_mrn_order_output
    logger.info(str(suds_explorer_mrn_order_output))
    # if this exists
    order_data = recursive_asdict(suds_explorer_mrn_order_output)
    # data comes in sorted by OrderDate, we need to reverse it
    if 'OrderData' in order_data:
        order_data['OrderData'].reverse()

    print order_data
    return order_data

def createOrder(accession):
    global order_client
    template_order = order_client.service.GetOrder('927122')
    template_order['OrderID'] = 0
    template_order['ReportID'] = 0
    template_order['Accession'] = accession
    template_order['PlacerField1'] = accession
    # remove this logic later
    order_id = order_client.service.SaveOrder(template_order)    
    return order_id

@shared_task(ignore_result=False)
def createReportTask(data=None,accession=None,report=None,report_template=None,technologist_cwid=None,dexa=False):
    print 'data in createReportTask'
    print data
    global explorer_client,report_client,system_client
    status = report_client.factory.create('ReportStatus')
    status = status['Draft']
    print status
    report_template = None
    output = dict()
    output['error'] = False
    output['payload'] = ""
    #george = 0
    #shlomo = 0
    #adrienne = 0
    #james = 0
    #kurt = 0
    #editor = 0
    #SearchByPatientIdentifier(xs:string site, xs:string identifier, xs:string sort)
    #print accession
    logger.info(accession)
    suds_explorer_accession_order_output = explorer_client.service.SearchByAccession("Cornell",accession)
    #print suds_explorer_accession_order_output
    logger.info(str(suds_explorer_accession_order_output))

    if not suds_explorer_accession_order_output:
        output['error'] = True
        output['payload'] = "No order found for Accession %s" % accession
    # remove this logic later
    try:
        #if suds_explorer_accession_order_output:
            #order_id = suds_explorer_accession_order_output['OrderData'][0]['OrderID']
        #else:
        order_id = createOrder(accession)
        
        int_array = report_client.factory.create('ArrayOfInt') 
        int_array['int'] = [order_id]
        # CreateReport(ArrayOfInt orderIDs, xs:string text, ReportStatus status, xs:int dictatorID, xs:int signerID, xs:int editorID, 
        #                xs:int technologistID, xs:int wetReaderID, xs:boolean stat, xs:boolean distribute)
        #report_id = report_client.service.CreateReport(int_array, report, status, shlomo['ID'], george['ID'], editor, adrienne, 0, False, False )
        report_id = report_client.service.CreateReport(int_array, report, status, 0, 0, 0, 0, 0, False, False )
        print 'REPORT CREATED'
        output['payload'] = report_id
        #returning value as a dictionary as report_templates_getTaskResult expects an object .. this might not be required though
        return output
    except WebFault as detail:
        print detail.fault
        output['error'] = True
        output['payload'] = detail.fault.faultstring
        return output

#@shared_task(ignore_result=False)
#def createReportTask(accession=None,report=None,technologist_cwid=None):
    #global explorer_client,report_client,system_client
    #status = report_client.factory.create('ReportStatus')
    #status = status['Draft']
    #print status
    #george = 0
    #shlomo = 0
    #adrienne = system_client.service.GetAccountByUsername(username=technologist_cwid)
    #james = 0
    #kurt = 0
    #editor = 0
    #SearchByPatientIdentifier(xs:string site, xs:string identifier, xs:string sort)
    #print accession
    #suds_explorer_accession_order_output = explorer_client.service.SearchByAccession("Cornell",accession)
    #print suds_explorer_accession_order_output
    #order_id = suds_explorer_accession_order_output['OrderData'][0]['OrderID']

    #int_array = report_client.factory.create('ArrayOfInt') 
    #int_array['int'] = [order_id]
    # CreateReport(ArrayOfInt orderIDs, xs:string text, ReportStatus status, xs:int dictatorID, xs:int signerID, xs:int editorID, 
    #                xs:int technologistID, xs:int wetReaderID, xs:boolean stat, xs:boolean distribute)
    #report_id = report_client.service.CreateReport(int_array, report, status, shlomo['ID'], george['ID'], editor, adrienne, 0, False, False )
    #print 'REPORT CREATED'
    #output_dict = dict()
    #print report_id
    #returning value as a dictionary as report_templates_getTaskResult expects an object .. this might not be required though
    #output_dict['report_id'] = report_id
    #return report_id