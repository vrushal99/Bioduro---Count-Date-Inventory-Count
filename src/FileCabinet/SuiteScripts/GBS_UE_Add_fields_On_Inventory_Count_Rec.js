/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
// BEGIN SCRIPT DESCRIPTION BLOCK ================================== 
{
    /* 
    Script Name: GBS_UE_Add_fields_On_Inventory_Count_Rec.js
    Author: Palavi 
    Company: Green business/Blue flame labs 
    Date: 27-06-2022 

     
     

    Script Modification Log: 

     
     

    -- version--        -- Date --           -- Modified By --                   --Requested By--                   -- Description -- 
    1.0                  27-06-2022             Palavi                             Palavi Rajgude                   This script will add the classification named field which is select field and fill bin items named field which is check box field on inventory count record



     
     

    */
}
// END SCRIPT DESCRIPTION BLOCK ==================================== 
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