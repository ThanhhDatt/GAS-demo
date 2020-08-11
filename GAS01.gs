function sendEmail() {
  // Create a Google Docs file named Message
  var doc = DocumentApp.create('Message');
  
  // Get content from current document
  var content = DocumentApp.getActiveDocument().getBody();
  var text = [];
  for(var i=0; i<content.getBody().getNumChildren(); i++){
    var para = content.getChild(i);
    text[i] = para.getText();
  }
  
  // Append text to document 'Message'
  for(var i=0; i<body.getNumChildren(); i++){
    doc.getBody().appendParagraph(text[i]);
  }
  
  // Email content
  var body = doc.getBody().getText();
  
  // Get url of the documen
  var url = doc.getUrl();
  
  // Create the name of message
  var subject = 'This is a message from Thanh Dat';
  
  // Parse an email address 
  var email = 'thanhdat.vnu@gmail.com';
  
  GmailApp.sendEmail(email, subject, body);
  
}
