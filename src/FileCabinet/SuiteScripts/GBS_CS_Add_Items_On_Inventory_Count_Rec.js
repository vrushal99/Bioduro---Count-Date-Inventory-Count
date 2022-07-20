/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
// BEGIN SCRIPT DESCRIPTION BLOCK ==================================
{
    /* 
      Script Name: GBS_CS_Add_Items_On_Inventory_Count_Rec.js
      Author: Palavi 
      Company: Green business/Blue flame labs 
      Date: 27-06-2022 

       
       

      Script Modification Log: 

       
       

      -- version--        -- Date --           -- Modified By --                   --Requested By--                   -- Description -- 
      1.0                  27-06-2022             Palavi                             Palavi Rajgude                   This script will populate the items on inventory count record by checking the check box and as per saved search (Lots Pending Cycle Count)


       
       

      */
}
// END SCRIPT DESCRIPTION BLOCK ====================================

define(["N/search", "N/runtime", "N/record"], function(
    search,
    runtime,
    record
) {
    var binNumber = 0;

    function fieldchange(context) {
        try {
            let currentrecord = context.currentRecord;
            let fieldname = context.fieldId;
            let sublistId = context.sublistId;
            if (fieldname == "custpage_fillbinitems") {
                let check = currentrecord.getValue({
                    fieldId: "custpage_fillbinitems"
                });
                if (check == "true" || check == true) {
                    let classification = currentrecord.getValue({
                        fieldId: "custpage_classification"
                    });
                    let location = currentrecord.getValue({
                        fieldId: "location"
                    });
                    if (_logValidation(classification) || _logValidation(location)) {
                        let searchResultItems = searchForItems(location, classification);

                        if (_logValidation(searchResultItems)) {
                            setItemsOnSublist(searchResultItems, currentrecord);
                        }
                    } else {
                        let searchResultItems = searchForItems(location);
                        if (_logValidation(searchResultItems)) {
                            setItemsOnSublist(searchResultItems, currentrecord);
                        }
                    }
                }
            } else if (fieldname == "item" && sublistId == "item") {
                currentrecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "binnumber",
                    value: binNumber
                });
            }
        } catch (error) {
            log.debug("Error in fieldchanged()", error);
        }
    }
    /**
     * @param  {object} searchResultItems - This contains the search result of items which in form of array of objects
     * @param  {object} currentrecord - This contains currect record object value
     * @param setItemsOnSublist() - This function set the sublist value in inventory count record
     */
    function setItemsOnSublist(searchResultItems, currentrecord) {
        try {
            var linecount = currentrecord.getLineCount({
                sublistId: "item"
            });

            for (let i = 0; i < searchResultItems.length; i++) {

                binNumber = searchResultItems[i].getValue({
                    name: "binnumber",
                    summary: "GROUP",
                    label: "Bin Number"
                });
                log.debug('binNumber', binNumber);
                var lineNumber = currentrecord.findSublistLineWithValue({
                    sublistId: 'item',
                    fieldId: 'binnumber',
                    value: binNumber
                });
                var lineNumber_Item = currentrecord.findSublistLineWithValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: searchResultItems[i].getValue({
                        name: "internalid",
                        join: "item",
                        summary: "GROUP",
                        label: "Internal ID"
                    })
                });
                log.debug('lineNumber', lineNumber);
                log.debug('lineNumber_Item', lineNumber_Item);

                if (lineNumber > -1 && lineNumber_Item > -1) {

                } else {
                    currentrecord.selectLine({
                        sublistId: "item",
                        line: linecount
                    });
                    linecount++;

                    currentrecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        value: searchResultItems[i].getValue({
                            name: "internalid",
                            join: "item",
                            summary: "GROUP",
                            label: "Internal ID"
                        }),
                        forceSyncSourcing: true
                    });

                    currentrecord.commitLine({
                        sublistId: "item"
                    });
                }
            }
        } catch (error) {
            log.debug("Error in setItemsOnSublist()", error);
        }
    }

    /**
     * @param  {integer} location - This contains location internal id
     * @param  {integer} classification - This contains classification internal id
     * @param searchForItems() - This function will return the search result of items based on location and classification criteria
     */
    function searchForItems(location, classification) {
        try {
            let array = _logValidation(classification) ? [
                ["onhand", "greaterthan", "0"],
                "AND", [
                    "inventorynumber.custitemnumber_gbs_next_count_date",
                    "onorbefore",
                    "today"
                ],
                "AND", ["location", "anyof", location],
                "AND", ["item.custitem_gbs_cycle_count_class", "anyof", classification],
                "AND", 
                ["location","noneof","106","108"], 
                "AND", 
                ["binnumber","noneof","1815","1816"]
            ] : [
                ["onhand", "greaterthan", "0"],
                "AND", [
                    "inventorynumber.custitemnumber_gbs_next_count_date",
                    "onorbefore",
                    "today"
                ],
                "AND", ["location", "anyof", location],
                "AND", 
                ["location","noneof","106","108"], 
                "AND", 
                ["binnumber","noneof","1815","1816"]
            ];
            let inventorybalanceSearchObj = search.create({
                type: "inventorybalance",
                filters: [array],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        join: "item",
                        summary: "GROUP",
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "item",
                        summary: "GROUP",
                        sort: search.Sort.ASC,
                        label: "Item"
                    }),
                    search.createColumn({
                        name: "displayname",
                        join: "item",
                        summary: "GROUP",
                        label: "Display Name"
                    }),
                    search.createColumn({
                        name: "binnumber",
                        summary: "GROUP",
                        label: "Bin Number"
                    }),
                    search.createColumn({
                        name: "stockunit",
                        join: "item",
                        summary: "GROUP",
                        label: "Primary Stock Unit"
                    }),
                    search.createColumn({
                        name: "location",
                        summary: "GROUP",
                        label: "Location"
                    }),
                    search.createColumn({
                        name: "custitem_gbs_cycle_count_class",
                        join: "item",
                        summary: "GROUP",
                        label: "Cycle Count Classification"
                    })
                ]
            });
            let searchResult = searchAll(inventorybalanceSearchObj.run());
            log.debug("searchResult", searchResult)
            return searchResult;
        } catch (error) {
            log.debug("Error in searchForItems()", error);
        }
    }

    /**
     * @param _logValidation() - check the value cantains if not cantains then return false
     * @param  {string} value - the string value
     */
    function _logValidation(value) {
        try {
            if (
                value != null &&
                value != "" &&
                value != "null" &&
                value != undefined &&
                value != "undefined" &&
                value != "@NONE@" &&
                value != "NaN"
            ) {
                return true;
            } else {
                return false;
            }
        } catch (e) {
            log.debug({
                title: "Error in _logValidation()",
                details: e
            });
        }
    }

    function searchAll(resultsetCurrent) {
        var allResults = [];
        var startIndex = 0;
        var RANGECOUNT = 1000;
        do {
            var pagedResults = resultsetCurrent.getRange({
                start: parseInt(startIndex),
                end: parseInt(startIndex + RANGECOUNT)
            });
            allResults = allResults.concat(pagedResults);
            var pagedResultsCount = pagedResults != null ? pagedResults.length : 0;
            startIndex += pagedResultsCount;
            var remainingUsage = runtime.getCurrentScript().getRemainingUsage();
        } while (pagedResultsCount == RANGECOUNT);
        var remainingUsage = runtime.getCurrentScript().getRemainingUsage();
        return allResults;
    }
    return {
        fieldChanged: fieldchange
    };
});