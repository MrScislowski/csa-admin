function processCustomerResponses(formUrl) {
  // customerChoices datastructure: 
  // {name=Daniel, shareSize=1.0, vacation=0.0,
  // choices={Okra=1.0, Chard=0.0, Melon=1.0, Mustard greens=2.0}}
  // preference 0 => opt out
  // 1 => get the core vegetable, some desire for elective vegetable
  // 2 => highly desire the elective vegetable
  
  // formInfo datastructure:
  // {title = Week 07, Jun 23 2018,
  //  coreVegetables = [],
  // electiveVegetables = [],
  // herbs = []}
  
  // This function should be called from the form about which you want to generate responses.
  //  var customerForm = FormApp.getActiveForm();
  var customerForm = FormApp.openByUrl(formUrl);
  var formInfo = getFormInfo(customerForm);
  
  // get the document metadata (season, weekNum, csaDate, generatedById)
  var customerFormId = customerForm.getId();
  var filePropertiesList = Drive.Properties.list(customerFormId);
  var curKey;
  for (var i=0; i<filePropertiesList.items.length; i++) {
    curKey = filePropertiesList.items[i].key;
    formInfo[curKey] = Drive.Properties.get(customerFormId, curKey, {visibility:'PUBLIC'}).value;
  }
  // IMPROVE: be more consistent about when the date is an object, and when it's a string. Like the 
  // following line will totally fail if there was no date metadata...
  formInfo["csaDate"] = new Date(formInfo["csaDate"]);
   
  var formResponses = customerForm.getResponses();
  var defaultResponse = makeDefaultResponse(formInfo);
 
  var customerInfoSheetId = "1IcD6jEdXd9TNmLlUgDupUuUucB9epkvDhWkoKytjV1E";
  var customerInfoSheet = SpreadsheetApp.openById(customerInfoSheetId).getSheetByName(formInfo.season);
  var dataRange = customerInfoSheet.getDataRange();
  var dataValues = dataRange.getValues();
  var dataHeader = dataValues.shift();
  
  var nameIndex = dataHeader.indexOf("CustomerName");
  var shareSizeIndex = dataHeader.indexOf("ShareSize");
  var addressIndex = dataHeader.indexOf("DeliveryAddress");
  var coffeeIndex = dataHeader.indexOf("CoffeeExtra");
  var distributionIndex = dataHeader.indexOf("DistributionMethod");
  var instructionsIndex = dataHeader.indexOf("SpecialInstructions");
  
  var customerChoiceList = [];
  for (var i=0; i<dataValues.length; i++) {
    customerChoiceList.push(
      {name:dataValues[i][nameIndex],
       shareSize:dataValues[i][shareSizeIndex],
       deliveryAddress:dataValues[i][addressIndex],
       coffeeExtra:dataValues[i][coffeeIndex],
       distributionMethod:dataValues[i][distributionIndex],
       specialInstructions:dataValues[i][instructionsIndex]});
  }
  
  // sort the customerChoiceList by name
  customerChoiceList.sort(compareName);
 
  // sort the formResponses by name
  formResponses.sort(compareFormResponseName);
  
  // go through one-by-one and see if the customer in customerChoiceList 
  //filled out a preferences form. If they did, update all the attributes in their object. If they didn't, set all the attributes to default
  var curResponseName;
  var f=0;
  for (var c=0; c<customerChoiceList.length; c++) {
    curResponseName = formResponses[f].getItemResponses()[nameItemIdx].getResponse();
    if (f < formResponses.length && customerChoiceList[c].name == curResponseName) {
      setCustomerChoiceToFormResponse(customerChoiceList[c], formResponses[f]);
      f++;
    } else {
      setCustomerChoiceToDefault(customerChoiceList[c], defaultResponse);
    }
  }
    
  // when building the table we want full shares then half shares I think... (maybe change the share-size part?)
  customerChoiceList.sort(compareShareSizeThenName);
  
  // IMPROVE: Check that file doesn't already exist before creating another one ...?
  
  allocationSheet = SpreadsheetApp.create(DriveApp.getFileById(customerForm.getId()).getName() +
                                          "AllocationSheet");
  //*******************WRITE ALLOCATION SPREADSHEET************************************************************************************
  // delete next line when in designated function
  var choicesList = customerChoiceList;
  var headerList = formInfo.coreVegetables.concat(formInfo.electiveVegetables).concat(formInfo.herbs);
  var headerRange = allocationSheet.getRange("R1C2:R1C" + (1+headerList.length));
  headerRange.setValues([headerList]);
  var customerList = [];
  for (i=0; i<choicesList.length; i++) {
    customerList.push([choicesList[i].name]);
  }
  var customerRange = allocationSheet.getRange("R2C1:R" + (1+customerList.length) + "C1");
  customerRange.setValues(customerList);
  
  var curRow, curVal;
  var bigData = [];
  var debugVariables;
  // let's fill this up row-by-row
  for (var c=0; c<customerList.length; c++) {
    curRow=[];
    for (var h=0; h<headerList.length; h++) {
      curVal = choicesList[c].choices[headerList[h]];
      debugVariables = [headerList[h], choicesList[c]];
      if (curVal == 0) {
        curRow.push("✘");
      } else if (curVal == 2) {
        curRow.push("✰");
      } else if (formInfo.coreVegetables.indexOf(headerList[h]) != -1) {
        curRow.push('☐');
      } else {
        curRow.push("");
      }
    }
    bigData.push(curRow);
  }
  bigDataRange = allocationSheet.getRange("R2C2:R" + (1+customerList.length) + "C" + (1+headerList.length));
  bigDataRange.setValues(bigData);
  //**********************************************************************************************************
  
  //************************MAKE PACKING SLIPS ******************************************************************
  var choicesList = customerChoiceList;
  var templateFileId = "1wnLWu1v4XUdWPGBWkF0O4wCnvsJHRFhoA61LL__LPcQ";
  var customerFormId = customerForm.getId();
  
  // create the document
  var packingSlipsDoc = DocumentApp.create(DriveApp.getFileById(customerForm.getId()).getName() +
                                           "PackingSlips");
  var masterDocBody = packingSlipsDoc.getBody();
  // 22 pt ~= 0.3 in
  masterDocBody.setMarginTop(22);
  masterDocBody.setMarginBottom(22);
  masterDocBody.setMarginLeft(22);
  masterDocBody.setMarginRight(22);
  
  var templateTable = DocumentApp.openById(templateFileId).getBody().findElement(DocumentApp.ElementType.TABLE).getElement().asTable();
  
  for (var c=0; c<choicesList.length; c++) {
    var curTable = masterDocBody.appendTable(templateTable.copy());
    // Insert CSA details for this week
    curTable.replaceText('\\$\\{Season\\}', formInfo.season);
    curTable.replaceText('\\$\\{WeekNumber\\}', formInfo.weekNum);
    curTable.replaceText('\\$\\{Date\\}', formInfo.csaDate.toDateString());
    
    // Insert Customer Info
    curTable.replaceText('\\$\\{CustomerName\\}', choicesList[c].name);
    curTable.replaceText('\\$\\{DeliveryAddress\\}', choicesList[c].deliveryAddress);
    curTable.replaceText('\\$\\{CoffeeExtra\\}', (choicesList[c].coffeeExtra)? "☐ coffee" : "");
    curTable.replaceText('\\$\\{DistributionMethod\\}', choicesList[c].distributionMethod);
    curTable.replaceText('\\$\\{ShareSize\\}', (choicesList[c].shareSize == 0.5)? "Half" : "Full");
    curTable.replaceText('\\$\\{SpecialInstructions\\}', choicesList[c].specialInstructions);

    var coreVegReplacementText = "";
    for (v=0; v<formInfo.coreVegetables.length; v++) {
      if (choicesList[c].choices[formInfo.coreVegetables[v]]) {
        coreVegReplacementText += ("☐ " + formInfo.coreVegetables[v]);
      } else {
        coreVegReplacementText += ("✘ " + formInfo.coreVegetables[v]);
      }
      coreVegReplacementText += "\n";
    }
    curTable.replaceText('\\$\\{CoreVegetables\\}', coreVegReplacementText);
    
    var electiveVegReplacementText = "";
    for (v=0; v<formInfo.electiveVegetables.length; v++) {
      if (choicesList[c].choices[formInfo.electiveVegetables[v]]) {
        electiveVegReplacementText += ("☐ " + formInfo.electiveVegetables[v]);
      } else {
        electiveVegReplacementText += ("✘ " + formInfo.electiveVegetables[v]);
      }
      electiveVegReplacementText += "\n";
    }
    curTable.replaceText('\\$\\{ElectiveVegetables\\}', electiveVegReplacementText);
    
    var herbsReplacementText = "";
    for (v=0; v<formInfo.herbs.length; v++) {
      if (choicesList[c].choices[formInfo.herbs[v]]) {
        herbsReplacementText += ("☐ " + formInfo.herbs[v]);
      } else {
        herbsReplacementText += ("✘ " + formInfo.herbs[v]);
      }
      herbsReplacementText += "\n";
    }
    curTable.replaceText('\\$\\{Herbs\\}', herbsReplacementText);

    
//    // IMPROVE: this text is ugly and hacky
//    var matchPos = curTable.findText("\\$\\{CoreVegetables\\}");
//    var matchText = matchPos.getElement().asText();
//    matchText.deleteText(matchPos.getStartOffset(), matchPos.getEndOffsetInclusive());
//    var startPos = matchPos.getStartOffset();
//    var newText;
//    for (var v=0; v<formInfo.coreVegetables.length; v++) {
//      newText = "☐ " + formInfo.coreVegetables[v];
//      matchText.appendText(newText);
//      if (choicesList[c].choices[formInfo.coreVegetables[v]] == 0) {
//        matchText.setStrikethrough(startPos, startPos + newText.length, true);
//      } else {
//        matchText.setStrikethrough(startPos, startPos + newText.length, false);
//      }
//      matchText.appendText('\n');
//      startPos += newText.length + 1;
//    }

    masterDocBody.appendPageBreak();
  }
}


function getFormInfo(theForm) {
  var retVal={};
  retVal.title = theForm.getTitle();
  var formItems = theForm.getItems();
  var coreVegetables = formItems[coreVegItemIdx].asGridItem().getRows();
  retVal.coreVegetables = coreVegetables;
  var electiveVegetables = formItems[electiveVegItemIdx].asGridItem().getRows();
  retVal.electiveVegetables = electiveVegetables;
  var herbs = formItems[herbItemIdx].asGridItem().getRows();
  retVal.herbs = herbs;

  return retVal;
}

function setCustomerChoiceToFormResponse(customerChoice, formResponse) {
  var itemList = formResponse.getItemResponses();
  
  var vegetables, herbs, ratings, vacation;
  
  customerChoice.choices = {};
  vegetables = itemList[coreVegItemIdx].getItem().asGridItem().getRows();
  ratings = itemList[coreVegItemIdx].getResponse();
  vacation = itemList[vacationItemIdx].getResponse();
  for (var i=0; i<vegetables.length; i++) {
    if (vacation == "Yes" || ratings[i] == "Opt-out") {
      customerChoice.choices[vegetables[i]] = 0;
    } else
      customerChoice.choices[vegetables[i]] = 1;
  }
  
  vegetables = itemList[electiveVegItemIdx].getItem().asGridItem().getRows();
  ratings = itemList[electiveVegItemIdx].getResponse();
  for (var i=0; i<vegetables.length; i++) {
    if (vacation == "Yes" || ratings[i] == "No desire") {
      customerChoice.choices[vegetables[i]] = 0;
    } else if (ratings[i] == "Strong desire") {
      customerChoice.choices[vegetables[i]] = 2;
    } else {
      customerChoice.choices[vegetables[i]] = 1;
    }
  }
  
  herbs = itemList[herbItemIdx].getItem().asGridItem().getRows();
  ratings = itemList[herbItemIdx].getResponse();
  for (var i=0; i<herbs.length; i++) {
    if (vacation == "Yes" || ratings[i] == "Pass Up") {
      customerChoice.choices[herbs[i]] = 0;
    } else
      customerChoice.choices[herbs[i]] = 2;
  }
}

function setCustomerChoiceToDefault(customerChoice, defaultResponse) {
  customerChoice.choices = defaultResponse.choices;
}
        
function makeDefaultResponse(formInfo) {
  var response = {};
  response.name = "";
  response.shareSize = 0;
  response.vacation = 0;
  response.choices={};
  coreVegList = formInfo.coreVegetables;
  electiveVegList = formInfo.electiveVegetables;
  herbList = formInfo.herbs;
  for (var i=0; i<coreVegList.length; i++) {
    response.choices[coreVegList[i]] = 1;
  }
  for (var i=0; i<electiveVegList.length; i++) {
    response.choices[electiveVegList[i]] = 1;
  }
  for (var i=0; i<herbList.length; i++) {
    response.choices[herbList[i]] = 0;
  }
  
  return response;
}
  

function compareShareSizeThenName(a, b) {
  if (a.shareSize === b.shareSize) {
    return a.name.localeCompare(b.name);
  } else {
    // we actually want full shares first... that's why we're doing it this way
    return -a.shareSize + b.shareSize;
  }
}

function compareName(a, b) {
    return a.name.localeCompare(b.name);
}

function compareFormResponseName(a, b) {
  // IMPROVE: it seems a bit unstable to assume that the first question is always name, etc. But I think I'd have to pass around ItemIds between scripts otherwise...
  aName=a.getItemResponses()[nameItemIdx].getResponse();
  bName=b.getItemResponses()[nameItemIdx].getResponse();
  return aName.localeCompare(bName);
}