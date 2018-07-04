
function discernFormOrder() {
  var formId = '1WYe7Dxq_Su_msmJBuBYb9I2UVsyUswaOAni_CBduURk';
  var formResponses = FormApp.openById(formId).getResponses();
  for (var i=0; i<formResponses.length; i++) {
    var formItems = formResponses[i].getItemResponses();
    for (var r=0; r<formItems.length; r++) {
      Logger.log(formItems[r].getItem().getTitle());
    }
  }
}

function addFixedDate() {
  var formId = "1md_O9gqXvimfCu6Ti3sSlxi4Q2RHipUTrlZE6KdtBnI";
  var realDate = new Date('2018-06-28T12:00:00');
  Drive.Properties.insert({key:'csaDate', value:realDate, visibility:'PUBLIC'}, formId);
  
} 

function removeBrokenDate() {
  var formId = "1md_O9gqXvimfCu6Ti3sSlxi4Q2RHipUTrlZE6KdtBnI";
  var realDate = new Date('2018-06-28T12:00:00');
  Drive.Properties.remove(formId, 'csaDate', {visibility:'PUBLIC'});
}  

function checkForErrors() {
  theFormUrl = 'https://docs.google.com/forms/d/1zOnabzvwahBaY7W8y5HhEnGjfQ_R7GKSfZ9NdFiuP1A/edit';
  processCustomerResponses(theFormUrl);
}


function retroactivelySetProperties() {
  theFormId = '1zOnabzvwahBaY7W8y5HhEnGjfQ_R7GKSfZ9NdFiuP1A';
  
  function setAdvProperties(key, val) {
    Drive.Properties.insert({key:key, value:val, visibility:'PUBLIC'}, theFormId);
  }
  
  season='2018 Spring';
  weekNum=8;
  date='June 20, 2018';
  staffFormId='18ai-BbiwQsI_-bpoSjwKnaCYdph2or1YIeom0_I_1jI';
  
  setAdvProperties("season", season);
  setAdvProperties("weekNum", weekNum);
  setAdvProperties("csaDate", date);
  setAdvProperties("generatedById", staffFormId);
}


function checkProperties() {
  var theFormId = '1md_O9gqXvimfCu6Ti3sSlxi4Q2RHipUTrlZE6KdtBnI';
  function getFileProperty(fileId, key) {
    // assumes the property is PUBLIC
    return Drive.Properties.get(fileId, key, {visibility:'PUBLIC'}).value;
  }
  var objectProperties = Drive.Properties.list(theFormId);
 
  
  for (var i=0; i<objectProperties.items.length; i++) {
    Logger.log(objectProperties.items[i].key + ": " + getFileProperty(theFormId, objectProperties.items[i].key));
  }
  
}


function exploringDocs() {
  var docId = '1wnLWu1v4XUdWPGBWkF0O4wCnvsJHRFhoA61LL__LPcQ';
  var templateDoc = DocumentApp.openById(docId);
  var docBody = templateDoc.getBody();
  var mainTable = docBody.findElement(DocumentApp.ElementType.TABLE).getElement().asTable();
  
  // let's pretend we have to fill out the core, elective, herbs thing...
  coreVegetables = ['potatoes', 'squash', 'radishes'];
  electiveVegetables = ['eggplant', 'garlic', 'kale'];
  herbs = ['basil', 'dill', 'marjoram'];
  customerResponse = {name:"Daniel", shareSize:"1.0", vacation:"0",
                      choices:{potatoes:1, squash:1, kale:2, garlic:1, eggplant:0, radishes:0, basil:1, dill:1, marjoram:0} };
 
  // we'll have to do this for lots of different key-value pairs...
  var matchPos = mainTable.findText("\\$\\{CoreVegetables\\}");
  var matchText = matchPos.getElement().asText();
  matchText.deleteText(matchPos.getStartOffset(), matchPos.getEndOffsetInclusive());
  
  // this does exactly what I want it to!!!
  var startPos = matchPos.getStartOffset();
  var newText;
  for (var i=0; i<coreVegetables.length; i++) {
    newText = "☐ " + coreVegetables[i];
    matchText.appendText(newText);
    if (customerResponse.choices[coreVegetables[i]] == 0) {
      matchText.setStrikethrough(startPos, startPos + newText.length, true);
    } else {
      matchText.setStrikethrough(startPos, startPos + newText.length, false);
    }
    matchText.appendText('\n');
    startPos += newText.length + 1;
  }
               
}



  