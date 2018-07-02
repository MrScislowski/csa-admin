function generateCustomerPreferencesForm() {
  // get info from staff form ----------------------------------------------------
  var staffFormId = "18ai-BbiwQsI_-bpoSjwKnaCYdph2or1YIeom0_I_1jI";
  var staffForm = FormApp.openById(staffFormId);
  var staffResponseList = staffForm.getResponses();
  var thisWeek = staffResponseList.slice(-1)[0]; // get the last element; throw error if there aren't any...
  //thisWeek = thisWeek.getGradableItemResponses();
  
  var staffFormItems = {
    "Season":15499318,
    "Week Number":1212067551,
    "Date":101295999,
    "Core Vegetables":1651692200,
    "Elective Vegetables":416961828,
    "Herbs":624754911
  };
  var season = thisWeek.getResponseForItem(staffForm.getItemById(staffFormItems["Season"])).getResponse();
  var weekNum = thisWeek.getResponseForItem(staffForm.getItemById(staffFormItems["Week Number"])).getResponse();
  var rawDate = thisWeek.getResponseForItem(staffForm.getItemById(staffFormItems["Date"])).getResponse();
  var date = new Date(rawDate + "T12:00:00");
  var coreVegetables = thisWeek.getResponseForItem(staffForm.getItemById(staffFormItems["Core Vegetables"])).getResponse();
  var electiveVegetables = thisWeek.getResponseForItem(staffForm.getItemById(staffFormItems["Elective Vegetables"])).getResponse();
  var herbs = thisWeek.getResponseForItem(staffForm.getItemById(staffFormItems["Herbs"])).getResponse();
  Logger.log([season, weekNum, rawDate, date, coreVegetables, electiveVegetables, herbs]);
  
  // get info from customers form -------------------------------------------------------
  var customerInfoSheetId = "1IcD6jEdXd9TNmLlUgDupUuUucB9epkvDhWkoKytjV1E";
  var customerInfoSheet = SpreadsheetApp.openById(customerInfoSheetId).getSheets()[0];
  
  var dataRange = customerInfoSheet.getDataRange();
  var dataValues = dataRange.getValues();
  var dataHeader = dataValues.shift();
  
  var colIndex = dataHeader.indexOf("CustomerName");
  var customerNameList = [];
  for (var i=0; i<dataValues.length; i++) {
    customerNameList.push(dataValues[i][colIndex]);
  }
  
  // create form based on collected info ----------------------------------------------
  var customerFormFilename = "Week " + ("0" + weekNum).slice(-2);
  var customerFormTitle = "Week " + ("0" + weekNum).slice(-2) + ": " + 
    date.toLocaleDateString("en-US", {month:'long', day:'numeric', year:'numeric'});
  
  var formAlreadyExists = DriveApp.getFilesByName(customerFormFilename).hasNext();
  if (formAlreadyExists) {
    Logger.log("Form  \"" + customerFormFilename + "\" already exists -- please remove and try again " );
    return 1;
  }
  
  var customerForm = FormApp.create(customerFormFilename);
  var customerFormId = customerForm.getId();
  
  // add the properties to the form; things that aren't going to be saved in the responses or questions themselves
  Drive.Properties.insert({key:"season", value:season, visibility:'PUBLIC'}, customerFormId);
  Drive.Properties.insert({key:"weekNum", value:weekNum, visibility:'PUBLIC'}, customerFormId);
  Drive.Properties.insert({key:"csaDate", value:date, visibility:'PUBLIC'}, customerFormId);
  Drive.Properties.insert({key:"generatedById", value:staffFormId, visibility:'PUBLIC'}, customerFormId);
  
  customerForm.setTitle(customerFormTitle);
  var selectName = customerForm.addListItem();
  selectName.setTitle('Name')
  .setHelpText('Please select your name from the list below:')
  .setChoiceValues(customerNameList)
  .setRequired(true);
  var takeVacation = customerForm.addMultipleChoiceItem();
  takeVacation.setTitle('Vacation')
  .setHelpText('Do you want to take a vacation this week? (If you select "Yes", you can submit and ignore the rest of this form)')
  .setChoiceValues(['Yes', 'No'])
  .setRequired(true);
  
  defaultResponses = customerForm.createResponse();
  
  var coreVegOptOut = customerForm.addGridItem();
  coreVegOptOut.setTitle('Core Vegetables Opt-out')
  .setHelpText('Select whether you want to opt out of any core vegetables this week:')
  .setColumns(['Opt-out', 'Receive'])
  .setRows(coreVegetables)
  .setRequired(true);
  // doesn't support ES6 yet, so can't use: .createResponse(Array(coreVegetables.length).fill('Receive'))
  defaultResponses.withItemResponse(coreVegOptOut.createResponse(
    Array.apply(null, Array(coreVegetables.length)).map(function(){return "Receive"})));
  
  var electiveVegRank = customerForm.addGridItem();
  electiveVegRank.setTitle('Elective Vegetables')
  .setHelpText("Indicate which of the following vegetables you'd most like to receive")
  .setColumns(['No desire', 'Some desire', 'Strong desire'])
  .setRows(electiveVegetables)
  .setRequired(true);
  defaultResponses.withItemResponse(electiveVegRank.createResponse(
    Array.apply(null, Array(electiveVegetables.length)).map(function(){return "Some desire"})));
  
  var herbOptIn = customerForm.addGridItem();
  herbOptIn.setTitle('Herb Requests')
  .setHelpText('Do you want to request any herbs this week? (NB: limited supply)')
  .setColumns(['Pass Up', 'Request'])
  .setRows(herbs)
  .setRequired(true);
  defaultResponses.withItemResponse(herbOptIn.createResponse(
    Array.apply(null, Array(herbs.length)).map(function(){return "Pass Up"})));
  
  // Returns... 
  // {formEditUrl="...",
  //  formPrefilledUrl="...",
  //  success=true,
  //  errorMessage="..."}
  
  var returnVal = {
    formFilename:customerFormFilename,
    formTitle:customerFormTitle,
    formEditUrl:customerForm.getEditUrl(),
    formPrefilledUrl:defaultResponses.toPrefilledUrl(),
    success:true,
    errorMessage:""};
  
  // TODO: move this to a logging function, probably in the container doc so we can choose where to put this stuff...
  var logSheet = SpreadsheetApp.openById('1Cm-lwMl7vC6bf-GDE_ApEK-rbDz5AdMkQv5vZNcS2nM').getSheetByName("Forms");
  var oldDataRange = logSheet.getDataRange();
  var newRowRange = logSheet.getRange(oldDataRange.getLastRow()+1, oldDataRange.getColumn(), 1, oldDataRange.getLastColumn()-oldDataRange.getColumn()+1);
  var dataHeader = oldDataRange.getValues().shift();
  var newRowValues = [];
  for (var i=0; i<dataHeader.length; i++) {
    if (returnVal.hasOwnProperty(dataHeader[i])) {
      newRowValues.push(returnVal[dataHeader[i]]);
    } else {
      newRowValues.push("");
    }
  }
  
  newRowRange.setValues([newRowValues]);
  
  return returnVal;
}
    
    
