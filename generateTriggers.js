function generateTriggers() {
  var fileID, file, triggers;
  
  // CustomerInfo
  // remove all existing triggers
  fileID = '1cDnvklKb-hYss7AgU4q-niOPoFvm97KMsnYe6_rZnpY';
  file = SpreadsheetApp.openById(fileID);
  triggers = ScriptApp.getUserTriggers(file);
  for (var i=0; i<triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  };
  
  // on edit the customer info form, re-run updateCropInformation
  ScriptApp.newTrigger('updateCropInformation')
  .forSpreadsheet('1cDnvklKb-hYss7AgU4q-niOPoFvm97KMsnYe6_rZnpY')
  .onEdit()
  .create();
  
  // CSAFormGenerator
  // remove all existing triggers
  fileID = '18ai-BbiwQsI_-bpoSjwKnaCYdph2or1YIeom0_I_1jI';
  file = FormApp.openById(fileID);
  triggers = ScriptApp.getUserTriggers(file);
  for (var i=0; i<triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  };
  // on filling out the CSA Options This Week form & submitting:
  // * generate a new form for the customers
  // * send an email to the user telling them what they can do next
  ScriptApp.newTrigger('generateCustomerPreferencesForm')
  .forForm('18ai-BbiwQsI_-bpoSjwKnaCYdph2or1YIeom0_I_1jI')
  .onFormSubmit()
  .create();
}