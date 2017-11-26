import xml.etree.ElementTree as ET
import json

from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.template import loader
from django.core import serializers 

from report_templates.models import ReportTemplate

import time

import tasks
from tasks import searchByAccessionTask, searchByMRNTask, createReportTask

@ensure_csrf_cookie
def report_templates_mainView(request):
	return render(request,'report_templates/report_templates_mainView.html',{})

def report_templates_one_uploadView(request):
	return render(request,'report_templates/report_templates_one_uploadView.html',{})

def report_templates_two_verifyView(request):
	return render(request,'report_templates/report_templates_two_verifyView.html',{})

def report_templates_three_powerscribeView(request):
	return render(request,'report_templates/report_templates_three_powerscribeView.html',{})

def report_templates_getTemplateNames(request):
	return HttpResponse(serializers.serialize('json', ReportTemplate.objects.all(), fields=('service_description')))

def report_templates_getTemplate(request):
	service_description =  request.GET.get('template_name')
	print service_description
	template = ReportTemplate.objects.get(service_description=service_description)
	return HttpResponse(template.get_template_and_requirements()[0],content_type="application/json")

def report_templates_getGeneratedReport(request):
	generatedReport_return_object = dict()
	service_description =  request.GET.get('template_name')
	template = ReportTemplate.objects.get(service_description=service_description).get_template_and_requirements()[0]
	datablock_dictionary =  json.loads(request.GET.get('datablock_dictionary'))
	datablock = "\n"
	for k in datablock_dictionary:
		datablock += "%s : %s \n" % (k,datablock_dictionary[k])
		datablock += "\n"
		print datablock
	report = template.replace('<insert_datablock>', datablock)
	return HttpResponse(report,content_type="application/json")

def report_templates_fileUpload(request):
	fileUpload_return_object = dict()

	try:
		print request
		print request.FILES['file']
		tree = ET.parse(request.FILES['file'])
		root = tree.getroot()

		measurement_dict = dict()

		other_data_not_obtained = True
		user_dict = dict()
		patient_dict = dict()

		for ImageAnnotation in root:
			calculationCollection = ImageAnnotation.find('{gme://caCORE.caCORE/3.2/edu.northwestern.radiology.AIM}calculationCollection')
			for calculation in calculationCollection:
				print calculation.attrib['description']
				calculationResultCollection = calculation.find('{gme://caCORE.caCORE/3.2/edu.northwestern.radiology.AIM}calculationResultCollection')
				calculationResult = calculationResultCollection.find('{gme://caCORE.caCORE/3.2/edu.northwestern.radiology.AIM}CalculationResult')
				calculationDataCollection = calculationResult.find('{gme://caCORE.caCORE/3.2/edu.northwestern.radiology.AIM}calculationDataCollection')
				calculationData = calculationDataCollection.find('{gme://caCORE.caCORE/3.2/edu.northwestern.radiology.AIM}CalculationData')
				print calculationData.attrib['value']
				measurement_dict[calculation.attrib['description']] = calculationData.attrib['value']

			if other_data_not_obtained:
				user = ImageAnnotation.find('{gme://caCORE.caCORE/3.2/edu.northwestern.radiology.AIM}user')
				user = user.find('{gme://caCORE.caCORE/3.2/edu.northwestern.radiology.AIM}User')
				user_dict['loginName'] = user.attrib['loginName']
				print user_dict

				patient = ImageAnnotation.find('{gme://caCORE.caCORE/3.2/edu.northwestern.radiology.AIM}person')
				patient = patient.find('{gme://caCORE.caCORE/3.2/edu.northwestern.radiology.AIM}Person')
				mrn = patient.attrib['id']
				difference = 8 - len(mrn)
				if difference > 0:
					for i in xrange(difference):
						mrn = '0' + mrn
				else:
					mrn = mrn[abs(difference):]

				patient_dict['sex'] = patient.attrib['sex']
				patient_dict['mrn'] = mrn
				patient_dict['name'] = patient.attrib['name']
				print patient_dict
				other_data_not_obtained = False

		print measurement_dict
		print user_dict
		print patient_dict

		fileUpload_return_object['error'] = False
		fileUpload_return_object['msg'] = "XML upload success"
		fileUpload_return_object['datablock_dictionary'] = measurement_dict
		fileUpload_return_object['user_dictionary'] = user_dict
		fileUpload_return_object['patient_dictionary'] = patient_dict

		return HttpResponse(json.dumps(fileUpload_return_object), content_type="application/json")
	except:
		fileUpload_return_object['error'] = True 
		fileUpload_return_object['msg'] = "An error occurred proccessing XML"
		fileUpload_return_object['datablock_dictionary'] = None
		return HttpResponse(json.dumps(fileUpload_return_object), content_type="application/json")

def report_templates_getTaskResult(request):
	task_id =  request.GET.get('task_id')
	task_method =  tasks.__dict__.get(request.GET.get('task_method'))
	result = task_method.AsyncResult(task_id)
	if result.ready():                     # check task state: true/false
		try:
			print result.result
			return HttpResponse(json.dumps({"msg":"Task complete","result":result.result}), content_type="application/json")
		except:
			pass

	return HttpResponse(json.dumps({"msg":"Please wait. Task processing.","result":None}), content_type="application/json")

# This was only a test method
def report_templates_getOrderByAccession(request):
	accession =  request.GET.get('accession')
	print accession
	result = searchByAccessionTask.delay(accession=accession)
	print result
	output = dict()
	output['task_id'] = result.task_id
	output['task_method'] = 'searchByAccessionTask'
	print output
	return HttpResponse(json.dumps(output),content_type="application/json")

def report_templates_getOrdersByMRN(request):
	mrn = request.GET.get('mrn')
	print mrn 
	result = searchByMRNTask.delay(mrn=mrn)
	print result
	output = dict()
	output['task_id'] = result.task_id
	output['task_method'] = 'searchByMRNTask'
	print output
	return HttpResponse(json.dumps(output),content_type="application/json")

@csrf_exempt
def report_templates_submitToPowerscribeFromHL7(request):
	#print request.body
	data_dict = json.loads(request.body)
	print data_dict
	#report = request.POST.get('report')
	data = dict()
	data['AP_spine_data_dict'] = data_dict['AP_spine_data_dict']
	data['DualFemur_data_dict'] = data_dict['DualFemur_data_dict']
	datablock_1 = "\n"
	for k in data['AP_spine_data_dict']:
		datablock_1 += "%s : %s \n" % (k,data['AP_spine_data_dict'][k])
	datablock_1 += "\n"
	print datablock_1
	datablock_2 = "\n"
	for k in data['DualFemur_data_dict']:
		datablock_2 += "%s : %s \n" % (k,data['DualFemur_data_dict'][k])
	datablock_2 += "\n"
	print datablock_2

	report_template = ReportTemplate.objects.get(service_description='NM DEXA normal Z score no prior (alt)').get_template_and_requirements()[0]
	report = report_template.replace('<insert_datablock_1>', datablock_1)
	report = report.replace('<insert_datablock_2>', datablock_2)
	
	print report

	accession = data_dict['accession']
	technologist_cwid = 0
	dexa = True
	#generatedReport_return_object = dict()

	#print report
	#print accession
	#print technologist_cwid

	result = createReportTask.delay(report=report,data=data,accession=accession,technologist_cwid=technologist_cwid)
	#output = dict()
	#output['task_id'] = result.task_id
	#output['task_method'] = 'createReportTask'

	#return HttpResponse(json.dumps(output),content_type="application/json")
	return HttpResponse('{}',content_type="application/json")

def report_templates_submitToPowerscribe(request):
	print request.POST.get('data')
	data = request.POST.get('data')
	report = request.POST.get('report')
	accession = request.POST.get('accession')
	technologist_cwid = request.POST.get('technologist_cwid')
	report_template = ReportTemplate.objects.get(service_description='TAVR')
	generatedReport_return_object = dict()

	print report
	print accession
	print technologist_cwid

	result = createReportTask.delay(report=report,data=data,accession=accession,technologist_cwid=technologist_cwid)
	output = dict()
	output['task_id'] = result.task_id
	output['task_method'] = 'createReportTask'

	return HttpResponse(json.dumps(output),content_type="application/json")