/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function(serverWidget) {
    function beforeLoad(context) {
        try {
            let form = context.form;
            let field_select = form.addField({
                id: 'custpage_classification',
                label: 'CLASSFICATION',
                type: serverWidget.FieldType.SELECT
            });
            field_select.addSelectOption({ value: '', text: '' });
            field_select.addSelectOption({ value: '1', text: 'A' });
            field_select.addSelectOption({ value: '2', text: 'B' });
            field_select.addSelectOption({ value: '3', text: 'C' });
            let field_checkbox = form.addField({
                id: 'custpage_fillbinitems',
                label: 'Fill Bin Items',
                type: serverWidget.FieldType.CHECKBOX
            })
        } catch (e) {
            log.debug("Error in beforeLoad()", e)
        }
    }
    return {
        beforeLoad: beforeLoad
    }
})