
# Register your models here.

from django.contrib import admin
from models import ReportTemplate, Section, SectionAttribute
import nested_admin

class SectionAttributeInline(nested_admin.NestedTabularInline):
    model = SectionAttribute 
    extra = 0
    sortable_field_name = 'order_priority'

class SectionInline(nested_admin.NestedTabularInline):
    model = Section
    extra = 0
    sortable_field_name = 'order_priority'
    inlines=[SectionAttributeInline]

#class SectionAdmin(admin.ModelAdmin):
#    fieldsets = [
#        (None, {'fields':['header','header_description','order_priority']})
#    ]
#    inlines=[InformationAttributeInline]

class ReportTemplateAdmin(nested_admin.NestedModelAdmin):
    fieldsets = [
        (None, {'fields':['service_description','patient_gender']})
    ]
    inlines=[SectionInline]
# Register your models here.
admin.site.register(ReportTemplate,ReportTemplateAdmin)
#admin.site.register(Section,SectionAdmin)
#admin.site.register(InformationAttribute)