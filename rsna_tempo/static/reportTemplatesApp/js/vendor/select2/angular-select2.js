/**
 * Enhanced Select2 Dropmenus
 *
 * @AJAX Mode - When in this mode, your value will be an object (or array of objects) of the data used by Select2
 *     This change is so that you do not have to do an additional query yourself on top of Select2's own query
 * @params [options] {object} The configuration options passed to $.fn.select2(). Refer to the documentation
 */
angular.module('ui.select2', []).value('uiSelect2Config', {}).directive('uiSelect2', ['uiSelect2Config', '$timeout','security', function (uiSelect2Config, $timeout,security) {
  var options = {};
  if (uiSelect2Config) {
    angular.extend(options, uiSelect2Config);
  }
  return {
    require: 'ngModel',
    priority: 1,
    compile: function (tElm, tAttrs) {
      var watch,
        repeatOption,
        repeatAttr,
        isSelect = tElm.is('select'),
        isMultiple = angular.isDefined(tAttrs.multiple);

      // Enable watching of the options dataset if in use
      if (tElm.is('select')) {
        repeatOption = tElm.find( 'optgroup[ng-repeat], optgroup[data-ng-repeat], option[ng-repeat], option[data-ng-repeat]');

        if (repeatOption.length) {
          repeatAttr = repeatOption.attr('ng-repeat') || repeatOption.attr('data-ng-repeat');
          watch = jQuery.trim(repeatAttr.split('|')[0]).split(' ').pop();
        }
      }

      return function (scope, elm, attrs, controller) {
        // instance-specific options
        var opts = angular.extend({}, options, scope.$eval(attrs.uiSelect2));

        /*
        Convert from Select2 view-model to Angular view-model.
        */
        var convertToAngularModel = function(select2_data) {
          var model;
          if (opts.simple_tags) {
            model = [];
            angular.forEach(select2_data, function(value, index) {
              model.push(value.id);
            });
          } else {
            model = select2_data;
          }
          return model;
        };

        /*
        Convert from Angular view-model to Select2 view-model.
        */
        var convertToSelect2Model = function(angular_data) {
          var model = [];
          if (!angular_data) {
            return model;
          }

          // TODO: this is very hacky
          // it's being misused by another function
          if (opts.simple_tags) {
            model = [];
            angular.forEach(
              angular_data,
              function(value, index) {
                output = value;
                if (scope.isPatientAlertCreateEditCtrl) {
                  if (scope.isCreateAlert) {
                    if (value.indexOf(scope.currentUserEmail.split(' ')[0]) != -1) {
                      // need this so we don't tag alert owner twice due to asynch issues
                      if (value.indexOf('OWNER') == -1) {
                        model.push({'id': value + " <ALERT OWNER>", 'text': value + " <ALERT OWNER>", 'locked': true });
                      } else {
                        model.push({'id': value, 'text': value, 'locked':true });
                      }
                    } else {
                      model.push({'id': value, 'text': value, 'locked':false});
                    }
                  } else if (scope.isOwner && !scope.isCreateAlert) {
                    if (value.indexOf(scope.alertOwnerEmail.split(' ')[0]) != -1) {
                      if (value.indexOf('OWNER') == -1) {
                        model.push({'id': value + " <ALERT OWNER>", 'text': value + " <ALERT OWNER>", 'locked': true });
                      } else {
                        model.push({'id': value, 'text': value, 'locked':true });
                      }
                    } else {
                      model.push({'id': value, 'text': value, 'locked':false});
                    }
                  } else if (!scope.isOwner && !scope.isCreateAlert) {
                    if (value.indexOf(scope.alertOwnerEmail.split(' ')[0]) != -1) {
                      if (value.indexOf('OWNER') == -1) {
                        model.push({'id': value + " <ALERT OWNER>", 'text': value + " <ALERT OWNER>", 'locked': true });
                      } else {
                        model.push({'id': value, 'text':value, 'locked': true }); 
                      }
                    } else {
                      model.push({'id': value, 'text':value, 'locked': true }); 
                    }
                  } 
                } else {
                  model.push({'id': value, 'text': value, 'locked': false})
                }
                /*
                if (scope.isCreateAlert && value.indexOf('OWNER') == -1) {
                  if (value.indexOf(scope.alertOwnerEmail.split(' ')[0]) == -1) {
                    model.push({'id': output, 'text': output});
                  } else {
                    if (value.indexOf('OWNER') == -1) {
                      console.log('im in here');
                      model.push({'id': output + " <ALERT OWNER>", 'text': output + " <ALERT OWNER>", 'locked': true });
                    } else {
                      model.push({'id': output, 'text':output, 'locked':false});
                    }
                  }
                } else if (scope.isOwner) {
                  if (value.indexOf(scope.alertOwnerEmail.split(' ')[0]) == -1) {
                    model.push({'id': output, 'text': output, 'locked': false});
                  } else {
                      console.log('im in here 2');
                    model.push({'id': output + " <ALERT OWNER>", 'text': output + " <ALERT OWNER>", 'locked': true });
                  }
                }
                */

                /*
                if (scope.isOwner) {
                  if (value.indexOf(scope.alertOwnerEmail.split(' ')[0]) == -1) {
                    model.push({'id': output, 'text': output});
                  } else {
                    // need this here to fix bug where if this is a createAlert, this function gets called twice
                    output = (value.indexOf('OWNER') == -1)  ? value + " <ALERT OWNER>" : value;
                    scope.modifiedAlertOwnerEmail = value;
                  }
                } else {
                  try {
                    if (value.indexOf(scope.alertOwnerEmail.split(' ')[0]) == -1) {
                      model.push({'id': value, 'text': value, 'locked': true});
                    } else {
                      // this output statement may not be necessary
                      //output = (value.indexOf('OWNER') == -1)  ? value + " <ALERT OWNER>"  : value;
                      if (value.indexOf('OWNER') == -1) {
                        output = value;
                        model.push({'id': output, 'text': output, 'locked': false });
                      } else {
                        output = value + " <ALERT OWNER>"
                        model.push({'id': output, 'text': output, 'locked': true });
                      }
                      //output = (value.indexOf('OWNER') == -1)  ? value + " <ALERT OWNER>"  : value;
                      scope.modifiedAlertOwnerEmail = value;
                    }
                  } catch (err) {
                    model.push({'id': output, 'text': output});
                  }
                }
                */
              });
          } else {
            model = angular_data;
          }
          return model;
        };

        if (isSelect) {
          // Use <select multiple> instead
          delete opts.multiple;
          delete opts.initSelection;
        } else if (isMultiple) {
          opts.multiple = true;
        }

        if (controller) {
          // Watch the model for programmatic changes
           scope.$watch(tAttrs.ngModel, function(current, old) {
            if (!current) {
              return;
            }
            if (current === old) {
              return;
            }
            controller.$render();
          }, true);
          controller.$render = function () {
            if (isSelect) {
              elm.select2('val', controller.$viewValue);
            } else {
              if (opts.multiple) {
                // Kurt edits
                var viewValue = controller.$viewValue;
                if (angular.isString(viewValue)) {
                  viewValue = viewValue.split(',');
                }
                elm.select2(
                  'data', convertToSelect2Model(viewValue));
              } else {
                if (angular.isObject(controller.$viewValue)) {
                  elm.select2('data', controller.$viewValue);
                } else if (!controller.$viewValue) {
                  elm.select2('data', null);
                } else {
                  elm.select2('val', controller.$viewValue);
                }
              }
            }
          };

          // Watch the options dataset for changes
          if (watch) {
            scope.$watch(watch, function (newVal, oldVal, scope) {
              if (angular.equals(newVal, oldVal)) {
                return;
              }
              // Delayed so that the options have time to be rendered
              $timeout(function () {
                elm.select2('val', controller.$viewValue);
                // Refresh angular to remove the superfluous option
                elm.trigger('change');
                if(newVal && !oldVal && controller.$setPristine) {
                  controller.$setPristine(true);
                }
              });
            });
          }

          // Update valid and dirty statuses
          controller.$parsers.push(function (value) {
            var div = elm.prev();
            div
              .toggleClass('ng-invalid', !controller.$valid)
              .toggleClass('ng-valid', controller.$valid)
              .toggleClass('ng-invalid-required', !controller.$valid)
              .toggleClass('ng-valid-required', controller.$valid)
              .toggleClass('ng-dirty', controller.$dirty)
              .toggleClass('ng-pristine', controller.$pristine);
            return value;
          });

          if (!isSelect) {
            // Set the view and model value and update the angular template manually for the ajax/multiple select2.
            elm.bind("change", function (e) {
              e.stopImmediatePropagation();
              
              if (scope.$$phase || scope.$root.$$phase) {
                return;
              }
              scope.$apply(function () {
                controller.$setViewValue(
                  convertToAngularModel(elm.select2('data')));
              });
            });

            if (opts.initSelection) {
              var initSelection = opts.initSelection;
              opts.initSelection = function (element, callback) {
                initSelection(element, function (value) {
                  var isPristine = controller.$pristine;
                  controller.$setViewValue(convertToAngularModel(value));
                  callback(value);
                  if (isPristine) {
                    controller.$setPristine();
                  }
                  elm.prev().toggleClass('ng-pristine', controller.$pristine);
                });
              };
            }
          }
        }

        elm.bind("$destroy", function() {
          elm.select2("destroy");
        });

        attrs.$observe('disabled', function (value) {
          elm.select2('enable', !value);
        });

        attrs.$observe('readonly', function (value) {
          elm.select2('readonly', !!value);
        });

        if (attrs.ngMultiple) {
          scope.$watch(attrs.ngMultiple, function(newVal) {
            attrs.$set('multiple', !!newVal);
            elm.select2(opts);
          });
        }

        // Initialize the plugin late so that the injected DOM does not disrupt the template compiler
        $timeout(function () {
          elm.select2(opts);

          // Set initial value - I'm not sure about this but it seems to need to be there
          elm.select2('data', controller.$modelValue);
          // important!
          controller.$render();

          // Not sure if I should just check for !isSelect OR if I should check for 'tags' key
          if (!opts.initSelection && !isSelect) {
            var isPristine = controller.$pristine;
            controller.$setViewValue(
              convertToAngularModel(elm.select2('data'))
            );
            if (isPristine) {
              controller.$setPristine();
            }
            elm.prev().toggleClass('ng-pristine', controller.$pristine);
          }
        });
      };
    }
  };
}]);