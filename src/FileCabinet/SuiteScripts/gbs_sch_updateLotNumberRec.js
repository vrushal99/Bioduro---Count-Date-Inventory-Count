/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

// BEGIN SCRIPT DESCRIPTION BLOCK ==================================

{
  /* 
  Script Name: gbs_sch_updateLotNumberRec.js 
  Author: Palavi Rajgude
  Company: Green Business Systems
  Date: 13-07-2022 
  
  Script Modification Log: 
  
  -- version--        -- Date --      -- Modified By --      --Requested By--         -- Description -- 
  version 1.0.0        13-07-2022       Palavi Rajgude         Megan Kelly            Script Update to Lot NumberRe Record for Set Lot Receipt Date and Next Count Date if both are blank. 
   
  */
}

// END SCRIPT DESCRIPTION BLOCK ====================================

define(["N/record", "N/search", "N/format"], /**
 * @param  {object} search - search result
 * @param  {object} record - Access all current record information
 * @param  {object} format - parse formatted data
 */
function (record, search, format) {
  /**
   * @param  {function} execute - entry point function execute scheduled script
   */


  function execute() {
    try {
      //get all the lot number records from search results
      var searchResultInv = lotNumberSearch();

      //   log.debug('searchResultInv', searchResultInv);

      if (_logValidation(searchResultInv)) {
        let searchResultLength = searchResultInv.length;

        for (let i = 0; i < searchResultLength; i++) {
          let getDateCreated = searchResultInv[i].getValue({
            name: "datecreated",
            label: "Date Created"
          });
          // log.debug('getDateCreated', getDateCreated);

          getDateCreated = new Date(getDateCreated);

          let setLotReceiptDate = getDateCreated;

          getDateCreated = String(getDateCreated);

          let getInternalId = searchResultInv[i].getValue({
            name: "internalid",
            label: "Internal ID"
          });


          let getNextCountDate = searchResultInv[i].getValue({
            name: "custitemnumber_gbs_next_count_date",
            label: "Next Count Date"
          });
          // log.debug('getNextCountDate', getNextCountDate);

          //check if next count date is null or empty
          if (getNextCountDate == "" || getNextCountDate == null) {
            //get the cycle cout interval field value from item record
            let cycleCount = searchResultInv[i].getValue({
              name: "custitem_gbs_cycle_count_interval",
              join: "item",
              label: "Cycle Count Interval (Days)"
            });

            if (_logValidation(cycleCount)) {
            
              //add lot receipt date value to next count date field in lot number record
              let addCycleLotReceipt = new Date(
                setLotReceiptDate.setDate(
                  setLotReceiptDate.getDate() + parseInt(cycleCount)
                )
              );

              let todayDateStr =
              addCycleLotReceipt.getMonth() +
                1 +
                "/" +
                addCycleLotReceipt.getDate() +
                "/" +
                addCycleLotReceipt.getFullYear();

           
              //format the date in date format
              let nextCountDate = format.parse({
                type: format.Type.DATE,
                value: todayDateStr
              });
              //   log.debug('nextCountDate', nextCountDate);

              nextCountDate = new Date(nextCountDate);
             
              getDateCreated = new Date(getDateCreated);
              //set next count date to the lot number record on next count date field
              record.submitFields({
                type: "inventorynumber",
                id: getInternalId,
                values: {
                  custitemnumber_gbs_lot_receipt_date: getDateCreated,
                  custitemnumber_gbs_next_count_date: nextCountDate
                }
              });
            }
          }
          else{
            
          getDateCreated = new Date(getDateCreated);
          //set created date to the lot number record on lot receipt date field
          record.submitFields({
            type: "inventorynumber",
            id: getInternalId,
            values: {
              custitemnumber_gbs_lot_receipt_date: getDateCreated
            }
          });

          }
        }
      }
    } catch (e) {
      log.debug("error in afterSubmit", e.toString());
    }
  }

  /**
   * @param  {function} lotNumberSearch - search for lot number records which has lot receipt date field empty
   */
  function lotNumberSearch() {
    try {
 
      var inventorynumberSearchObj = search.create({
        type: "inventorynumber",
        filters: [
          ["custitemnumber_gbs_lot_receipt_date", "isempty", ""]
        ],
        columns: [
          search.createColumn({
            name: "custitemnumber_gbs_lot_receipt_date",
            label: "Lot Receipt Date"
          }),
          search.createColumn({
            name: "custitemnumber_gbs_next_count_date",
            label: "Next Count Date"
          }),
          search.createColumn({
            name: "custitem_gbs_cycle_count_interval",
            join: "item",
            label: "Cycle Count Interval (Days)"
          }),
          search.createColumn({ name: "datecreated", label: "Date Created" }),
          search.createColumn({ name: "internalid", label: "Internal ID" })
        ]
      });

      var inventorynumberSearchResults = inventorynumberSearchObj
        .run()
        .getRange(0, 1000);

      // log.debug('inventorynumberSearchResults', inventorynumberSearchResults);

      return inventorynumberSearchResults;
    } catch (e) {
      log.debug("error in inventoryCountSearch", e.toString());
    }
  }

  /**
   * @param  {number} value - pass parameter to check value is defined or not
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
      log.debug("error in _logValidation", e.toString());
    }
  }

  return {
    execute: execute
  };
});
