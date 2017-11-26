from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.report_templates_mainView),
    #url(r'^' + config.DEPLOYMENT_PREFIX + config.RADIQAL_DEPLOYMENT_PREFIX + '$', lambda x: HttpResponseRedirect('/' + config.DEPLOYMENT_PREFIX + '/explorerApp/')),
    url(r'^report_templates_one_uploadView\.html\/?$', views.report_templates_one_uploadView),
    url(r'^report_templates_two_verifyView\.html\/?$', views.report_templates_two_verifyView),
    url(r'^report_templates_three_powerscribeView\.html\/?$', views.report_templates_three_powerscribeView),
    url(r'^fileUpload$', views.report_templates_fileUpload),
    url(r'^getTemplateNames$', views.report_templates_getTemplateNames),
    url(r'^getTemplate$', views.report_templates_getTemplate),
    url(r'^getGeneratedReport$', views.report_templates_getGeneratedReport),
    url(r'^getTaskResult$', views.report_templates_getTaskResult),
    
    # This was a test
    url(r'^getOrderByAccession$', views.report_templates_getOrderByAccession),

    url(r'^getOrdersByMRN$', views.report_templates_getOrdersByMRN),
    url(r'^submitToPowerscribe$', views.report_templates_submitToPowerscribe),
    url(r'^submitToPowerscribeFromHL7$', views.report_templates_submitToPowerscribeFromHL7),
    #url(r'^' + config.DEPLOYMENT_PREFIX config.RADIQAL_DEPLOYMENT_PREFIX + 'pp/getIssueRecommendations\/?$',  'refvol.radiqal_views.radiqal_getIssueRecommendations'),
]