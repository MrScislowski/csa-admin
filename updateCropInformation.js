function updateCropInformation() {
  var infoSheetFileId = "1cDnvklKb-hYss7AgU4q-niOPoFvm97KMsnYe6_rZnpY";
  var staffFormFileId = "18ai-BbiwQsI_-bpoSjwKnaCYdph2or1YIeom0_I_1jI";
  
  var infoSheet = SpreadsheetApp.openById(infoSheetFileId).getSheets()[0];
  var staffForm = FormApp.openById(staffFormFileId);
  
  // This is the questions that the form consists of:
  //  1. Week number; id = 1212067551
  //  2. Date; id = 101295999
  //  3. Core Vegetables; id = 1651692200
  //  4. Elective Vegetables; id = 416961828
  //  5. Herbs; id = 624754911

  var coreVegItem = staffForm.getItemById(1651692200).asCheckboxItem();
  var electiveVegItem = staffForm.getItemById(416961828).asCheckboxItem();
  var herbItem = staffForm.getItemById(624754911).asCheckboxItem();
  
  // now I can use coreVegItem.setChoiceValues( ... ); where ... is an array of string choices.
  var dataRange = infoSheet.getDataRange();
  var dataValues = dataRange.getValues();
  var dataHeader = dataValues.shift();
  
  var cropNameIndex = dataHeader.indexOf("CropName");
  var cropTypeIndex = dataHeader.indexOf("CropType");
  var vegList = [];
  var herbList = [];
  var cropRow;
  for (var i=0; i<dataValues.length; i++) {
    cropRow = dataValues[i];
    if (cropRow[cropTypeIndex] == "Vegetable") {
      vegList.push(cropRow[cropNameIndex]);
    } else if (cropRow[cropTypeIndex] == "Herb") {
      herbList.push(cropRow[cropNameIndex]);
    }
  }
  
  coreVegItem.setChoiceValues(vegList);
  electiveVegItem.setChoiceValues(vegList);
  herbItem.setChoiceValues(herbList);
}
