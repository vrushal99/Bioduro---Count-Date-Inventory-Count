/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

// BEGIN SCRIPT DESCRIPTION BLOCK ==================================

{
  /* 
  Script Name: gbs_bioduro_updateInvntCount.js 
  Author: Palavi Rajgude
  Company: Green Business Systems
  Date: 05-07-2022 
  
  Script Modification Log: 
  
  -- version--        -- Date --      -- Modified By --      --Requested By--         -- Description -- 
  version 1           dd-mm-yyyy        Modifier Name     Requested by Name     short Description of the script 
   
  */
}

// END SCRIPT DESCRIPTION BLOCK ====================================

define(["N/record", "N/search", "N/format", "N/runtime"], /**
 * @param  {object} search - search result
 * @param  {object} record - Access all current record information
 * @param  {object} format - parse formatted data
 * @param  {object} runtime -  view runtime settings for the script
 */
function (record, search, format, runtime) {
  /**
   * @param  {object} context - The context object contains the records related data
   */
  function beforeLoad(context) {

    try{
    var newRecord = context.newRecord;

    //get inventory count record status
    let getInventoryCountStatus = newRecord.getValue({
      fieldId: "status",
    });

    //if invenotry count record status is 'Approved' then aftersubmit function will execute
    if (
      getInventoryCountStatus == "Approved" &&
      _logValidation(getInventoryCountStatus)
    ) {
      afterSubmit(context);
    }

    return true;
  }
  catch(e){
    log.debug('error in beforeLoad', e.toString());
  }
  }

  /**
   * Defines the function definition that is executed after record is submitted.
   * @param {Object} context - The context object contains the records related data
   * @param {Record} context.newRecord - New record
   * @since 2015.2
   */
  function afterSubmit(context) {

    try{
    var newRecord = context.newRecord;

    var getInventoryCountId = context.newRecord.id;

    //call 'inventoryCountSearch' function to get data from inventory count record
    var searchResultInv = inventoryCountSearch(getInventoryCountId);

    if (_logValidation(searchResultInv)) {
      //call 'approveDate' function to get today date and system note date from inventory count record
      var { systemNoteDate, todayDate } = approveDate(searchResultInv);

      //if condition is use to check today date and system note date is equal or not
      if (todayDate == systemNoteDate) {
      var itemIdArr = [];
      var binArr = [];
      let getLineCountItem = newRecord.getLineCount({
        sublistId: "item",
      });
      var location = newRecord.getValue({
        fieldId: "location",
      });

      var inventoryCountObj = {
        getLineCountItem: getLineCountItem,
        newRecord: newRecord,
        itemIdArr: itemIdArr,
        binArr: binArr,
      };

      //call 'inventoryCountItem' to push item id and bin to array
      inventoryCountItem(inventoryCountObj);

      var lotNumberObj = {
        itemIdArr: itemIdArr,
        todayDate: todayDate,
        location: location,
        binArr: binArr,
      };

      //call 'lotNumberSearch' function to get data from lot number record
      var searchResult = lotNumberSearch(lotNumberObj);

      // var remainingUsage = runtime.getCurrentScript().getRemainingUsage();
      //log.debug(remainingUsage);
      if (_logValidation(searchResult)) {
        for (let i = 0; i < searchResult.length; i++) {
          let getItemId = searchResult[i].getValue({
            name: "internalid",
            join: "inventoryNumber",
            label: "Internal ID",
          });

          // let invDateCreated = searchResult[i].getValue({
          //   name: "datecreated",
          //   join: "inventoryNumber",
          //   label: "Date Created",
          // });

          let cycleCount = searchResult[i].getValue({
            name: "custitem_gbs_cycle_count_interval",
            label: "Cycle Count Interval (Days)",
          });

          if (_logValidation(getItemId)) {
            let loadItemNumberRecord = record.load({
              type: "inventorynumber",
              id: getItemId,
            });

            var setDateOnLotObj = {
              loadItemNumberRecord: loadItemNumberRecord,
              // invDateCreated: invDateCreated,
              todayDate: todayDate,
              cycleCount: cycleCount,
            };

            //call 'setDateOnLotNumber' function to set last count date, next count date, lot receipt date on lot number record
            setDateOnLotNumber(setDateOnLotObj);

            loadItemNumberRecord.save();
            log.debug("getItemId updated successfuly ID:", getItemId);
          }
        }
      }
      }
    }
  }
  catch(e){
    log.debug('error in afterSubmit', e.toString());
  }
  }
  
  /**
   * @param  {object} searchResultInv - search result of inventory record
   */
  function approveDate(searchResultInv) {
    
    try{
    //get system note date from inventory count record for approved status
    let systemNoteDate = searchResultInv[0].getValue({
      name: "date",
      join: "systemNotes",
      label: "Date",
    });
    systemNoteDate = new Date(systemNoteDate);

    systemNoteDate =
      systemNoteDate.getMonth() +
      1 +
      "/" +
      systemNoteDate.getDate() +
      "/" +
      systemNoteDate.getFullYear();

    var todayDate = new Date();
    todayDate =
      todayDate.getMonth() +
      1 +
      "/" +
      todayDate.getDate() +
      "/" +
      todayDate.getFullYear();

    return { systemNoteDate, todayDate };
  }
  catch(e){
    log.debug('error in approveDate', e.toString());
  }
  }

  /**
   * @param  {number} getInventoryCountId - inventory count id pass to search for inventory count record result
   */
  function inventoryCountSearch(getInventoryCountId) {
    try{
    var inventorycountSearch = search.create({
      type: "inventorycount",
      filters: [
        ["type", "anyof", "InvCount"],
        "AND",
        ["internalid", "anyof", getInventoryCountId],
        "AND",
        ["systemnotes.newvalue", "startswith", "Approved"],
        "AND",
        ["mainline", "is", "T"],
      ],
      columns: [
        search.createColumn({
          name: "newvalue",
          join: "systemNotes",
          label: "New Value",
        }),
        search.createColumn({
          name: "date",
          join: "systemNotes",
          label: "Date",
        }),
      ],
    });

    var inventorycountSearchResults = inventorycountSearch
      .run()
      .getRange(0, 1000);

    return inventorycountSearchResults;
  }
  catch(e){
    log.debug('error in inventoryCountSearch', e.toString());
  }
  }
  /**
   * @param  {object} setDateOnLotObj - pass parameter to set last count date, next count date, lot receipt date on lot number record
   */
  function setDateOnLotNumber(setDateOnLotObj) {
    try{
    var { loadItemNumberRecord, todayDate, cycleCount } =
      setDateOnLotObj;

    //set lot number record created date on lot receipt date field
    // loadItemNumberRecord.setValue({
    //   fieldId: "custitemnumber_gbs_lot_receipt_date",
    //   value: new Date(invDateCreated),
    // });

    //set approved date on last count date field in lot number record
    loadItemNumberRecord.setValue({
      fieldId: "custitemnumber_gbs_last_count_date",
      value: new Date(todayDate),
    });

    todayDate = new Date(todayDate);

      if (_logValidation(cycleCount)) {

        //add cycle count interval value to next count date field in lot number record
        new Date(todayDate.setDate(todayDate.getDate() + parseInt(cycleCount)));

      let todayDateStr =
        todayDate.getMonth() +
        1 +
        "/" +
        todayDate.getDate() +
        "/" +
        todayDate.getFullYear();


      var nextCountDate = format.parse({
        type: format.Type.DATE,
        value: todayDateStr,
      });

      //set next count date on next count date field in lot number record
      loadItemNumberRecord.setValue({
        fieldId: "custitemnumber_gbs_next_count_date",
        value: nextCountDate,
      });
    }
  }
  catch(e){
    log.debug('error in setDateOnLotNumber', e.toString());
  }
  }

  /**
   * @param  {object} lotNumberObj - pass parameter to get data inventory item record
   */
  function lotNumberSearch(lotNumberObj) {
    try{
    
    var { itemIdArr, todayDate, location, binArr } = lotNumberObj;

    var inventoryitemSearchObj = search.create({
      type: "inventoryitem",
      filters: [
        ["type", "anyof", "InvtPart"],
        "AND",
        ["internalid", "anyof", itemIdArr],
        "AND",
        ["inventorynumber.location", "anyof", location],
        //"AND",
        //["binnumber.internalid", "anyof", binArr]
      ],
      columns: [
        search.createColumn({
          name: "internalid",
          join: "inventoryNumber",
          label: "Internal ID",
        }),
        search.createColumn({
          name: "custitem_gbs_cycle_count_interval",
          label: "Cycle Count Interval (Days)",
        }),
        search.createColumn({
          name: "datecreated",
          join: "inventoryNumber",
          label: "Date Created",
        }),
        search.createColumn({
          name: "custitemnumber_gbs_last_count_date",
          join: "inventoryNumber",
          label: "Last Count Date",
        }),
        search.createColumn({
          name: "custitemnumber_gbs_lot_receipt_date",
          join: "inventoryNumber",
          label: "Lot Receipt Date",
        }),
        search.createColumn({
          name: "custitemnumber_gbs_next_count_date",
          join: "inventoryNumber",
          label: "Next Count Date",
        }),
      ],
    });

    var inventoryitemSearchObjResults = inventoryitemSearchObj
      .run()
      .getRange(0, 1000);
    var array = [];

    for (let i = 0; i < inventoryitemSearchObjResults.length; i++) {
      
      let lotDate = inventoryitemSearchObjResults[i].getValue({
        name: "custitemnumber_gbs_last_count_date",
        join: "inventoryNumber",
        label: "Last Count Date",
      });
      array.push(lotDate);
    }

    if (array.every((e) => e == todayDate)) {
      return;
    }
    return inventoryitemSearchObjResults;
  }
  catch(e){
    log.debug('error in lotNumberSearch', e.toString());
  }
  }
  /**
   * @param  {object} inventoryCountObj - pass parameter to get data inventory count record
   */
  function inventoryCountItem(inventoryCountObj) {
    try{

    var { getLineCountItem, newRecord, itemIdArr, binArr } = inventoryCountObj;

    for (var i = 0; i < getLineCountItem; i++) {
      let getInventoryCountItemId = newRecord.getSublistValue({
        sublistId: "item",
        fieldId: "item",
        line: i,
      });
      let binNumber = newRecord.getSublistValue({
        sublistId: "item",
        fieldId: "binnumber",
        line: i,
      });


      itemIdArr.push(getInventoryCountItemId);
      binArr.push(binNumber);
    }
  }
  catch(e){
    log.debug('error in inventoryCountItem', e.toString());
  }
  }

  
  /**
   * @param  {number} value - pass parameter to check value is defined or not
   */
  function _logValidation(value) {
    try{
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
  }
  catch(e){
    log.debug('error in _logValidation', e.toString());
  }
  }

  return {
    beforeLoad: beforeLoad,
    afterSubmit: afterSubmit,
  };
});
