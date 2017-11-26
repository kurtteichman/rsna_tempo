from __future__ import unicode_literals

from django.db import models
from django.contrib.postgres.fields import ArrayField

# Create your models here.

class ReportTemplate(models.Model):
    def get_name(self):
        if self.patient_gender != '':
            return "%s : %s" % (self.service_description, self.patient_gender)
        else:
            return "%s" % (self.service_description)
    def __unicode__(self):
        return self.get_name()

    def get_template_and_requirements(self):
        report_template_string_list = []
        report_template_requirements = []

        report_template_string_list.append("{0} : {1} \n".format(self.service_description,self.patient_gender))
        report_template_string_list.append("\n")
        for section in self.section_set.all():
            report_template_string_list.append("{0}: {1}\n\n".format(section.header,section.header_description))
            for sectionattribute in section.sectionattribute_set.all():
                report_template_string_list.append("{0}: {1}\n".format(sectionattribute.information_item,sectionattribute.information_item_description))
                if '%s' in sectionattribute.information_item_description:
                    report_template_requirements.append((sectionattribute.information_type,sectionattribute.information_item,sectionattribute.information_item_description))
            report_template_string_list.append("\n")
        return (''.join(report_template_string_list),report_template_requirements)

    def render_template(self):
        pass

    service_description = models.CharField(max_length=100,blank=True)
    patient_gender = models.CharField(max_length=30,blank=True)

    class Meta:
        ordering = ('service_description','patient_gender')
        index_together = ["service_description","patient_gender"]

class Section(models.Model):
    def __unicode__(self):
        return "%s : %s"  % (self.header, self.order_priority)
    def get_name(self):
        return "%s : %s"  % (self.header, self.order_priority)

    #The first element in each tuple is the actual value to be set on the model, 
    #and the second element is the human-readable name
    HEADER_CHOICES = (
        ('CLINICAL STATEMENT', 'CLINICAL STATEMENT'),
        ('TECHNIQUE', 'TECHNIQUE'),
        ('HISTORY', 'HISTORY'),
        ('COMPARISON', 'COMPARISON'),
        ('INDICATIONS', 'INDICATIONS'),
        ('PRIOR INTERVENTIONS', 'PRIOR INTERVENTIONS'),
        ('MEDICATION', 'MEDICATION'),
        ('FINDINGS', 'FINDINGS'),
        ('IMPRESSION', 'IMPRESSION'),
    )

    header = models.CharField(
        max_length=50,
        choices=HEADER_CHOICES,
        blank=False
    )

    header_description = models.CharField(max_length=2000,blank=True)
    template = models.ForeignKey(ReportTemplate)
    order_priority = models.PositiveSmallIntegerField("Position", null=True)
    #order_priority = models.IntegerField(blank=False)

    class Meta:
        ordering = ('order_priority',)
        index_together = ["header","order_priority"]

class SectionAttribute(models.Model):
    def __unicode__(self):
        return "%s : %s : %s : %s: " % (self.section.header,self.information_type, self.information_item_description, self.order_priority)
    def get_name(self):
        return "%s : %s : %s : %s: " % (self.section.header,self.information_type, self.information_item_description, self.order_priority)
    def generate_template_tuple(self):
        if self.information_type == 'Measurement':
            return (self.units)

    #The first element in each tuple is the actual value to be set on the model, 
    #and the second element is the human-readable name
    INFORMATION_TYPE_CHOICES = (
        ('Measurement', 'Measurement'),
        ('Region of Interest', 'Region of Interest'),
        ('Scanner', 'Scanner'),
        ('Contrast Type', 'Contrast Type'),
        ('Contrast Volume', 'Contrast Volume'),
        ('Contrast Delivery', 'Contrast Delivery'),
        ('Oral Contrast', 'Oral Contrast'),
        ('Procedure', 'Procedure')
    )

    information_type = models.CharField(
        max_length=50,
        choices=INFORMATION_TYPE_CHOICES,
        blank=False
    )

    information_item = models.CharField(max_length=80,blank=False)
    information_item_description = models.CharField(max_length=2000,blank=True)
    order_priority = models.PositiveSmallIntegerField("Position", null=True)
    section = models.ForeignKey(Section)
    class Meta:
        ordering = ('order_priority',)
        index_together = ["information_type","order_priority"]

class PowerscribeReportDatum(models.Model):
    # report values are float measurements
    report_values = ArrayField(models.FloatField(max_length=100),blank=True,size=100,default=[])
    # report keys can be ROIs -- veins, arteries, etc
    report_key = models.CharField(max_length=100,blank=True)
    datum_unit = models.CharField(max_length=10,blank=True)
    report_template = models.ForeignKey("ReportTemplate",blank=True,null=True,related_name="Report_Template_from_Datum")
    report = models.ForeignKey("PowerscribeReport",blank=True,null=True,related_name="Report_from_Datum")

class PowerscribeReportData(models.Model):
    report_data_entries = models.ManyToManyField(PowerscribeReportDatum)
    #report_values = ArrayField(models.FloatField(max_length=100), blank=True, size=100)
    #report_keys = ArrayField(models.CharField(max_length=100, blank=True, default="key"), blank=True, size=100,default=[])

class PowerscribeReport(models.Model):
    report_template = models.ForeignKey("ReportTemplate",blank=True, null=True,related_name='Report_Template')
    report_data = models.ManyToManyField(PowerscribeReportData)
    autogenerated = models.BooleanField(default=False)
    cwid = models.CharField(max_length=80)
    name = models.CharField(max_length=100)
    accession = models.CharField(max_length=100,blank=False)
    creator_email = models.CharField(max_length=90)
    date_created = models.DateTimeField(auto_now_add=True, blank=True)
    report = models.TextField(max_length=3000)