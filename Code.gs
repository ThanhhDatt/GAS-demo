function createAndSendEmail() {
  // Create a Doc file
  var doc = DocumentApp.create('Thank You');
  
  // Create a message by using a text array
  var docText = DocumentApp.getActiveDocument();
  var body = docText.getBody();
  var text = [];
  for(var i=0; i<body.getNumChildren(); i++){
    var para = body.getChild(i);
    text[i] = para.getText();
  }
  
  // Append text to document 'Message'
  for(var i=0; i<body.getNumChildren(); i++){
    doc.getBody().appendParagraph(text[i]);
  }
  
  // Get url of the document
  var url = doc.getUrl();
  
  // Get receiver email
  var email = 'thanhdat.9620@gmail.com';
  
  // Get the name of the document and use it as subject of email
  var subject = doc.getName();
  
  // Link to doc
  var messageBody = doc.getBody().getText();
  
  // Send email
  GmailApp.sendEmail(email, subject, messageBody);
  
}
